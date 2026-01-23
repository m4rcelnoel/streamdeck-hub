"""Button state service for counters and timers."""
import json
import os
import threading
from typing import Dict, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# State file path
STATE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "button_states.json")


class CounterState:
    """State for a counter button."""
    def __init__(self, value: int = 0, step: int = 1, min_val: Optional[int] = None, max_val: Optional[int] = None):
        self.value = value
        self.step = step
        self.min_val = min_val
        self.max_val = max_val

    def increment(self) -> int:
        self.value += self.step
        if self.max_val is not None:
            self.value = min(self.value, self.max_val)
        return self.value

    def decrement(self) -> int:
        self.value -= self.step
        if self.min_val is not None:
            self.value = max(self.value, self.min_val)
        return self.value

    def reset(self) -> int:
        self.value = 0
        return self.value

    def to_dict(self) -> dict:
        return {
            "value": self.value,
            "step": self.step,
            "min_val": self.min_val,
            "max_val": self.max_val
        }

    @classmethod
    def from_dict(cls, data: dict) -> "CounterState":
        return cls(
            value=data.get("value", 0),
            step=data.get("step", 1),
            min_val=data.get("min_val"),
            max_val=data.get("max_val")
        )


class TimerState:
    """State for a timer button."""
    def __init__(self, is_countdown: bool = False, duration_ms: int = 0):
        self.is_countdown = is_countdown
        self.duration_ms = duration_ms  # For countdown timers
        self.start_time: Optional[float] = None  # Unix timestamp when started
        self.elapsed_before_pause: int = 0  # Milliseconds elapsed before last pause
        self.is_running: bool = False

    def start(self):
        """Start or resume the timer."""
        if not self.is_running:
            self.start_time = datetime.now().timestamp()
            self.is_running = True

    def pause(self):
        """Pause the timer."""
        if self.is_running and self.start_time:
            elapsed = int((datetime.now().timestamp() - self.start_time) * 1000)
            self.elapsed_before_pause += elapsed
            self.is_running = False
            self.start_time = None

    def toggle(self):
        """Toggle between running and paused."""
        if self.is_running:
            self.pause()
        else:
            self.start()

    def reset(self):
        """Reset the timer."""
        self.start_time = None
        self.elapsed_before_pause = 0
        self.is_running = False

    def get_elapsed_ms(self) -> int:
        """Get total elapsed time in milliseconds."""
        total = self.elapsed_before_pause
        if self.is_running and self.start_time:
            total += int((datetime.now().timestamp() - self.start_time) * 1000)
        return total

    def get_remaining_ms(self) -> int:
        """Get remaining time for countdown timers."""
        if not self.is_countdown:
            return 0
        remaining = self.duration_ms - self.get_elapsed_ms()
        return max(0, remaining)

    def is_finished(self) -> bool:
        """Check if countdown timer has finished."""
        if not self.is_countdown:
            return False
        return self.get_remaining_ms() <= 0

    def get_display_value(self) -> str:
        """Get the display string for this timer."""
        if self.is_countdown:
            ms = self.get_remaining_ms()
        else:
            ms = self.get_elapsed_ms()
        return self._format_duration(ms)

    def _format_duration(self, ms: int) -> str:
        """Format milliseconds as duration string."""
        total_seconds = ms // 1000
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        if hours > 0:
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        return f"{minutes}:{seconds:02d}"

    def to_dict(self) -> dict:
        return {
            "is_countdown": self.is_countdown,
            "duration_ms": self.duration_ms,
            "elapsed_before_pause": self.elapsed_before_pause,
            "is_running": self.is_running,
            "start_time": self.start_time
        }

    @classmethod
    def from_dict(cls, data: dict) -> "TimerState":
        timer = cls(
            is_countdown=data.get("is_countdown", False),
            duration_ms=data.get("duration_ms", 0)
        )
        timer.elapsed_before_pause = data.get("elapsed_before_pause", 0)
        timer.is_running = data.get("is_running", False)
        timer.start_time = data.get("start_time")
        return timer


