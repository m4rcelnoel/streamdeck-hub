from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class ButtonBase(BaseModel):
    label: Optional[str] = None
    icon_path: Optional[str] = None
    icon_color: Optional[str] = None
    background_color: Optional[str] = None
    action_id: Optional[str] = None
    page: int = 0  # Page number, default to first page

    # Toggle button fields
    is_toggle: bool = False
    on_color: Optional[str] = None
    off_color: Optional[str] = None

    # Data display fields
    data_source: Optional[str] = None
    data_format: Optional[str] = None
    refresh_interval: Optional[int] = None
    data_config: Optional[Dict[str, Any]] = None

    # Animation fields
    animation: Optional[str] = None  # none, pulse, flash, glow, color_cycle, bounce, shake
    animation_speed: str = "normal"  # slow, normal, fast
    animation_trigger: str = "always"  # always, on_press, on_state_on, on_state_off


class ButtonCreate(ButtonBase):
    position: int


class ButtonUpdate(ButtonBase):
    pass


class ButtonResponse(BaseModel):
    id: str
    profile_id: str
    position: int
    page: int = 0
    label: Optional[str]
    icon_path: Optional[str]
    icon_color: Optional[str]
    background_color: Optional[str]
    action_id: Optional[str]

    # Toggle button fields
    is_toggle: bool = False
    on_color: Optional[str] = None
    off_color: Optional[str] = None

    # Data display fields
    data_source: Optional[str] = None
    data_format: Optional[str] = None
    refresh_interval: Optional[int] = None
    data_config: Optional[Dict[str, Any]] = None

    # Animation fields
    animation: Optional[str] = None
    animation_speed: str = "normal"
    animation_trigger: str = "always"

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
