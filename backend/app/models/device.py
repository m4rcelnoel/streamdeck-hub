import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    serial_number = Column(String, unique=True, nullable=False, index=True)
    deck_type = Column(String, nullable=False)
    name = Column(String, nullable=True)
    firmware_version = Column(String, nullable=True)
    key_count = Column(Integer, nullable=False)
    active_profile_id = Column(String, ForeignKey("profiles.id"), nullable=True)
    brightness = Column(Integer, default=50)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    active_profile = relationship("Profile", back_populates="devices")
