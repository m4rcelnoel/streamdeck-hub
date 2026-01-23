import asyncio
import json
from typing import Dict, Set, Any
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, event: str, data: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        message = json.dumps({"event": event, "data": data})
        disconnected = set()

        async with self._lock:
            connections = self.active_connections.copy()

        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.add(connection)

        # Clean up disconnected clients
        if disconnected:
            async with self._lock:
                self.active_connections -= disconnected

    async def send_device_connected(self, device_data: dict):
        await self.broadcast("device_connected", device_data)

    async def send_device_disconnected(self, device_id: str):
        await self.broadcast("device_disconnected", {"device_id": device_id})

    async def send_button_pressed(self, device_id: str, key: int, profile_id: str = None):
        await self.broadcast("button_pressed", {
            "device_id": device_id,
            "key": key,
            "profile_id": profile_id,
            "position": key
        })

    async def send_button_released(self, device_id: str, key: int, profile_id: str = None):
        await self.broadcast("button_released", {
            "device_id": device_id,
            "key": key,
            "profile_id": profile_id,
            "position": key
        })

    async def send_state_changed(self, state_type: str, data: dict):
        await self.broadcast("state_changed", {"type": state_type, **data})


websocket_manager = WebSocketManager()
