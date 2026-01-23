"""Discord integration service."""
import aiohttp
import json
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Config file for storing bot token
CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
CONFIG_FILE = os.path.join(CONFIG_DIR, "discord_config.json")


class DiscordService:
    """Service for Discord integrations."""

    def __init__(self):
        self._bot_token: Optional[str] = None
        self._load_config()

    def _load_config(self):
        """Load Discord configuration."""
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    self._bot_token = config.get("bot_token")
                    logger.info("Loaded Discord configuration")
        except Exception as e:
            logger.error(f"Failed to load Discord config: {e}")

    def _save_config(self):
        """Save Discord configuration."""
        try:
            os.makedirs(CONFIG_DIR, exist_ok=True)
            with open(CONFIG_FILE, 'w') as f:
                json.dump({"bot_token": self._bot_token}, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save Discord config: {e}")

    def configure(self, bot_token: str) -> bool:
        """Configure Discord bot token."""
        self._bot_token = bot_token
        self._save_config()
        return True

    @property
    def is_configured(self) -> bool:
        """Check if bot token is configured."""
        return bool(self._bot_token)

    async def send_webhook(
        self,
        webhook_url: str,
        message: str,
        username: Optional[str] = None,
        avatar_url: Optional[str] = None,
        embeds: Optional[list] = None
    ) -> Dict[str, Any]:
        """Send a message via Discord webhook.

        Args:
            webhook_url: Discord webhook URL
            message: Message content
            username: Optional custom username
            avatar_url: Optional custom avatar URL
            embeds: Optional list of embed objects

        Returns:
            Result dict with success status
        """
        if not webhook_url:
            return {"success": False, "error": "No webhook URL provided"}

        try:
            payload = {}

            if message:
                payload["content"] = message

            if username:
                payload["username"] = username

            if avatar_url:
                payload["avatar_url"] = avatar_url

            if embeds:
                payload["embeds"] = embeds

            if not payload:
                return {"success": False, "error": "No content to send"}

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status in (200, 204):
                        logger.info("Discord webhook sent successfully")
                        return {"success": True}
                    else:
                        error_text = await response.text()
                        logger.error(f"Discord webhook failed: {response.status} - {error_text}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}"
                        }

        except Exception as e:
            logger.error(f"Error sending Discord webhook: {e}")
            return {"success": False, "error": str(e)}

    async def send_bot_message(
        self,
        channel_id: str,
        message: str,
        embeds: Optional[list] = None
    ) -> Dict[str, Any]:
        """Send a message via Discord bot.

        Args:
            channel_id: Discord channel ID
            message: Message content
            embeds: Optional list of embed objects

        Returns:
            Result dict with success status
        """
        if not self._bot_token:
            return {"success": False, "error": "Bot token not configured"}

        if not channel_id:
            return {"success": False, "error": "No channel ID provided"}

        try:
            payload = {}

            if message:
                payload["content"] = message

            if embeds:
                payload["embeds"] = embeds

            if not payload:
                return {"success": False, "error": "No content to send"}

            url = f"https://discord.com/api/v10/channels/{channel_id}/messages"

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bot {self._bot_token}",
                        "Content-Type": "application/json"
                    }
                ) as response:
                    if response.status == 200:
                        logger.info(f"Discord bot message sent to channel {channel_id}")
                        return {"success": True}
                    else:
                        error_text = await response.text()
                        logger.error(f"Discord bot message failed: {response.status} - {error_text}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}"
                        }

        except Exception as e:
            logger.error(f"Error sending Discord bot message: {e}")
            return {"success": False, "error": str(e)}

    async def update_bot_presence(
        self,
        status: str = "online",
        activity_type: Optional[str] = None,
        activity_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update bot presence/status.

        Note: This requires a WebSocket connection which is complex to maintain.
        For simple presence updates, consider using a dedicated bot framework.

        Args:
            status: online, idle, dnd, invisible
            activity_type: playing, streaming, listening, watching, competing
            activity_name: Activity text

        Returns:
            Result dict with success status
        """
        # Note: Presence updates require a WebSocket gateway connection
        # This is a simplified version that would need a persistent bot connection
        return {
            "success": False,
            "error": "Presence updates require a persistent bot connection. Use a dedicated Discord bot instead."
        }

    def get_status(self) -> Dict[str, Any]:
        """Get Discord service status."""
        return {
            "bot_configured": self.is_configured,
        }


# Global instance
discord_service = DiscordService()