class ButtonStateService:
    """Service to manage button states (counters, timers)."""

    def __init__(self):
        self._counters: Dict[str, CounterState] = {}  # key: "profile_id:position:page"
        self._timers: Dict[str, TimerState] = {}
        self._lock = threading.Lock()
        self._load_state()

    def _make_key(self, profile_id: str, position: int, page: int = 0) -> str:
        return f"{profile_id}:{position}:{page}"

    def _load_state(self):
        """Load state from file."""
        try:
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, 'r') as f:
                    data = json.load(f)
                    for key, counter_data in data.get("counters", {}).items():
                        self._counters[key] = CounterState.from_dict(counter_data)
                    for key, timer_data in data.get("timers", {}).items():
                        self._timers[key] = TimerState.from_dict(timer_data)
                logger.info(f"Loaded button states: {len(self._counters)} counters, {len(self._timers)} timers")
        except Exception as e:
            logger.error(f"Failed to load button states: {e}")

    def _save_state(self):
        """Save state to file."""
        try:
            os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
            data = {
                "counters": {k: v.to_dict() for k, v in self._counters.items()},
                "timers": {k: v.to_dict() for k, v in self._timers.items()}
            }
            with open(STATE_FILE, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save button states: {e}")

    # Counter methods
    def get_counter(self, profile_id: str, position: int, page: int = 0) -> CounterState:
        """Get or create a counter state."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key not in self._counters:
                self._counters[key] = CounterState()
            return self._counters[key]

    def increment_counter(self, profile_id: str, position: int, page: int = 0, config: Dict[str, Any] = None) -> int:
        """Increment a counter and return new value."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key not in self._counters:
                step = config.get("step", 1) if config else 1
                min_val = config.get("min") if config else None
                max_val = config.get("max") if config else None
                self._counters[key] = CounterState(step=step, min_val=min_val, max_val=max_val)
            value = self._counters[key].increment()
            self._save_state()
            return value

    def decrement_counter(self, profile_id: str, position: int, page: int = 0, config: Dict[str, Any] = None) -> int:
        """Decrement a counter and return new value."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key not in self._counters:
                step = config.get("step", 1) if config else 1
                min_val = config.get("min") if config else None
                max_val = config.get("max") if config else None
                self._counters[key] = CounterState(step=step, min_val=min_val, max_val=max_val)
            value = self._counters[key].decrement()
            self._save_state()
            return value

    def reset_counter(self, profile_id: str, position: int, page: int = 0) -> int:
        """Reset a counter to 0."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key in self._counters:
                self._counters[key].reset()
                self._save_state()
            return 0

    def get_counter_value(self, profile_id: str, position: int, page: int = 0) -> int:
        """Get the current counter value."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key in self._counters:
                return self._counters[key].value
            return 0

    # Timer methods
    def get_timer(self, profile_id: str, position: int, page: int = 0) -> TimerState:
        """Get or create a timer state."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key not in self._timers:
                self._timers[key] = TimerState()
            return self._timers[key]

    def toggle_timer(self, profile_id: str, position: int, page: int = 0, config: Dict[str, Any] = None) -> TimerState:
        """Toggle timer start/pause."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key not in self._timers:
                is_countdown = config.get("format") == "countdown" if config else False
                duration = config.get("duration", 300000) if config else 300000
                self._timers[key] = TimerState(is_countdown=is_countdown, duration_ms=duration)
            self._timers[key].toggle()
            self._save_state()
            return self._timers[key]

    def reset_timer(self, profile_id: str, position: int, page: int = 0) -> TimerState:
        """Reset a timer."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key in self._timers:
                self._timers[key].reset()
                self._save_state()
            return self._timers.get(key, TimerState())

    def get_timer_display(self, profile_id: str, position: int, page: int = 0, config: Dict[str, Any] = None) -> str:
        """Get the display string for a timer."""
        key = self._make_key(profile_id, position, page)
        with self._lock:
            if key not in self._timers:
                # Return initial display based on config
                is_countdown = config.get("format") == "countdown" if config else False
                if is_countdown:
                    duration = config.get("duration", 300000) if config else 300000
                    return self._format_duration(duration)
                return "0:00"
            return self._timers[key].get_display_value()

    def _format_duration(self, ms: int) -> str:
        """Format milliseconds as duration string."""
        total_seconds = ms // 1000
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        if hours > 0:
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        return f"{minutes}:{seconds:02d}"


# Global instance
button_state_service = ButtonStateService()
