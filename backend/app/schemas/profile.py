from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    device_type: Optional[str] = None
    is_default: bool = False
    is_folder: bool = False
    parent_profile_id: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    device_type: Optional[str] = None
    is_default: Optional[bool] = None
    is_folder: Optional[bool] = None
    parent_profile_id: Optional[str] = None


class ButtonInProfile(BaseModel):
    id: str
    position: int
    page: int = 0
    label: Optional[str]
    icon_path: Optional[str]
    icon_color: Optional[str]
    background_color: Optional[str]
    action_id: Optional[str]

    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    device_type: Optional[str]
    is_default: bool
    is_folder: bool = False
    parent_profile_id: Optional[str] = None
    buttons: List[ButtonInProfile] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileExport(BaseModel):
    name: str
    description: Optional[str]
    device_type: Optional[str]
    buttons: List[dict]
    actions: List[dict]
