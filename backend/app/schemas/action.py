from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ActionType(str, Enum):
    SCRIPT = "script"
    HTTP = "http"
    HOMEASSISTANT = "homeassistant"
    MULTI = "multi"
    TOGGLE = "toggle"
    # Media actions
    SONOS = "sonos"
    SPOTIFY = "spotify"
    # Interactive data actions
    COUNTER = "counter"
    TIMER = "timer"
    # System actions
    HOTKEY = "hotkey"
    WAKE_ON_LAN = "wake_on_lan"
    # Streaming integrations
    DISCORD = "discord"
    TWITCH = "twitch"
    # Navigation actions
    NEXT_PAGE = "next_page"
    PREV_PAGE = "prev_page"
    GO_TO_PAGE = "go_to_page"
    OPEN_FOLDER = "open_folder"
    GO_BACK = "go_back"


class ScriptConfig(BaseModel):
    command: str
    working_dir: Optional[str] = None
    timeout: int = 30


class HttpConfig(BaseModel):
    method: str = "POST"
    url: str
    headers: Dict[str, str] = {}
    body: Optional[Dict[str, Any]] = None


class HomeAssistantConfig(BaseModel):
    domain: str
    service: str
    entity_id: str
    service_data: Optional[Dict[str, Any]] = None


class MultiConfig(BaseModel):
    action_ids: List[str]
    delay_ms: int = 100


class ToggleConfig(BaseModel):
    on_action_id: str
    off_action_id: str


class GoToPageConfig(BaseModel):
    page: int


class OpenFolderConfig(BaseModel):
    profile_id: str  # The folder profile to open


class CounterConfig(BaseModel):
    action: str = "increment"  # increment, decrement, reset, set
    step: int = 1
    min_value: Optional[int] = None
    max_value: Optional[int] = None
    set_value: Optional[int] = None  # for action="set"
    wrap: bool = False  # wrap around when hitting min/max


class TimerConfig(BaseModel):
    action: str = "toggle"  # start, pause, resume, reset, toggle
    mode: str = "stopwatch"  # stopwatch, countdown
    duration: Optional[int] = None  # for countdown mode, in seconds


class HotkeyConfig(BaseModel):
    keys: List[str]  # e.g., ["ctrl", "shift", "a"]
    hold_time: int = 0  # milliseconds to hold the keys


class WakeOnLanConfig(BaseModel):
    mac_address: str  # MAC address of target machine
    ip_address: Optional[str] = None  # Optional IP for directed broadcast
    port: int = 9  # WOL port (usually 9 or 7)


class DiscordConfig(BaseModel):
    action: str  # webhook, bot_message, change_status
    webhook_url: Optional[str] = None
    message: Optional[str] = None
    bot_token: Optional[str] = None
    channel_id: Optional[str] = None
    status: Optional[str] = None  # online, idle, dnd, invisible
    activity_type: Optional[str] = None  # playing, streaming, listening, watching
    activity_name: Optional[str] = None


class TwitchConfig(BaseModel):
    action: str  # create_clip, create_marker, send_chat, update_title, run_ad
    channel: Optional[str] = None
    message: Optional[str] = None
    title: Optional[str] = None
    game: Optional[str] = None
    ad_length: Optional[int] = None  # 30, 60, 90, 120, 150, 180


class ActionBase(BaseModel):
    name: str
    action_type: ActionType
    config: Dict[str, Any] = {}


class ActionCreate(ActionBase):
    pass


class ActionUpdate(BaseModel):
    name: Optional[str] = None
    action_type: Optional[ActionType] = None
    config: Optional[Dict[str, Any]] = None


class ActionResponse(BaseModel):
    id: str
    name: str
    action_type: str
    config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
