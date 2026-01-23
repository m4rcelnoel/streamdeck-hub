"""Media API router for Sonos and Spotify."""
from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from ..services.sonos import sonos_service
from ..services.spotify import spotify_service

router = APIRouter(prefix="/api/media", tags=["media"])


# Schemas
class SpotifyConfig(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: Optional[str] = None


class SpotifyAuthCode(BaseModel):
    code: str


# Sonos endpoints
@router.get("/sonos/status")
def sonos_status():
    """Get Sonos service status."""
    return {
        "available": sonos_service.is_available,
        "speakers": sonos_service.get_speakers()
    }


@router.post("/sonos/discover")
def sonos_discover():
    """Discover Sonos speakers on the network."""
    if not sonos_service.is_available:
        raise HTTPException(status_code=503, detail="SoCo library not installed")

    speakers = sonos_service.discover()
    return {"speakers": speakers}


@router.get("/sonos/speakers")
def sonos_speakers():
    """Get list of discovered Sonos speakers."""
    return {"speakers": sonos_service.get_speakers()}


@router.post("/sonos/speakers/{uid}/default")
def set_default_speaker(uid: str):
    """Set the default Sonos speaker."""
    sonos_service.set_default_speaker(uid)
    return {"success": True}


@router.get("/sonos/now-playing")
def sonos_now_playing(uid: Optional[str] = None):
    """Get current track info from Sonos."""
    track = sonos_service.get_current_track(uid)
    if not track:
        return {"is_playing": False}
    return track


@router.post("/sonos/command/{command}")
def sonos_command(command: str, uid: Optional[str] = None, volume: Optional[int] = None, step: Optional[int] = 5):
    """Execute a Sonos command."""
    if not sonos_service.is_available:
        raise HTTPException(status_code=503, detail="SoCo library not installed")

    result = False
    if command == "play":
        result = sonos_service.play(uid)
    elif command == "pause":
        result = sonos_service.pause(uid)
    elif command == "play_pause":
        result = sonos_service.play_pause(uid)
    elif command == "stop":
        result = sonos_service.stop(uid)
    elif command == "next":
        result = sonos_service.next_track(uid)
    elif command == "previous":
        result = sonos_service.previous_track(uid)
    elif command == "volume_up":
        result = sonos_service.volume_up(step, uid)
    elif command == "volume_down":
        result = sonos_service.volume_down(step, uid)
    elif command == "mute":
        result = sonos_service.mute(uid)
    elif command == "unmute":
        result = sonos_service.unmute(uid)
    elif command == "toggle_mute":
        result = sonos_service.toggle_mute(uid)
    elif command == "set_volume" and volume is not None:
        result = sonos_service.set_volume(volume, uid)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown command: {command}")

    return {"success": result}


# Spotify endpoints
@router.get("/spotify/status")
def spotify_status():
    """Get Spotify service status."""
    return spotify_service.get_status()


@router.post("/spotify/configure")
def spotify_configure(config: SpotifyConfig):
    """Configure Spotify credentials."""
    result = spotify_service.configure(
        client_id=config.client_id,
        client_secret=config.client_secret,
        redirect_uri=config.redirect_uri
    )
    return {"success": result, "auth_url": spotify_service.get_auth_url()}


@router.get("/spotify/auth-url")
def spotify_auth_url():
    """Get the Spotify authorization URL."""
    if not spotify_service.is_configured:
        raise HTTPException(status_code=400, detail="Spotify not configured")

    url = spotify_service.get_auth_url()
    if not url:
        raise HTTPException(status_code=500, detail="Failed to get auth URL")

    return {"auth_url": url}


@router.post("/spotify/authenticate")
def spotify_authenticate(auth: SpotifyAuthCode):
    """Authenticate with Spotify using authorization code."""
    if not spotify_service.is_configured:
        raise HTTPException(status_code=400, detail="Spotify not configured")

    result = spotify_service.authenticate(auth.code)
    return {"success": result}


@router.get("/spotify/devices")
def spotify_devices():
    """Get available Spotify devices."""
    if not spotify_service.is_authenticated:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify")

    return {"devices": spotify_service.get_devices()}


@router.get("/spotify/now-playing")
def spotify_now_playing():
    """Get current track info from Spotify."""
    if not spotify_service.is_authenticated:
        return {"is_playing": False, "authenticated": False}

    track = spotify_service.get_current_track()
    if not track:
        return {"is_playing": False}
    return track


@router.post("/spotify/command/{command}")
def spotify_command(command: str, device_id: Optional[str] = None, volume: Optional[int] = None, step: Optional[int] = 10):
    """Execute a Spotify command."""
    if not spotify_service.is_authenticated:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify")

    result = False
    if command == "play":
        result = spotify_service.play(device_id)
    elif command == "pause":
        result = spotify_service.pause(device_id)
    elif command == "play_pause":
        result = spotify_service.play_pause(device_id)
    elif command == "next":
        result = spotify_service.next_track(device_id)
    elif command == "previous":
        result = spotify_service.previous_track(device_id)
    elif command == "volume_up":
        result = spotify_service.volume_up(step, device_id)
    elif command == "volume_down":
        result = spotify_service.volume_down(step, device_id)
    elif command == "set_volume" and volume is not None:
        result = spotify_service.set_volume(volume, device_id)
    elif command == "shuffle_on":
        result = spotify_service.shuffle(True, device_id)
    elif command == "shuffle_off":
        result = spotify_service.shuffle(False, device_id)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown command: {command}")

    return {"success": result}
