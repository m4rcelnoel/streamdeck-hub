"""Spotify integration service using Spotipy library."""
import os
import json
import threading
from typing import Dict, List, Optional, Any
import logging

try:
    import spotipy
    from spotipy.oauth2 import SpotifyOAuth
    SPOTIPY_AVAILABLE = True
except ImportError:
    SPOTIPY_AVAILABLE = False
    spotipy = None
    SpotifyOAuth = None

logger = logging.getLogger(__name__)

# Config file path
CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
CONFIG_FILE = os.path.join(CONFIG_DIR, "spotify_config.json")
CACHE_FILE = os.path.join(CONFIG_DIR, ".spotify_cache")


class SpotifyService:
    """Service to control Spotify playback."""

    def __init__(self):
        self._client: Optional[Any] = None
        self._config: Dict[str, str] = {}
        self._lock = threading.Lock()
        self._load_config()

    @property
    def is_available(self) -> bool:
        """Check if Spotipy library is available."""
        return SPOTIPY_AVAILABLE

    @property
    def is_configured(self) -> bool:
        """Check if Spotify credentials are configured."""
        return bool(self._config.get("client_id") and self._config.get("client_secret"))

    @property
    def is_authenticated(self) -> bool:
        """Check if authenticated with Spotify."""
        return self._client is not None

    def _load_config(self):
        """Load Spotify configuration."""
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    self._config = json.load(f)
                logger.info("Loaded Spotify configuration")
        except Exception as e:
            logger.error(f"Failed to load Spotify config: {e}")

    def _save_config(self):
        """Save Spotify configuration."""
        try:
            os.makedirs(CONFIG_DIR, exist_ok=True)
            with open(CONFIG_FILE, 'w') as f:
                json.dump(self._config, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save Spotify config: {e}")

    def configure(self, client_id: str, client_secret: str, redirect_uri: str = None) -> bool:
        """Configure Spotify credentials."""
        with self._lock:
            self._config = {
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri or "http://localhost:8888/callback"
            }
            self._save_config()
            self._client = None  # Reset client to force re-auth
            logger.info("Spotify credentials configured")
            return True

    def get_auth_url(self) -> Optional[str]:
        """Get the Spotify authorization URL."""
        if not SPOTIPY_AVAILABLE:
            logger.warning("Spotipy library not installed. Install with: pip install spotipy")
            return None

        if not self.is_configured:
            logger.warning("Spotify credentials not configured")
            return None

        try:
            sp_oauth = SpotifyOAuth(
                client_id=self._config["client_id"],
                client_secret=self._config["client_secret"],
                redirect_uri=self._config.get("redirect_uri", "http://localhost:8888/callback"),
                scope="user-read-playback-state user-modify-playback-state user-read-currently-playing",
                cache_path=CACHE_FILE
            )
            return sp_oauth.get_authorize_url()
        except Exception as e:
            logger.error(f"Error getting auth URL: {e}")
            return None

    def authenticate(self, auth_code: str = None) -> bool:
        """Authenticate with Spotify using auth code or cached token."""
        if not SPOTIPY_AVAILABLE or not self.is_configured:
            return False

        try:
            sp_oauth = SpotifyOAuth(
                client_id=self._config["client_id"],
                client_secret=self._config["client_secret"],
                redirect_uri=self._config.get("redirect_uri", "http://localhost:8888/callback"),
                scope="user-read-playback-state user-modify-playback-state user-read-currently-playing",
                cache_path=CACHE_FILE
            )

            if auth_code:
                # Exchange code for token
                token_info = sp_oauth.get_access_token(auth_code)
            else:
                # Try to get cached token
                token_info = sp_oauth.get_cached_token()

            if token_info:
                self._client = spotipy.Spotify(auth=token_info["access_token"])
                logger.info("Spotify authenticated successfully")
                return True
            else:
                logger.warning("No Spotify token available")
                return False

        except Exception as e:
            logger.error(f"Error authenticating with Spotify: {e}")
            return False

    def _ensure_client(self) -> bool:
        """Ensure we have an authenticated client."""
        if self._client:
            return True

        # Try to authenticate with cached token
        return self.authenticate()

    def _refresh_token_if_needed(self):
        """Refresh token if expired."""
        if not SPOTIPY_AVAILABLE or not self.is_configured:
            return

        try:
            sp_oauth = SpotifyOAuth(
                client_id=self._config["client_id"],
                client_secret=self._config["client_secret"],
                redirect_uri=self._config.get("redirect_uri", "http://localhost:8888/callback"),
                scope="user-read-playback-state user-modify-playback-state user-read-currently-playing",
                cache_path=CACHE_FILE
            )

            token_info = sp_oauth.get_cached_token()
            if token_info and sp_oauth.is_token_expired(token_info):
                token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
                self._client = spotipy.Spotify(auth=token_info["access_token"])

        except Exception as e:
            logger.error(f"Error refreshing token: {e}")

    # Playback controls
    def play(self, device_id: str = None) -> bool:
        """Start playback."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            self._client.start_playback(device_id=device_id)
            return True
        except Exception as e:
            logger.error(f"Error playing: {e}")
            return False

    def pause(self, device_id: str = None) -> bool:
        """Pause playback."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            self._client.pause_playback(device_id=device_id)
            return True
        except Exception as e:
            logger.error(f"Error pausing: {e}")
            return False

    def play_pause(self, device_id: str = None) -> bool:
        """Toggle play/pause."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            playback = self._client.current_playback()
            if playback and playback.get("is_playing"):
                self._client.pause_playback(device_id=device_id)
            else:
                self._client.start_playback(device_id=device_id)
            return True
        except Exception as e:
            logger.error(f"Error toggling play/pause: {e}")
            return False

    def next_track(self, device_id: str = None) -> bool:
        """Skip to next track."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            self._client.next_track(device_id=device_id)
            return True
        except Exception as e:
            logger.error(f"Error skipping to next: {e}")
            return False

    def previous_track(self, device_id: str = None) -> bool:
        """Skip to previous track."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            self._client.previous_track(device_id=device_id)
            return True
        except Exception as e:
            logger.error(f"Error skipping to previous: {e}")
            return False

    def set_volume(self, volume: int, device_id: str = None) -> bool:
        """Set volume (0-100)."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            self._client.volume(max(0, min(100, volume)), device_id=device_id)
            return True
        except Exception as e:
            logger.error(f"Error setting volume: {e}")
            return False

    def volume_up(self, step: int = 10, device_id: str = None) -> bool:
        """Increase volume."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            playback = self._client.current_playback()
            if playback and playback.get("device"):
                current = playback["device"].get("volume_percent", 50)
                self._client.volume(min(100, current + step), device_id=device_id)
                return True
        except Exception as e:
            logger.error(f"Error increasing volume: {e}")
        return False

    def volume_down(self, step: int = 10, device_id: str = None) -> bool:
        """Decrease volume."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            playback = self._client.current_playback()
            if playback and playback.get("device"):
                current = playback["device"].get("volume_percent", 50)
                self._client.volume(max(0, current - step), device_id=device_id)
                return True
        except Exception as e:
            logger.error(f"Error decreasing volume: {e}")
        return False

    def shuffle(self, state: bool, device_id: str = None) -> bool:
        """Set shuffle state."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            self._client.shuffle(state, device_id=device_id)
            return True
        except Exception as e:
            logger.error(f"Error setting shuffle: {e}")
            return False

    def repeat(self, state: str, device_id: str = None) -> bool:
        """Set repeat state (track, context, off)."""
        if not self._ensure_client():
            return False

        try:
            self._refresh_token_if_needed()
            self._client.repeat(state, device_id=device_id)
            return True
        except Exception as e:
            logger.error(f"Error setting repeat: {e}")
            return False

    # Status
    def get_devices(self) -> List[Dict[str, Any]]:
        """Get available Spotify devices."""
        if not self._ensure_client():
            return []

        try:
            self._refresh_token_if_needed()
            result = self._client.devices()
            return result.get("devices", [])
        except Exception as e:
            logger.error(f"Error getting devices: {e}")
            return []

    def get_current_track(self) -> Optional[Dict[str, Any]]:
        """Get current track info."""
        if not self._ensure_client():
            return None

        try:
            self._refresh_token_if_needed()
            playback = self._client.current_playback()

            if not playback:
                return None

            track = playback.get("item", {})
            device = playback.get("device", {})

            artists = track.get("artists", [])
            artist_names = ", ".join([a.get("name", "") for a in artists])

            album = track.get("album", {})
            images = album.get("images", [])
            album_art = images[0].get("url") if images else None

            return {
                "title": track.get("name"),
                "artist": artist_names,
                "album": album.get("name"),
                "album_art": album_art,
                "duration_ms": track.get("duration_ms"),
                "progress_ms": playback.get("progress_ms"),
                "is_playing": playback.get("is_playing", False),
                "device": device.get("name"),
                "device_id": device.get("id"),
                "volume": device.get("volume_percent"),
                "shuffle": playback.get("shuffle_state"),
                "repeat": playback.get("repeat_state")
            }
        except Exception as e:
            logger.error(f"Error getting current track: {e}")
            return None

    def get_status(self) -> Dict[str, Any]:
        """Get Spotify status."""
        return {
            "available": SPOTIPY_AVAILABLE,
            "configured": self.is_configured,
            "authenticated": self.is_authenticated,
            "auth_url": self.get_auth_url() if self.is_configured and not self.is_authenticated else None
        }


# Global instance
spotify_service = SpotifyService()
