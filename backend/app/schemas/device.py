from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DeviceBase(BaseModel):
    name: Optional[str] = None
    brightness: Optional[int] = Field(None, ge=0, le=100)


class DeviceCreate(DeviceBase):
    serial_number: str
    deck_type: str
    key_count: int
    firmware_version: Optional[str] = None


class DeviceUpdate(DeviceBase):
    active_profile_id: Optional[str] = None


class DeviceResponse(BaseModel):
    id: str
    serial_number: str
    deck_type: str
    name: Optional[str]
    firmware_version: Optional[str]
    key_count: int
    active_profile_id: Optional[str]
    brightness: int
    is_connected: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
