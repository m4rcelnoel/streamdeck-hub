import aiohttp
from typing import Dict, Any, Optional, List
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class HomeAssistantService:
    def __init__(self):
        self._url: Optional[str] = settings.homeassistant_url
        self._token: Optional[str] = settings.homeassistant_token
        self._connected: bool = False

    @property
    def is_configured(self) -> bool:
        return bool(self._url and self._token)

    @property
    def is_connected(self) -> bool:
        return self._connected

    async def configure(self, url: str, token: str) -> Dict[str, Any]:
        """Configure the Home Assistant connection."""
        self._url = url.rstrip("/")
        self._token = token

        # Test the connection
        result = await self.test_connection()
        if result["success"]:
            self._connected = True
        return result

    async def test_connection(self) -> Dict[str, Any]:
        """Test the connection to Home Assistant."""
        if not self.is_configured:
            return {"success": False, "error": "Home Assistant not configured"}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self._token}",
                    "Content-Type": "application/json"
                }
                async with session.get(
                    f"{self._url}/api/",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self._connected = True
                        return {"success": True, "message": data.get("message", "Connected")}
                    else:
                        self._connected = False
                        return {"success": False, "error": f"HTTP {response.status}"}

        except Exception as e:
            self._connected = False
            return {"success": False, "error": str(e)}

    async def get_entities(self) -> List[Dict[str, Any]]:
        """Get all entities from Home Assistant."""
        if not self.is_configured:
            return []

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self._token}",
                    "Content-Type": "application/json"
                }
                async with session.get(
                    f"{self._url}/api/states",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        states = await response.json()
                        return [
                            {
                                "entity_id": state["entity_id"],
                                "state": state["state"],
                                "friendly_name": state["attributes"].get("friendly_name", state["entity_id"]),
                                "domain": state["entity_id"].split(".")[0]
                            }
                            for state in states
                        ]
                    return []

        except Exception as e:
            logger.error(f"Error fetching entities: {e}")
            return []

    async def get_services(self) -> Dict[str, List[str]]:
        """Get available services from Home Assistant."""
        if not self.is_configured:
            return {}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self._token}",
                    "Content-Type": "application/json"
                }
                async with session.get(
                    f"{self._url}/api/services",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        services_data = await response.json()
                        return {
                            item["domain"]: list(item["services"].keys())
                            for item in services_data
                        }
                    return {}

        except Exception as e:
            logger.error(f"Error fetching services: {e}")
            return {}

    async def call_service(
        self,
        domain: str,
        service: str,
        entity_id: str,
        service_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Call a Home Assistant service."""
        if not self.is_configured:
            return {"success": False, "error": "Home Assistant not configured"}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self._token}",
                    "Content-Type": "application/json"
                }

                payload = {"entity_id": entity_id}
                if service_data:
                    payload.update(service_data)

                async with session.post(
                    f"{self._url}/api/services/{domain}/{service}",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        return {"success": True}
                    else:
                        error_text = await response.text()
                        return {"success": False, "error": error_text}

        except Exception as e:
            logger.error(f"Error calling service: {e}")
            return {"success": False, "error": str(e)}

    def get_status(self) -> Dict[str, Any]:
        """Get the current connection status."""
        return {
            "configured": self.is_configured,
            "connected": self._connected,
            "url": self._url if self._url else None
        }


homeassistant_service = HomeAssistantService()
