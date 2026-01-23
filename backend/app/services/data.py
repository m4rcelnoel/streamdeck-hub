"""Data service for managing counter and timer state."""
import json
import os
import threading
import time
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# State file path
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
STATE_FILE = os.path.join(DATA_DIR, "interactive_state.json")


class DataService:
    """Service to manage counter and timer state."""

    def __init__(self):
        self._lock = threading.Lock()
        self._counters: Dict[str, int] = {}
        self._timers: Dict[str, Dict[str, Any]] = {}
        self._load_state()

    def _load_state(self):
        """Load state from file."""
        try:
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, 'r') as f:
                    data = json.load(f)
                    self._counters = data.get("counters", {})
                    self._timers = data.get("timers", {})
                    logger.info("Loaded interactive state from file")
        except Exception as e:
            logger.error(f"Failed to load state: {e}")

    def _save_state(self):
        """Save state to file."""
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(STATE_FILE, 'w') as f:
                json.dump({
                    "counters": self._counters,
                    "timers": self._timers,
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save state: {e}")

    # Counter operations
    def get_counter(self, key: str) -> int:
        """Get counter value."""
        with self._lock:
            return self._counters.get(key, 0)

    def set_counter(self, key: str, value: int) -> int:
        """Set counter value."""
        with self._lock:
            self._counters[key] = value
            self._save_state()
            return value

    def increment_counter(
        self,
        key: str,
        step: int = 1,
        min_value: Optional[int] = None,
        max_value: Optional[int] = None,
        wrap: bool = False
    ) -> int:
        """Increment counter by step."""
        with self._lock:
            current = self._counters.get(key, 0)
            new_value = current + step

            if max_value is not None and new_value > max_value:
                if wrap and min_value is not None:
                    new_value = min_value
                else:
                    new_value = max_value

            self._counters[key] = new_value
            self._save_state()
            return new_value

    def decrement_counter(
        self,
        key: str,
        step: int = 1,
        min_value: Optional[int] = None,
        max_value: Optional[int] = None,
        wrap: bool = False
    ) -> int:
        """Decrement counter by step."""
        with self._lock:
            current = self._counters.get(key, 0)
            new_value = current - step

            if min_value is not None and new_value < min_value:
                if wrap and max_value is not None:
                    new_value = max_value
                else:
                    new_value = min_value

            self._counters[key] = new_value
            self._save_state()
            return new_value

    def reset_counter(self, key: str) -> int:
        """Reset counter to 0."""
        with self._lock:
            self._counters[key] = 0
            self._save_state()
            return 0

    def get_all_counters(self) -> Dict[str, int]:
        """Get all counter values."""
        with self._lock:
            return dict(self._counters)

    # Timer operations
    def get_timer(self, key: str) -> Optional[Dict[str, Any]]:
        """Get timer state."""
        with self._lock:
            timer = self._timers.get(key)
            if not timer:
                return None

            # Calculate current elapsed time
            elapsed = timer.get("elapsed", 0)
            if timer.get("is_running") and timer.get("started_at"):
                elapsed += time.time() - timer["started_at"]

            return {
                "is_running": timer.get("is_running", False),
                "mode": timer.get("mode", "stopwatch"),
                "duration": timer.get("duration", 0),
                "elapsed": elapsed,
                "remaining": max(0, timer.get("duration", 0) - elapsed) if timer.get("mode") == "countdown" else None,
            }

    def start_timer(self, key: str, mode: str = "stopwatch", duration: int = 0) -> Dict[str, Any]:
        """Start or restart a timer."""
        with self._lock:
            self._timers[key] = {
                "is_running": True,
                "mode": mode,
                "duration": duration,
                "elapsed": 0,
                "started_at": time.time(),
            }
            self._save_state()
            return self.get_timer(key)

    def pause_timer(self, key: str) -> Optional[Dict[str, Any]]:
        """Pause a running timer."""
        with self._lock:
            timer = self._timers.get(key)
            if not timer:
                return None

            if timer.get("is_running") and timer.get("started_at"):
                # Calculate elapsed time and store it
                elapsed = timer.get("elapsed", 0) + (time.time() - timer["started_at"])
                timer["elapsed"] = elapsed
                timer["is_running"] = False
                timer["started_at"] = None
                self._save_state()

            return self.get_timer(key)

    def resume_timer(self, key: str) -> Optional[Dict[str, Any]]:
        """Resume a paused timer."""
        with self._lock:
            timer = self._timers.get(key)
            if not timer:
                return None

            if not timer.get("is_running"):
                timer["is_running"] = True
                timer["started_at"] = time.time()
                self._save_state()

            return self.get_timer(key)

    def toggle_timer(self, key: str, mode: str = "stopwatch", duration: int = 0) -> Dict[str, Any]:
        """Toggle timer between running and paused. Start if not exists."""
        with self._lock:
            timer = self._timers.get(key)

            if not timer:
                # Start new timer
                self._timers[key] = {
                    "is_running": True,
                    "mode": mode,
                    "duration": duration,
                    "elapsed": 0,
                    "started_at": time.time(),
                }
            elif timer.get("is_running"):
                # Pause
                elapsed = timer.get("elapsed", 0) + (time.time() - timer.get("started_at", time.time()))
                timer["elapsed"] = elapsed
                timer["is_running"] = False
                timer["started_at"] = None
            else:
                # Resume
                timer["is_running"] = True
                timer["started_at"] = time.time()

            self._save_state()
            return self.get_timer(key)

    def reset_timer(self, key: str) -> Dict[str, Any]:
        """Reset a timer."""
        with self._lock:
            timer = self._timers.get(key, {})
            self._timers[key] = {
                "is_running": False,
                "mode": timer.get("mode", "stopwatch"),
                "duration": timer.get("duration", 0),
                "elapsed": 0,
                "started_at": None,
            }
            self._save_state()
            return self.get_timer(key)

    def get_all_timers(self) -> Dict[str, Dict[str, Any]]:
        """Get all timer states."""
        with self._lock:
            result = {}
            for key in self._timers:
                result[key] = self.get_timer(key)
            return result


# Global instance
data_service = DataService()
