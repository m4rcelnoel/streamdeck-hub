import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from ..database import Base


class Button(Base):
    __tablename__ = "buttons"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    page = Column(Integer, default=0)  # Page number (0 = first page, optional)
    label = Column(String, nullable=True)
    icon_path = Column(String, nullable=True)
    icon_color = Column(String, nullable=True)  # Hex color
    background_color = Column(String, nullable=True)  # Hex color
    action_id = Column(String, ForeignKey("actions.id"), nullable=True)

    # Toggle button fields
    is_toggle = Column(Boolean, default=False)
    on_color = Column(String, nullable=True)  # Hex color when ON
    off_color = Column(String, nullable=True)  # Hex color when OFF

    # Data display fields
    data_source = Column(String, nullable=True)  # time, system, weather, media, etc.
    data_format = Column(String, nullable=True)  # Specific format for the data source
    refresh_interval = Column(Integer, nullable=True)  # Refresh interval in ms
    data_config = Column(JSON, nullable=True)  # Additional config (location, entity_id, etc.)

    # Animation fields
    animation = Column(String, nullable=True)  # none, pulse, flash, glow, color_cycle, bounce, shake
    animation_speed = Column(String, default="normal")  # slow, normal, fast
    animation_trigger = Column(String, default="always")  # always, on_press, on_state_on, on_state_off

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("Profile", back_populates="buttons")
    action = relationship("Action", back_populates="buttons")

    __table_args__ = (
        # Unique constraint: one button per position per profile
        {"sqlite_autoincrement": True},
    )
