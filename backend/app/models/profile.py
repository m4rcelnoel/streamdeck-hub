import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    device_type = Column(String, nullable=True)  # e.g., "Stream Deck XL"
    is_default = Column(Boolean, default=False)
    is_folder = Column(Boolean, default=False)  # True if this profile is used as a folder
    parent_profile_id = Column(String, ForeignKey("profiles.id"), nullable=True)  # For folder hierarchy
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    buttons = relationship("Button", back_populates="profile", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="active_profile")
    parent_profile = relationship("Profile", remote_side=[id], backref="child_profiles")
