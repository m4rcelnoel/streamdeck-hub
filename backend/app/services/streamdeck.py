import asyncio
import threading
import json
from typing import Dict, Optional, Callable, Any, List
from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.Transport.Transport import TransportError
from sqlalchemy.orm import Session
import logging

from ..models.device import Device
from ..models.profile import Profile
from ..models.button import Button
from ..utils.image import image_renderer
from .websocket import websocket_manager
from .data_fetcher import data_fetcher

logger = logging.getLogger(__name__)


class DeviceState:
    """Tracks runtime state for a connected device."""
    def __init__(self):
        self.current_page: int = 0
        self.folder_stack: list = []  # Stack of (profile_id, page) tuples for back navigation
        self.data_refresh_timers: Dict[int, threading.Timer] = {}  # position -> Timer


class StreamDeckService:
    def __init__(self):
        self.device_manager = DeviceManager()
        self.connected_decks: Dict[str, Any] = {}  # serial -> deck object
        self.device_states: Dict[str, DeviceState] = {}  # serial -> DeviceState
        self._running = False
        self._monitor_thread: Optional[threading.Thread] = None
        self._db_session_factory: Optional[Callable] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_db_session_factory(self, factory: Callable):
        """Set the database session factory for background operations."""
        self._db_session_factory = factory

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        """Set the event loop for async operations."""
        self._loop = loop

    def start(self):
        """Start the Stream Deck monitoring service."""
        if self._running:
            return

        self._running = True
        self._monitor_thread = threading.Thread(target=self._monitor_devices, daemon=True)
        self._monitor_thread.start()
        logger.info("Stream Deck monitoring service started")

    def stop(self):
        """Stop the Stream Deck monitoring service."""
        self._running = False

        # Cancel all data refresh timers
        for serial, state in self.device_states.items():
            for timer in state.data_refresh_timers.values():
                timer.cancel()
            state.data_refresh_timers.clear()

        for serial, deck in list(self.connected_decks.items()):
            try:
                deck.reset()
                deck.close()
            except Exception as e:
                logger.error(f"Error closing deck {serial}: {e}")
        self.connected_decks.clear()
        self.device_states.clear()
        logger.info("Stream Deck monitoring service stopped")

    def _monitor_devices(self):
        """Background thread to monitor device connections."""
        while self._running:
            try:
                self._scan_devices()
            except Exception as e:
                logger.error(f"Error scanning devices: {e}")

            # Sleep for a bit before next scan
            threading.Event().wait(2.0)

    def _scan_devices(self):
        """Scan for new devices and detect disconnections."""
        try:
            decks = self.device_manager.enumerate()
        except Exception as e:
            logger.error(f"Failed to enumerate devices: {e}")
            return

        current_serials = set()

        for deck in decks:
            if not deck.is_visual():
                continue

            try:
                # Check if already connected by trying to match via device path
                already_open = False
                for serial, existing_deck in self.connected_decks.items():
                    try:
                        # If we can still communicate, it's connected
                        existing_deck.get_serial_number()
                        current_serials.add(serial)
                        already_open = True
                    except Exception:
                        pass

                if already_open:
                    continue

                deck.open()
                serial = deck.get_serial_number()
                current_serials.add(serial)

                if serial not in self.connected_decks:
                    self._on_device_connected(deck, serial)
            except Exception as e:
                # Only log once per scan cycle to avoid spam
                if not hasattr(self, '_last_error') or self._last_error != str(e):
                    self._last_error = str(e)
                    if "Could not open HID device" in str(e):
                        logger.error(f"Permission denied opening Stream Deck. Run with sudo or set up udev rules.")
                    else:
                        logger.error(f"Error opening deck: {e}")

        # Check for disconnections
        disconnected = set(self.connected_decks.keys()) - current_serials
        for serial in disconnected:
            self._on_device_disconnected(serial)

    def _on_device_connected(self, deck, serial: str):
        """Handle a newly connected device."""
        logger.info(f"Device connected: {serial}")
        self.connected_decks[serial] = deck
        self.device_states[serial] = DeviceState()

        # Set up the deck
        deck.set_brightness(50)
        deck.set_key_callback(lambda d, k, s: self._key_callback(serial, k, s))

        # Store device in database
        if self._db_session_factory:
            db = self._db_session_factory()
            try:
                device = db.query(Device).filter(Device.serial_number == serial).first()
                if not device:
                    device = Device(
                        serial_number=serial,
                        deck_type=deck.deck_type(),
                        key_count=deck.key_count(),
                        firmware_version=deck.get_firmware_version(),
                        name=f"{deck.deck_type()} ({serial[-4:]})"
                    )
                    db.add(device)
                    db.commit()
                    db.refresh(device)

                # Load active profile if set
                if device.active_profile_id:
                    self._apply_profile(db, device, deck)
                else:
                    self._apply_default_layout(deck)

                # Notify via WebSocket
                if self._loop:
                    asyncio.run_coroutine_threadsafe(
                        websocket_manager.send_device_connected({
                            "id": device.id,
                            "serial_number": serial,
                            "deck_type": device.deck_type,
                            "key_count": device.key_count,
                            "name": device.name
                        }),
                        self._loop
                    )
            finally:
                db.close()

    def _on_device_disconnected(self, serial: str):
        """Handle a disconnected device."""
        logger.info(f"Device disconnected: {serial}")
        deck = self.connected_decks.pop(serial, None)
        state = self.device_states.pop(serial, None)

        # Cancel all data refresh timers for this device
        if state:
            for timer in state.data_refresh_timers.values():
                timer.cancel()
            state.data_refresh_timers.clear()

        if deck:
            try:
                deck.close()
            except Exception:
                pass

        # Notify via WebSocket
        if self._loop and self._db_session_factory:
            db = self._db_session_factory()
            try:
                device = db.query(Device).filter(Device.serial_number == serial).first()
                if device:
                    asyncio.run_coroutine_threadsafe(
                        websocket_manager.send_device_disconnected(device.id),
                        self._loop
                    )
            finally:
                db.close()

    def _key_callback(self, serial: str, key: int, state: bool):
        """Handle key press/release events."""
        if self._loop:
            # Get profile_id for this device
            profile_id = None
            if self._db_session_factory:
                db = self._db_session_factory()
                try:
                    device = db.query(Device).filter(Device.serial_number == serial).first()
                    if device:
                        profile_id = device.active_profile_id
                finally:
                    db.close()

            if state:
                asyncio.run_coroutine_threadsafe(
                    websocket_manager.send_button_pressed(serial, key, profile_id),
                    self._loop
                )
                # Execute action
                self._execute_button_action(serial, key)
            else:
                asyncio.run_coroutine_threadsafe(
                    websocket_manager.send_button_released(serial, key, profile_id),
                    self._loop
                )

    def _execute_button_action(self, serial: str, key: int):
        """Execute the action associated with a button."""
        if not self._db_session_factory:
            return

        db = self._db_session_factory()
        try:
            device = db.query(Device).filter(Device.serial_number == serial).first()
            if not device or not device.active_profile_id:
                return

            state = self.device_states.get(serial)
            current_page = state.current_page if state else 0

            # Get button for current page
            button = db.query(Button).filter(
                Button.profile_id == device.active_profile_id,
                Button.position == key,
                Button.page == current_page
            ).first()

            # Handle data source button presses (counter/timer)
            if button and button.data_source in ("counter", "timer"):
                self._handle_data_button_press(serial, device, button, current_page, db)
                return

            if button and button.action_id:
                from .action_executor import action_executor
                action = button.action
                if action:
                    # Handle navigation actions locally
                    action_type = action.action_type
                    config = json.loads(action.config) if isinstance(action.config, str) else action.config

                    if action_type == "next_page":
                        self._navigate_page(serial, device, db, 1)
                    elif action_type == "prev_page":
                        self._navigate_page(serial, device, db, -1)
                    elif action_type == "go_to_page":
                        target_page = config.get("page", 0)
                        self._go_to_page(serial, device, db, target_page)
                    elif action_type == "open_folder":
                        folder_profile_id = config.get("profile_id")
                        if folder_profile_id:
                            self._open_folder(serial, device, db, folder_profile_id)
                    elif action_type == "go_back":
                        self._go_back(serial, device, db)
                    else:
                        # Execute other actions normally
                        asyncio.run_coroutine_threadsafe(
                            action_executor.execute(action),
                            self._loop
                        )
        finally:
            db.close()

    def _handle_data_button_press(self, serial: str, device: Device, button: Button, current_page: int, db: Session):
        """Handle button press for counter/timer data source buttons."""
        from .button_state import button_state_service

        deck = self.connected_decks.get(serial)
        if not deck:
            return

        profile_id = device.active_profile_id
        position = button.position
        data_config = button.data_config or {}

        if button.data_source == "counter":
            # Increment counter on press
            button_state_service.increment_counter(profile_id, position, current_page, data_config)

        elif button.data_source == "timer":
            # Toggle timer on press
            config = data_config.copy() if data_config else {}
            config["format"] = button.data_format
            button_state_service.toggle_timer(profile_id, position, current_page, config)

        # Update the button display immediately
        label = data_fetcher.fetch(
            button.data_source,
            button.data_format,
            button.data_config,
            profile_id=profile_id,
            position=position,
            page=current_page
        )

        image = image_renderer.render_key_image(
            deck,
            icon_path=button.icon_path,
            label=label,
            background_color=button.background_color,
            icon_color=button.icon_color
        )

        with deck:
            deck.set_key_image(position, image)

        # Notify via WebSocket
        if self._loop:
            asyncio.run_coroutine_threadsafe(
                websocket_manager.send_state_changed("data_updated", {
                    "profile_id": profile_id,
                    "position": position,
                    "page": current_page,
                    "data_source": button.data_source,
                    "value": label
                }),
                self._loop
            )

    def _get_max_page(self, db: Session, profile_id: str) -> int:
        """Get the maximum page number for a profile."""
        from sqlalchemy import func
        result = db.query(func.max(Button.page)).filter(
            Button.profile_id == profile_id
        ).scalar()
        return result if result is not None else 0

    def _navigate_page(self, serial: str, device: Device, db: Session, direction: int):
        """Navigate to next or previous page."""
        state = self.device_states.get(serial)
        if not state:
            return

        max_page = self._get_max_page(db, device.active_profile_id)
        new_page = state.current_page + direction

        # Wrap around or clamp
        if new_page < 0:
            new_page = max_page
        elif new_page > max_page:
            new_page = 0

        state.current_page = new_page
        deck = self.connected_decks.get(serial)
        if deck:
            self._apply_profile(db, device, deck, new_page)

        # Notify via WebSocket
        if self._loop:
            asyncio.run_coroutine_threadsafe(
                websocket_manager.send_state_changed("page_changed", {
                    "device_id": device.id,
                    "page": new_page
                }),
                self._loop
            )

    def _go_to_page(self, serial: str, device: Device, db: Session, page: int):
        """Go to a specific page."""
        state = self.device_states.get(serial)
        if not state:
            return

        state.current_page = page
        deck = self.connected_decks.get(serial)
        if deck:
            self._apply_profile(db, device, deck, page)

        if self._loop:
            asyncio.run_coroutine_threadsafe(
                websocket_manager.send_state_changed("page_changed", {
                    "device_id": device.id,
                    "page": page
                }),
                self._loop
            )

    def _open_folder(self, serial: str, device: Device, db: Session, folder_profile_id: str):
        """Open a folder (switch to another profile with back navigation)."""
        state = self.device_states.get(serial)
        if not state:
            return

        # Push current profile and page to stack
        state.folder_stack.append((device.active_profile_id, state.current_page))

        # Switch to folder profile
        device.active_profile_id = folder_profile_id
        state.current_page = 0
        db.commit()

        deck = self.connected_decks.get(serial)
        if deck:
            self._apply_profile(db, device, deck, 0)

        if self._loop:
            asyncio.run_coroutine_threadsafe(
                websocket_manager.send_state_changed("folder_opened", {
                    "device_id": device.id,
                    "profile_id": folder_profile_id
                }),
                self._loop
            )

    def _go_back(self, serial: str, device: Device, db: Session):
        """Go back to the previous folder/profile."""
        state = self.device_states.get(serial)
        if not state or not state.folder_stack:
            return

        # Pop previous profile and page from stack
        prev_profile_id, prev_page = state.folder_stack.pop()

        # Switch back
        device.active_profile_id = prev_profile_id
        state.current_page = prev_page
        db.commit()

        deck = self.connected_decks.get(serial)
        if deck:
            self._apply_profile(db, device, deck, prev_page)

        if self._loop:
            asyncio.run_coroutine_threadsafe(
                websocket_manager.send_state_changed("folder_closed", {
                    "device_id": device.id,
                    "profile_id": prev_profile_id,
                    "page": prev_page
                }),
                self._loop
            )

    def _apply_profile(self, db: Session, device: Device, deck, page: int = None):
        """Apply a profile to a device, optionally filtering by page."""
        serial = device.serial_number
        state = self.device_states.get(serial)

        # Cancel any existing data refresh timers
        if state:
            for timer in state.data_refresh_timers.values():
                timer.cancel()
            state.data_refresh_timers.clear()

        # Use provided page, or current page from state, or default to 0
        if page is not None:
            current_page = page
            if state:
                state.current_page = page
        elif state:
            current_page = state.current_page
        else:
            current_page = 0

        # Get buttons for the current page
        buttons = db.query(Button).filter(
            Button.profile_id == device.active_profile_id,
            Button.page == current_page
        ).all()

        button_map = {b.position: b for b in buttons}

        for key in range(deck.key_count()):
            button = button_map.get(key)
            if button:
                # Get label - either from data source or static label
                label = button.label
                if button.data_source:
                    label = data_fetcher.fetch(
                        button.data_source,
                        button.data_format,
                        button.data_config,
                        profile_id=device.active_profile_id,
                        position=button.position,
                        page=current_page
                    )
                    # Set up refresh timer for this button
                    self._setup_data_refresh(serial, device, button, deck, current_page)

                image = image_renderer.render_key_image(
                    deck,
                    icon_path=button.icon_path,
                    label=label,
                    background_color=button.background_color,
                    icon_color=button.icon_color
                )
            else:
                image = image_renderer.render_blank_key(deck)

            with deck:
                deck.set_key_image(key, image)

    def _setup_data_refresh(self, serial: str, device: Device, button: Button, deck, current_page: int):
        """Set up periodic refresh for a data display button."""
        state = self.device_states.get(serial)
        if not state or not self._running:
            return

        # Determine refresh interval (default 5 seconds)
        interval_ms = button.refresh_interval or 5000
        if interval_ms <= 0:
            return  # Manual refresh only

        interval_sec = interval_ms / 1000.0

        def refresh_button():
            if not self._running or serial not in self.connected_decks:
                return

            try:
                # Fetch new data
                label = data_fetcher.fetch(
                    button.data_source,
                    button.data_format,
                    button.data_config,
                    profile_id=device.active_profile_id,
                    position=button.position,
                    page=current_page
                )

                # Render and update the button
                image = image_renderer.render_key_image(
                    deck,
                    icon_path=button.icon_path,
                    label=label,
                    background_color=button.background_color,
                    icon_color=button.icon_color
                )

                with deck:
                    deck.set_key_image(button.position, image)

                # Schedule next refresh
                if self._running and serial in self.connected_decks:
                    state = self.device_states.get(serial)
                    if state and state.current_page == current_page:
                        timer = threading.Timer(interval_sec, refresh_button)
                        timer.daemon = True
                        timer.start()
                        state.data_refresh_timers[button.position] = timer

            except Exception as e:
                logger.error(f"Error refreshing data button {button.position}: {e}")

        # Schedule first refresh
        timer = threading.Timer(interval_sec, refresh_button)
        timer.daemon = True
        timer.start()
        state.data_refresh_timers[button.position] = timer

    def _apply_default_layout(self, deck):
        """Apply a default layout to a newly connected device."""
        for key in range(deck.key_count()):
            image = image_renderer.render_key_image(
                deck,
                label=f"Key {key}"
            )
            with deck:
                deck.set_key_image(key, image)

    def get_connected_devices(self) -> list:
        """Get list of connected device serial numbers."""
        return list(self.connected_decks.keys())

    def is_device_connected(self, serial: str) -> bool:
        """Check if a device is connected."""
        return serial in self.connected_decks

    def set_brightness(self, serial: str, brightness: int) -> bool:
        """Set the brightness of a device."""
        deck = self.connected_decks.get(serial)
        if deck:
            with deck:
                deck.set_brightness(brightness)
            return True
        return False

    def update_button(self, serial: str, position: int, button: Button):
        """Update a single button on a device."""
        deck = self.connected_decks.get(serial)
        if not deck:
            return False

        state = self.device_states.get(serial)

        # Cancel existing timer for this button if any
        if state and position in state.data_refresh_timers:
            state.data_refresh_timers[position].cancel()
            del state.data_refresh_timers[position]

        # Get label - either from data source or static label
        label = button.label
        profile_id = None
        current_page = state.current_page if state else 0

        if self._db_session_factory:
            db = self._db_session_factory()
            try:
                device = db.query(Device).filter(Device.serial_number == serial).first()
                if device:
                    profile_id = device.active_profile_id
            finally:
                db.close()

        if button.data_source:
            label = data_fetcher.fetch(
                button.data_source,
                button.data_format,
                button.data_config,
                profile_id=profile_id,
                position=button.position,
                page=current_page
            )
            # Set up refresh timer if we have a device record
            if self._db_session_factory and state and profile_id:
                db = self._db_session_factory()
                try:
                    device = db.query(Device).filter(Device.serial_number == serial).first()
                    if device:
                        self._setup_data_refresh(serial, device, button, deck, current_page)
                finally:
                    db.close()

        image = image_renderer.render_key_image(
            deck,
            icon_path=button.icon_path,
            label=label,
            background_color=button.background_color,
            icon_color=button.icon_color
        )

        with deck:
            deck.set_key_image(position, image)
        return True

    def refresh_device(self, serial: str, db: Session, page: int = None):
        """Refresh the device display from database."""
        deck = self.connected_decks.get(serial)
        if not deck:
            return False

        device = db.query(Device).filter(Device.serial_number == serial).first()
        if device and device.active_profile_id:
            self._apply_profile(db, device, deck, page)
        else:
            self._apply_default_layout(deck)
        return True

    def get_device_state(self, serial: str) -> Optional[dict]:
        """Get the current state of a device."""
        state = self.device_states.get(serial)
        if state:
            return {
                "current_page": state.current_page,
                "folder_depth": len(state.folder_stack)
            }
        return None

    def set_page(self, serial: str, page: int, db: Session) -> bool:
        """Set the current page for a device."""
        state = self.device_states.get(serial)
        deck = self.connected_decks.get(serial)
        if not state or not deck:
            return False

        device = db.query(Device).filter(Device.serial_number == serial).first()
        if not device:
            return False

        state.current_page = page
        self._apply_profile(db, device, deck, page)
        return True

    def identify_device(self, serial: str) -> bool:
        """Flash the device for identification."""
        deck = self.connected_decks.get(serial)
        if not deck:
            return False

        def flash():
            for _ in range(3):
                with deck:
                    deck.set_brightness(100)
                threading.Event().wait(0.3)
                with deck:
                    deck.set_brightness(0)
                threading.Event().wait(0.3)
            with deck:
                deck.set_brightness(50)

        threading.Thread(target=flash, daemon=True).start()
        return True


streamdeck_service = StreamDeckService()
