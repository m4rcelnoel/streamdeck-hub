"""Sonos integration service using SoCo library."""
import threading
from typing import Dict, List, Optional, Any
import logging

try:
    import soco
    from soco import SoCo
    SOCO_AVAILABLE = True
except ImportError:
    SOCO_AVAILABLE = False
    soco = None
    SoCo = None

logger = logging.getLogger(__name__)


class SonosService:
    """Service to control Sonos speakers."""

    def __init__(self):
        self._speakers: Dict[str, Any] = {}  # uid -> SoCo instance
        self._speaker_names: Dict[str, str] = {}  # uid -> name
        self._default_speaker: Optional[str] = None  # uid
        self._lock = threading.Lock()
        self._discovered = False

    @property
    def is_available(self) -> bool:
        """Check if SoCo library is available."""
        return SOCO_AVAILABLE

    def discover(self) -> List[Dict[str, str]]:
        """Discover Sonos speakers on the network."""
        if not SOCO_AVAILABLE:
            logger.warning("SoCo library not installed. Install with: pip install soco")
            return []

        try:
            with self._lock:
                self._speakers.clear()
                self._speaker_names.clear()

                speakers = soco.discover(timeout=5)
                if not speakers:
                    logger.info("No Sonos speakers found on network")
                    return []

                result = []
                for speaker in speakers:
                    try:
                        uid = speaker.uid
                        name = speaker.player_name
                        self._speakers[uid] = speaker
                        self._speaker_names[uid] = name

                        # Set first speaker as default if none set
                        if not self._default_speaker:
                            self._default_speaker = uid

                        result.append({
                            "uid": uid,
                            "name": name,
                            "ip": speaker.ip_address,
                            "is_coordinator": speaker.is_coordinator
                        })
                        logger.info(f"Found Sonos speaker: {name} ({uid})")
                    except Exception as e:
                        logger.error(f"Error getting speaker info: {e}")

                self._discovered = True
                return result

        except Exception as e:
            logger.error(f"Error discovering Sonos speakers: {e}")
            return []

    def get_speakers(self) -> List[Dict[str, str]]:
        """Get list of discovered speakers."""
        if not self._discovered:
            return self.discover()

        result = []
        for uid, speaker in self._speakers.items():
            try:
                result.append({
                    "uid": uid,
                    "name": self._speaker_names.get(uid, "Unknown"),
                    "ip": speaker.ip_address,
                    "is_coordinator": speaker.is_coordinator
                })
            except Exception:
                pass
        return result

    def set_default_speaker(self, uid: str):
        """Set the default speaker for commands."""
        if uid in self._speakers:
            self._default_speaker = uid
            logger.info(f"Set default Sonos speaker to: {self._speaker_names.get(uid, uid)}")

    def _get_speaker(self, uid: str = None) -> Optional[Any]:
        """Get a speaker by UID or the default speaker."""
        if not SOCO_AVAILABLE:
            return None

        target_uid = uid or self._default_speaker
        if not target_uid:
            # Try to discover if no speakers known
            if not self._speakers:
                self.discover()
            target_uid = self._default_speaker

        if not target_uid or target_uid not in self._speakers:
            logger.warning("No Sonos speaker available")
            return None

        return self._speakers.get(target_uid)

    # Playback controls
    def play(self, uid: str = None) -> bool:
        """Start playback."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.play()
                return True
            except Exception as e:
                logger.error(f"Error playing: {e}")
        return False

    def pause(self, uid: str = None) -> bool:
        """Pause playback."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.pause()
                return True
            except Exception as e:
                logger.error(f"Error pausing: {e}")
        return False

    def play_pause(self, uid: str = None) -> bool:
        """Toggle play/pause."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                state = speaker.get_current_transport_info()
                if state.get("current_transport_state") == "PLAYING":
                    speaker.pause()
                else:
                    speaker.play()
                return True
            except Exception as e:
                logger.error(f"Error toggling play/pause: {e}")
        return False

    def stop(self, uid: str = None) -> bool:
        """Stop playback."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.stop()
                return True
            except Exception as e:
                logger.error(f"Error stopping: {e}")
        return False

    def next_track(self, uid: str = None) -> bool:
        """Skip to next track."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.next()
                return True
            except Exception as e:
                logger.error(f"Error skipping to next: {e}")
        return False

    def previous_track(self, uid: str = None) -> bool:
        """Skip to previous track."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.previous()
                return True
            except Exception as e:
                logger.error(f"Error skipping to previous: {e}")
        return False

    def set_volume(self, volume: int, uid: str = None) -> bool:
        """Set volume (0-100)."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.volume = max(0, min(100, volume))
                return True
            except Exception as e:
                logger.error(f"Error setting volume: {e}")
        return False

    def volume_up(self, step: int = 5, uid: str = None) -> bool:
        """Increase volume."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                current = speaker.volume
                speaker.volume = min(100, current + step)
                return True
            except Exception as e:
                logger.error(f"Error increasing volume: {e}")
        return False

    def volume_down(self, step: int = 5, uid: str = None) -> bool:
        """Decrease volume."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                current = speaker.volume
                speaker.volume = max(0, current - step)
                return True
            except Exception as e:
                logger.error(f"Error decreasing volume: {e}")
        return False

    def mute(self, uid: str = None) -> bool:
        """Mute speaker."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.mute = True
                return True
            except Exception as e:
                logger.error(f"Error muting: {e}")
        return False

    def unmute(self, uid: str = None) -> bool:
        """Unmute speaker."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.mute = False
                return True
            except Exception as e:
                logger.error(f"Error unmuting: {e}")
        return False

    def toggle_mute(self, uid: str = None) -> bool:
        """Toggle mute."""
        speaker = self._get_speaker(uid)
        if speaker:
            try:
                speaker.mute = not speaker.mute
                return True
            except Exception as e:
                logger.error(f"Error toggling mute: {e}")
        return False

    # Status
    def get_current_track(self, uid: str = None) -> Optional[Dict[str, Any]]:
        """Get current track info."""
        speaker = self._get_speaker(uid)
        if not speaker:
            return None

        try:
            track = speaker.get_current_track_info()
            transport = speaker.get_current_transport_info()

            return {
                "title": track.get("title"),
                "artist": track.get("artist"),
                "album": track.get("album"),
                "album_art": track.get("album_art"),
                "duration": track.get("duration"),
                "position": track.get("position"),
                "is_playing": transport.get("current_transport_state") == "PLAYING",
                "volume": speaker.volume,
                "muted": speaker.mute
            }
        except Exception as e:
            logger.error(f"Error getting current track: {e}")
            return None

    def get_status(self, uid: str = None) -> Dict[str, Any]:
        """Get speaker status."""
        speaker = self._get_speaker(uid)
        if not speaker:
            return {"available": False}

        try:
            transport = speaker.get_current_transport_info()
            return {
                "available": True,
                "name": self._speaker_names.get(uid or self._default_speaker, "Unknown"),
                "is_playing": transport.get("current_transport_state") == "PLAYING",
                "volume": speaker.volume,
                "muted": speaker.mute
            }
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            return {"available": False, "error": str(e)}


# Global instance
sonos_service = SonosService()
