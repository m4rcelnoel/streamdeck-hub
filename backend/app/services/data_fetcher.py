"""Data fetcher service for live data displays on Stream Deck buttons."""
import psutil
import subprocess
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DataFetcher:
    """Fetches data for various data sources."""

    def fetch(
        self,
        data_source: str,
        data_format: str,
        data_config: Optional[Dict[str, Any]] = None,
        profile_id: str = None,
        position: int = None,
        page: int = 0
    ) -> str:
        """Fetch data based on source and format, return formatted string."""
        try:
            if data_source == "time":
                return self._fetch_time(data_format)
            elif data_source == "system":
                return self._fetch_system(data_format)
            elif data_source == "weather":
                return self._fetch_weather(data_format, data_config)
            elif data_source == "media":
                return self._fetch_media(data_format)
            elif data_source == "counter":
                return self._fetch_counter(data_format, data_config, profile_id, position, page)
            elif data_source == "timer":
                return self._fetch_timer(data_format, data_config, profile_id, position, page)
            else:
                return "—"
        except Exception as e:
            logger.error(f"Failed to fetch data for {data_source}: {e}")
            return "—"

    def _fetch_time(self, data_format: str) -> str:
        """Fetch current time in various formats."""
        now = datetime.now()

        if data_format == "time_12h":
            return now.strftime("%I:%M %p")
        elif data_format == "time_24h":
            return now.strftime("%H:%M")
        elif data_format == "time_seconds":
            return now.strftime("%H:%M:%S")
        elif data_format == "date_short":
            return now.strftime("%b %d")
        elif data_format == "date_full":
            return now.strftime("%b %d, %Y")
        elif data_format == "day":
            return now.strftime("%A")
        elif data_format == "datetime":
            return now.strftime("%m/%d %H:%M")
        else:
            return now.strftime("%H:%M")

    def _fetch_system(self, data_format: str) -> str:
        """Fetch system information."""
        if data_format == "cpu":
            cpu = psutil.cpu_percent(interval=0.1)
            return f"{round(cpu)}%"
        elif data_format == "memory":
            mem = psutil.virtual_memory()
            return f"{round(mem.percent)}%"
        elif data_format == "memory_used":
            mem = psutil.virtual_memory()
            gb = mem.used / 1024 / 1024 / 1024
            return f"{gb:.1f}GB"
        elif data_format == "disk":
            disk = psutil.disk_usage('/')
            return f"{round(disk.percent)}%"
        elif data_format == "cpu_temp":
            try:
                temps = psutil.sensors_temperatures()
                if temps:
                    for name in ['coretemp', 'cpu_thermal', 'k10temp', 'zenpower']:
                        if name in temps and temps[name]:
                            return f"{round(temps[name][0].current)}°C"
                return "N/A"
            except Exception:
                return "N/A"
        elif data_format == "uptime":
            boot = psutil.boot_time()
            uptime_seconds = datetime.now().timestamp() - boot
            return self._format_duration(int(uptime_seconds * 1000))
        else:
            cpu = psutil.cpu_percent(interval=0.1)
            return f"{round(cpu)}%"

    def _fetch_weather(self, data_format: str, data_config: Optional[Dict[str, Any]] = None) -> str:
        """Fetch weather information (mock implementation)."""
        # In production, integrate with a real weather API
        # For now, return placeholder
        location = data_config.get("location", "auto") if data_config else "auto"

        # Mock data - in production, call a weather API
        temp_c = 22
        temp_f = 72
        condition = "Sunny"
        humidity = 45
        wind = 12

        if data_format == "temp_c":
            return f"{temp_c}°C"
        elif data_format == "temp_f":
            return f"{temp_f}°F"
        elif data_format == "condition":
            return condition
        elif data_format == "humidity":
            return f"{humidity}%"
        elif data_format == "wind":
            return f"{wind}km/h"
        elif data_format == "full":
            return f"{temp_c}° {condition}"
        else:
            return f"{temp_c}°C"

    def _fetch_media(self, data_format: str) -> str:
        """Fetch media playback status using playerctl."""
        try:
            # Check if player is available
            result = subprocess.run(
                ["playerctl", "status"],
                capture_output=True,
                text=True,
                timeout=2
            )

            if result.returncode != 0:
                return "—"

            status = result.stdout.strip().lower()
            is_playing = status == "playing"

            if data_format == "status":
                return "▶" if is_playing else "⏸"

            if not is_playing:
                return "—"

            def get_metadata(field):
                try:
                    r = subprocess.run(
                        ["playerctl", "metadata", field],
                        capture_output=True,
                        text=True,
                        timeout=2
                    )
                    return r.stdout.strip() if r.returncode == 0 else None
                except Exception:
                    return None

            if data_format == "title":
                return get_metadata("xesam:title") or "—"
            elif data_format == "artist":
                return get_metadata("xesam:artist") or "—"
            elif data_format == "album":
                return get_metadata("xesam:album") or "—"
            elif data_format == "title_artist":
                title = get_metadata("xesam:title")
                artist = get_metadata("xesam:artist")
                if title:
                    return f"{title}\n{artist or ''}"
                return "—"
            elif data_format == "progress":
                try:
                    pos_result = subprocess.run(
                        ["playerctl", "position"],
                        capture_output=True,
                        text=True,
                        timeout=2
                    )
                    dur_result = subprocess.run(
                        ["playerctl", "metadata", "mpris:length"],
                        capture_output=True,
                        text=True,
                        timeout=2
                    )
                    if pos_result.returncode == 0 and dur_result.returncode == 0:
                        pos_ms = int(float(pos_result.stdout.strip()) * 1000)
                        dur_ms = int(int(dur_result.stdout.strip()) / 1000)
                        return f"{self._format_duration(pos_ms)}/{self._format_duration(dur_ms)}"
                except Exception:
                    pass
                return "—"
            else:
                return get_metadata("xesam:title") or "—"

        except FileNotFoundError:
            return "—"
        except Exception as e:
            logger.error(f"Media fetch error: {e}")
            return "—"

    def _fetch_counter(
        self,
        data_format: str,
        data_config: Optional[Dict[str, Any]],
        profile_id: str,
        position: int,
        page: int
    ) -> str:
        """Fetch counter value from state service."""
        from .button_state import button_state_service

        if not profile_id or position is None:
            return "0"

        value = button_state_service.get_counter_value(profile_id, position, page)
        label = data_config.get("label", "") if data_config else ""

        if data_format == "value_label" and label:
            return f"{label}\n{value}"
        return str(value)

    def _fetch_timer(
        self,
        data_format: str,
        data_config: Optional[Dict[str, Any]],
        profile_id: str,
        position: int,
        page: int
    ) -> str:
        """Fetch timer display from state service."""
        from .button_state import button_state_service

        if not profile_id or position is None:
            if data_format == "countdown":
                duration = data_config.get("duration", 300000) if data_config else 300000
                return self._format_duration(duration)
            return "0:00"

        # Pass config with format info
        config = data_config.copy() if data_config else {}
        config["format"] = data_format

        return button_state_service.get_timer_display(profile_id, position, page, config)

    def _format_duration(self, ms: int) -> str:
        """Format milliseconds as duration string."""
        total_seconds = ms // 1000
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        if hours > 0:
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        return f"{minutes}:{seconds:02d}"


data_fetcher = DataFetcher()
