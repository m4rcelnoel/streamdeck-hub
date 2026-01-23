import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Enum
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class ActionType(str, enum.Enum):
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


class Action(Base):
    __tablename__ = "actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    config = Column(Text, nullable=False, default="{}")  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    buttons = relationship("Button", back_populates="action")
