from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from ..services.homeassistant import homeassistant_service

router = APIRouter(prefix="/api/homeassistant", tags=["homeassistant"])


class HomeAssistantConfig(BaseModel):
    url: str
    token: str


@router.get("/status")
def get_status():
    """Get Home Assistant connection status."""
    return homeassistant_service.get_status()


@router.post("/connect")
async def connect(config: HomeAssistantConfig):
    """Configure and test Home Assistant connection."""
    result = await homeassistant_service.configure(config.url, config.token)
    return result


@router.get("/entities")
async def get_entities():
    """Get available Home Assistant entities."""
    entities = await homeassistant_service.get_entities()
    return {"entities": entities}


@router.get("/services")
async def get_services():
    """Get available Home Assistant services."""
    services = await homeassistant_service.get_services()
    return {"services": services}
