"""Data API router for live data displays."""
import psutil
import subprocess
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel

from ..services.data import data_service

router = APIRouter(prefix="/api/data", tags=["data"])


class CounterUpdate(BaseModel):
    action: str  # increment, decrement, reset, set
    step: int = 1
    min_value: Optional[int] = None
    max_value: Optional[int] = None
    set_value: Optional[int] = None
    wrap: bool = False


class TimerUpdate(BaseModel):
    action: str  # start, pause, resume, reset, toggle
    mode: str = "stopwatch"
    duration: int = 0


@router.get("/system")
def get_system_info():
    """Get system information (CPU, memory, disk, temperature, uptime)."""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=0.1)

        # Memory
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used = memory.used
        memory_total = memory.total

        # Disk
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_used = disk.used
        disk_total = disk.total

        # CPU temperature (Linux-specific)
        cpu_temp = None
        try:
            temps = psutil.sensors_temperatures()
            if temps:
                # Try common sensor names
                for name in ['coretemp', 'cpu_thermal', 'k10temp', 'zenpower']:
                    if name in temps and temps[name]:
                        cpu_temp = temps[name][0].current
                        break
        except Exception:
            pass

        # System uptime
        boot_time = psutil.boot_time()
        uptime = datetime.now().timestamp() - boot_time

        return {
            "cpu_percent": cpu_percent,
            "memory_percent": memory_percent,
            "memory_used": memory_used,
            "memory_total": memory_total,
            "disk_percent": disk_percent,
            "disk_used": disk_used,
            "disk_total": disk_total,
            "cpu_temp": cpu_temp,
            "uptime": uptime,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather")
def get_weather(location: Optional[str] = Query("auto")):
    """Get weather information.

    This is a mock implementation. In production, you would integrate
    with a weather API like OpenWeatherMap, WeatherAPI, etc.
    """
    # For demo purposes, return mock data
    # In production, integrate with a real weather API
    return {
        "location": location if location != "auto" else "Current Location",
        "temp_c": 22,
        "temp_f": 72,
        "condition": "Sunny",
        "humidity": 45,
        "wind_kph": 12,
        "wind_mph": 7.5,
        "icon": "sunny",
    }


@router.get("/media")
def get_media_status():
    """Get current media playback status.

    Uses playerctl on Linux to get media info from MPRIS-compatible players.
    """
    try:
        # Check if any player is available
        result = subprocess.run(
            ["playerctl", "status"],
            capture_output=True,
            text=True,
            timeout=2
        )

        if result.returncode != 0:
            return {
                "is_playing": False,
                "title": None,
                "artist": None,
                "album": None,
                "position": None,
                "duration": None,
            }

        status = result.stdout.strip().lower()
        is_playing = status == "playing"

        # Get metadata
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

        # Get position and duration
        def get_position():
            try:
                r = subprocess.run(
                    ["playerctl", "position"],
                    capture_output=True,
                    text=True,
                    timeout=2
                )
                if r.returncode == 0:
                    # Position in seconds, convert to ms
                    return int(float(r.stdout.strip()) * 1000)
                return None
            except Exception:
                return None

        def get_duration():
            try:
                r = subprocess.run(
                    ["playerctl", "metadata", "mpris:length"],
                    capture_output=True,
                    text=True,
                    timeout=2
                )
                if r.returncode == 0:
                    # Duration in microseconds, convert to ms
                    return int(int(r.stdout.strip()) / 1000)
                return None
            except Exception:
                return None

        return {
            "is_playing": is_playing,
            "title": get_metadata("xesam:title"),
            "artist": get_metadata("xesam:artist"),
            "album": get_metadata("xesam:album"),
            "position": get_position(),
            "duration": get_duration(),
        }

    except FileNotFoundError:
        # playerctl not installed
        return {
            "is_playing": False,
            "title": None,
            "artist": None,
            "album": None,
            "position": None,
            "duration": None,
            "error": "playerctl not installed",
        }
    except Exception as e:
        return {
            "is_playing": False,
            "title": None,
            "artist": None,
            "album": None,
            "position": None,
            "duration": None,
            "error": str(e),
        }


@router.get("/homeassistant/{entity_id}")
def get_ha_sensor(entity_id: str):
    """Get Home Assistant sensor data.

    This requires the Home Assistant integration to be configured.
    """
    from ..services.homeassistant import homeassistant_service

    if not homeassistant_service.is_connected:
        raise HTTPException(
            status_code=503,
            detail="Home Assistant is not connected"
        )

    try:
        state = homeassistant_service.get_entity_state(entity_id)
        if state is None:
            raise HTTPException(
                status_code=404,
                detail=f"Entity {entity_id} not found"
            )

        return {
            "entity_id": entity_id,
            "state": state.get("state"),
            "unit": state.get("attributes", {}).get("unit_of_measurement"),
            "friendly_name": state.get("attributes", {}).get("friendly_name"),
            "last_updated": state.get("last_updated"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Counter endpoints
@router.get("/counters")
def get_all_counters():
    """Get all counter values."""
    return {"counters": data_service.get_all_counters()}


@router.get("/counters/{key}")
def get_counter(key: str):
    """Get a counter value."""
    return {"key": key, "value": data_service.get_counter(key)}


@router.post("/counters/{key}")
def update_counter(key: str, update: CounterUpdate):
    """Update a counter."""
    try:
        if update.action == "increment":
            value = data_service.increment_counter(
                key, update.step, update.min_value, update.max_value, update.wrap
            )
        elif update.action == "decrement":
            value = data_service.decrement_counter(
                key, update.step, update.min_value, update.max_value, update.wrap
            )
        elif update.action == "reset":
            value = data_service.reset_counter(key)
        elif update.action == "set":
            value = data_service.set_counter(key, update.set_value or 0)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {update.action}")

        return {"key": key, "value": value}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Timer endpoints
@router.get("/timers")
def get_all_timers():
    """Get all timer states."""
    return {"timers": data_service.get_all_timers()}


@router.get("/timers/{key}")
def get_timer(key: str):
    """Get a timer state."""
    state = data_service.get_timer(key)
    if not state:
        return {"key": key, "state": None}
    return {"key": key, "state": state}


@router.post("/timers/{key}")
def update_timer(key: str, update: TimerUpdate):
    """Update a timer."""
    try:
        if update.action == "start":
            state = data_service.start_timer(key, update.mode, update.duration)
        elif update.action == "pause":
            state = data_service.pause_timer(key)
        elif update.action == "resume":
            state = data_service.resume_timer(key)
        elif update.action == "reset":
            state = data_service.reset_timer(key)
        elif update.action == "toggle":
            state = data_service.toggle_timer(key, update.mode, update.duration)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {update.action}")

        return {"key": key, "state": state}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
