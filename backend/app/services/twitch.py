"""Twitch integration service."""
import aiohttp
import json
import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Config file for storing Twitch credentials
CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
CONFIG_FILE = os.path.join(CONFIG_DIR, "twitch_config.json")

TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2"
TWITCH_API_URL = "https://api.twitch.tv/helix"


class TwitchService:
    """Service for Twitch integrations."""

    def __init__(self):
        self._client_id: Optional[str] = None
        self._client_secret: Optional[str] = None
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_expires: Optional[datetime] = None
        self._broadcaster_id: Optional[str] = None
        self._load_config()

    def _load_config(self):
        """Load Twitch configuration."""
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    self._client_id = config.get("client_id")
                    self._client_secret = config.get("client_secret")
                    self._access_token = config.get("access_token")
                    self._refresh_token = config.get("refresh_token")
                    self._broadcaster_id = config.get("broadcaster_id")
                    if config.get("token_expires"):
                        self._token_expires = datetime.fromisoformat(config["token_expires"])
                    logger.info("Loaded Twitch configuration")
        except Exception as e:
            logger.error(f"Failed to load Twitch config: {e}")

    def _save_config(self):
        """Save Twitch configuration."""
        try:
            os.makedirs(CONFIG_DIR, exist_ok=True)
            config = {
                "client_id": self._client_id,
                "client_secret": self._client_secret,
                "access_token": self._access_token,
                "refresh_token": self._refresh_token,
                "broadcaster_id": self._broadcaster_id,
            }
            if self._token_expires:
                config["token_expires"] = self._token_expires.isoformat()
            with open(CONFIG_FILE, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save Twitch config: {e}")

    def configure(self, client_id: str, client_secret: str) -> Dict[str, Any]:
        """Configure Twitch API credentials."""
        self._client_id = client_id
        self._client_secret = client_secret
        self._save_config()
        return {
            "success": True,
            "auth_url": self.get_auth_url()
        }

    @property
    def is_configured(self) -> bool:
        """Check if credentials are configured."""
        return bool(self._client_id and self._client_secret)

    @property
    def is_authenticated(self) -> bool:
        """Check if authenticated with Twitch."""
        return bool(self._access_token)

    def get_auth_url(self) -> Optional[str]:
        """Get the Twitch OAuth authorization URL."""
        if not self._client_id:
            return None

        scopes = [
            "clips:edit",
            "channel:manage:broadcast",
            "channel:edit:commercial",
            "chat:edit",
            "chat:read",
            "channel:read:stream_key",
            "moderator:manage:announcements",
        ]

        redirect_uri = "http://localhost:8888/twitch/callback"

        return (
            f"{TWITCH_AUTH_URL}/authorize"
            f"?client_id={self._client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope={'+'.join(scopes)}"
        )

    async def authenticate(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        if not self.is_configured:
            return {"success": False, "error": "Twitch not configured"}

        try:
            redirect_uri = "http://localhost:8888/twitch/callback"

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{TWITCH_AUTH_URL}/token",
                    data={
                        "client_id": self._client_id,
                        "client_secret": self._client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self._access_token = data["access_token"]
                        self._refresh_token = data.get("refresh_token")
                        expires_in = data.get("expires_in", 3600)
                        self._token_expires = datetime.now() + timedelta(seconds=expires_in)

                        # Get broadcaster ID
                        await self._get_broadcaster_id()

                        self._save_config()
                        logger.info("Twitch authenticated successfully")
                        return {"success": True}
                    else:
                        error_text = await response.text()
                        return {"success": False, "error": f"Authentication failed: {error_text}"}

        except Exception as e:
            logger.error(f"Error authenticating with Twitch: {e}")
            return {"success": False, "error": str(e)}

    async def _refresh_access_token(self) -> bool:
        """Refresh the access token."""
        if not self._refresh_token:
            return False

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{TWITCH_AUTH_URL}/token",
                    data={
                        "client_id": self._client_id,
                        "client_secret": self._client_secret,
                        "grant_type": "refresh_token",
                        "refresh_token": self._refresh_token,
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self._access_token = data["access_token"]
                        self._refresh_token = data.get("refresh_token", self._refresh_token)
                        expires_in = data.get("expires_in", 3600)
                        self._token_expires = datetime.now() + timedelta(seconds=expires_in)
                        self._save_config()
                        return True
                    return False

        except Exception as e:
            logger.error(f"Error refreshing Twitch token: {e}")
            return False

    async def _ensure_token(self) -> bool:
        """Ensure we have a valid access token."""
        if not self._access_token:
            return False

        # Refresh if expired or close to expiring
        if self._token_expires and datetime.now() > self._token_expires - timedelta(minutes=5):
            return await self._refresh_access_token()

        return True

    async def _get_broadcaster_id(self) -> Optional[str]:
        """Get the authenticated user's broadcaster ID."""
        if self._broadcaster_id:
            return self._broadcaster_id

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{TWITCH_API_URL}/users",
                    headers={
                        "Authorization": f"Bearer {self._access_token}",
                        "Client-Id": self._client_id,
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("data"):
                            self._broadcaster_id = data["data"][0]["id"]
                            self._save_config()
                            return self._broadcaster_id
        except Exception as e:
            logger.error(f"Error getting broadcaster ID: {e}")

        return None

    async def _api_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make an authenticated API request."""
        if not await self._ensure_token():
            return {"success": False, "error": "Not authenticated"}

        try:
            url = f"{TWITCH_API_URL}/{endpoint}"
            headers = {
                "Authorization": f"Bearer {self._access_token}",
                "Client-Id": self._client_id,
                "Content-Type": "application/json",
            }

            async with aiohttp.ClientSession() as session:
                kwargs = {"headers": headers}
                if data:
                    kwargs["json"] = data
                if params:
                    kwargs["params"] = params

                async with session.request(method, url, **kwargs) as response:
                    response_text = await response.text()

                    if response.status in (200, 201, 202, 204):
                        if response_text:
                            return {"success": True, "data": json.loads(response_text)}
                        return {"success": True}
                    else:
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {response_text}"
                        }

        except Exception as e:
            logger.error(f"Twitch API error: {e}")
            return {"success": False, "error": str(e)}

    async def create_clip(self) -> Dict[str, Any]:
        """Create a clip of the current stream."""
        broadcaster_id = await self._get_broadcaster_id()
        if not broadcaster_id:
            return {"success": False, "error": "Could not get broadcaster ID"}

        result = await self._api_request(
            "POST",
            "clips",
            params={"broadcaster_id": broadcaster_id}
        )

        if result.get("success") and result.get("data", {}).get("data"):
            clip_data = result["data"]["data"][0]
            return {
                "success": True,
                "clip_id": clip_data.get("id"),
                "edit_url": clip_data.get("edit_url"),
            }

        return result

    async def create_stream_marker(self, description: str = "") -> Dict[str, Any]:
        """Create a stream marker."""
        broadcaster_id = await self._get_broadcaster_id()
        if not broadcaster_id:
            return {"success": False, "error": "Could not get broadcaster ID"}

        data = {"user_id": broadcaster_id}
        if description:
            data["description"] = description[:140]  # Max 140 chars

        return await self._api_request("POST", "streams/markers", data=data)

    async def send_chat_message(self, message: str, channel: Optional[str] = None) -> Dict[str, Any]:
        """Send a chat message."""
        broadcaster_id = await self._get_broadcaster_id()
        if not broadcaster_id:
            return {"success": False, "error": "Could not get broadcaster ID"}

        # If channel specified, we'd need to look up their ID
        # For now, send to own channel
        data = {
            "broadcaster_id": broadcaster_id,
            "sender_id": broadcaster_id,
            "message": message,
        }

        return await self._api_request("POST", "chat/messages", data=data)

    async def send_announcement(self, message: str, color: str = "primary") -> Dict[str, Any]:
        """Send a chat announcement."""
        broadcaster_id = await self._get_broadcaster_id()
        if not broadcaster_id:
            return {"success": False, "error": "Could not get broadcaster ID"}

        # Color can be: blue, green, orange, purple, primary (default)
        return await self._api_request(
            "POST",
            "chat/announcements",
            data={"message": message, "color": color},
            params={"broadcaster_id": broadcaster_id, "moderator_id": broadcaster_id}
        )

    async def update_channel(
        self,
        title: Optional[str] = None,
        game_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update channel information."""
        broadcaster_id = await self._get_broadcaster_id()
        if not broadcaster_id:
            return {"success": False, "error": "Could not get broadcaster ID"}

        data = {}
        if title:
            data["title"] = title
        if game_id:
            data["game_id"] = game_id

        if not data:
            return {"success": False, "error": "No updates specified"}

        return await self._api_request(
            "PATCH",
            "channels",
            data=data,
            params={"broadcaster_id": broadcaster_id}
        )

    async def search_game(self, query: str) -> Dict[str, Any]:
        """Search for a game/category."""
        return await self._api_request(
            "GET",
            "search/categories",
            params={"query": query}
        )

    async def start_commercial(self, length: int = 30) -> Dict[str, Any]:
        """Start a commercial break.

        Args:
            length: Commercial length in seconds (30, 60, 90, 120, 150, 180)
        """
        broadcaster_id = await self._get_broadcaster_id()
        if not broadcaster_id:
            return {"success": False, "error": "Could not get broadcaster ID"}

        valid_lengths = [30, 60, 90, 120, 150, 180]
        if length not in valid_lengths:
            return {"success": False, "error": f"Invalid ad length. Must be one of: {valid_lengths}"}

        return await self._api_request(
            "POST",
            "channels/commercial",
            data={"broadcaster_id": broadcaster_id, "length": length}
        )

    async def get_stream_info(self) -> Dict[str, Any]:
        """Get current stream information."""
        broadcaster_id = await self._get_broadcaster_id()
        if not broadcaster_id:
            return {"success": False, "error": "Could not get broadcaster ID"}

        result = await self._api_request(
            "GET",
            "streams",
            params={"user_id": broadcaster_id}
        )

        if result.get("success"):
            streams = result.get("data", {}).get("data", [])
            if streams:
                stream = streams[0]
                return {
                    "success": True,
                    "is_live": True,
                    "title": stream.get("title"),
                    "game_name": stream.get("game_name"),
                    "viewer_count": stream.get("viewer_count"),
                    "started_at": stream.get("started_at"),
                }
            return {"success": True, "is_live": False}

        return result

    def get_status(self) -> Dict[str, Any]:
        """Get Twitch service status."""
        return {
            "configured": self.is_configured,
            "authenticated": self.is_authenticated,
            "broadcaster_id": self._broadcaster_id,
            "auth_url": self.get_auth_url() if self.is_configured and not self.is_authenticated else None,
        }


# Global instance
twitch_service = TwitchService()
