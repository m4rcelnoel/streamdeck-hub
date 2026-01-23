"""Hotkey service for sending keyboard shortcuts."""
import asyncio
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Try to import pynput for local hotkey support
try:
    from pynput.keyboard import Key, Controller, KeyCode
    PYNPUT_AVAILABLE = True
except ImportError:
    PYNPUT_AVAILABLE = False
    Key = None
    Controller = None
    KeyCode = None

# Key mappings
KEY_MAP = {
    # Modifiers
    'ctrl': 'ctrl_l',
    'control': 'ctrl_l',
    'ctrl_l': 'ctrl_l',
    'ctrl_r': 'ctrl_r',
    'alt': 'alt_l',
    'alt_l': 'alt_l',
    'alt_r': 'alt_r',
    'shift': 'shift_l',
    'shift_l': 'shift_l',
    'shift_r': 'shift_r',
    'cmd': 'cmd_l',
    'command': 'cmd_l',
    'super': 'cmd_l',
    'win': 'cmd_l',
    'meta': 'cmd_l',

    # Function keys
    'f1': 'f1', 'f2': 'f2', 'f3': 'f3', 'f4': 'f4',
    'f5': 'f5', 'f6': 'f6', 'f7': 'f7', 'f8': 'f8',
    'f9': 'f9', 'f10': 'f10', 'f11': 'f11', 'f12': 'f12',

    # Special keys
    'enter': 'enter',
    'return': 'enter',
    'tab': 'tab',
    'space': 'space',
    'backspace': 'backspace',
    'delete': 'delete',
    'del': 'delete',
    'escape': 'esc',
    'esc': 'esc',
    'home': 'home',
    'end': 'end',
    'pageup': 'page_up',
    'page_up': 'page_up',
    'pagedown': 'page_down',
    'page_down': 'page_down',
    'insert': 'insert',
    'ins': 'insert',

    # Arrow keys
    'up': 'up',
    'down': 'down',
    'left': 'left',
    'right': 'right',

    # Media keys
    'play': 'media_play_pause',
    'pause': 'media_play_pause',
    'playpause': 'media_play_pause',
    'media_play_pause': 'media_play_pause',
    'next': 'media_next',
    'media_next': 'media_next',
    'previous': 'media_previous',
    'prev': 'media_previous',
    'media_previous': 'media_previous',
    'mute': 'media_volume_mute',
    'media_volume_mute': 'media_volume_mute',
    'volumeup': 'media_volume_up',
    'volume_up': 'media_volume_up',
    'media_volume_up': 'media_volume_up',
    'volumedown': 'media_volume_down',
    'volume_down': 'media_volume_down',
    'media_volume_down': 'media_volume_down',

    # Print screen
    'printscreen': 'print_screen',
    'print_screen': 'print_screen',
    'prtsc': 'print_screen',

    # Caps/Num/Scroll lock
    'capslock': 'caps_lock',
    'caps_lock': 'caps_lock',
    'numlock': 'num_lock',
    'num_lock': 'num_lock',
    'scrolllock': 'scroll_lock',
    'scroll_lock': 'scroll_lock',
}


class HotkeyService:
    """Service to send keyboard shortcuts."""

    def __init__(self):
        self._keyboard = None
        if PYNPUT_AVAILABLE:
            self._keyboard = Controller()

    @property
    def is_available(self) -> bool:
        """Check if hotkey functionality is available."""
        return PYNPUT_AVAILABLE and self._keyboard is not None

    def _get_key(self, key_str: str):
        """Convert a key string to a pynput key."""
        if not PYNPUT_AVAILABLE:
            return None

        key_lower = key_str.lower().strip()

        # Check if it's a mapped special key
        if key_lower in KEY_MAP:
            key_name = KEY_MAP[key_lower]
            try:
                return getattr(Key, key_name)
            except AttributeError:
                pass

        # Single character
        if len(key_str) == 1:
            return KeyCode.from_char(key_str)

        # Try as Key attribute directly
        try:
            return getattr(Key, key_lower)
        except AttributeError:
            pass

        logger.warning(f"Unknown key: {key_str}")
        return None

    async def send_hotkey(self, keys: List[str], hold_time: int = 0) -> Dict[str, Any]:
        """Send a keyboard shortcut.

        Args:
            keys: List of keys to press (e.g., ["ctrl", "shift", "a"])
            hold_time: Milliseconds to hold the keys (0 for instant press)

        Returns:
            Result dict with success status
        """
        if not self.is_available:
            return {
                "success": False,
                "error": "Pynput not available. Install with: pip install pynput"
            }

        if not keys:
            return {"success": False, "error": "No keys specified"}

        try:
            # Convert key strings to pynput keys
            pynput_keys = []
            for key_str in keys:
                key = self._get_key(key_str)
                if key is None:
                    return {"success": False, "error": f"Unknown key: {key_str}"}
                pynput_keys.append(key)

            # Press all keys
            for key in pynput_keys:
                self._keyboard.press(key)

            # Hold if specified
            if hold_time > 0:
                await asyncio.sleep(hold_time / 1000)

            # Release all keys in reverse order
            for key in reversed(pynput_keys):
                self._keyboard.release(key)

            logger.info(f"Sent hotkey: {'+'.join(keys)}")
            return {"success": True, "keys": keys}

        except Exception as e:
            logger.error(f"Error sending hotkey: {e}")
            return {"success": False, "error": str(e)}

    def get_available_keys(self) -> Dict[str, List[str]]:
        """Get list of available keys organized by category."""
        return {
            "modifiers": ["ctrl", "alt", "shift", "cmd/super/win"],
            "function": [f"f{i}" for i in range(1, 13)],
            "navigation": ["up", "down", "left", "right", "home", "end", "pageup", "pagedown"],
            "editing": ["enter", "tab", "space", "backspace", "delete", "insert", "escape"],
            "media": ["play/pause", "next", "previous", "mute", "volumeup", "volumedown"],
            "other": ["printscreen", "capslock", "numlock", "scrolllock"],
            "letters": ["a-z"],
            "numbers": ["0-9"],
        }


# Global instance
hotkey_service = HotkeyService()
