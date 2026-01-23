from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.device import Device
from ..schemas.device import DeviceResponse, DeviceUpdate
from ..services.streamdeck import streamdeck_service

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("", response_model=List[DeviceResponse])
def list_devices(db: Session = Depends(get_db)):
    """List all known devices with connection status."""
    devices = db.query(Device).all()
    connected_serials = streamdeck_service.get_connected_devices()

    result = []
    for device in devices:
        device_dict = {
            "id": device.id,
            "serial_number": device.serial_number,
            "deck_type": device.deck_type,
            "name": device.name,
            "firmware_version": device.firmware_version,
            "key_count": device.key_count,
            "active_profile_id": device.active_profile_id,
            "brightness": device.brightness,
            "is_connected": device.serial_number in connected_serials,
            "created_at": device.created_at,
            "updated_at": device.updated_at,
        }
        result.append(DeviceResponse(**device_dict))

    return result


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: str, db: Session = Depends(get_db)):
    """Get a specific device by ID."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    connected_serials = streamdeck_service.get_connected_devices()
    return DeviceResponse(
        id=device.id,
        serial_number=device.serial_number,
        deck_type=device.deck_type,
        name=device.name,
        firmware_version=device.firmware_version,
        key_count=device.key_count,
        active_profile_id=device.active_profile_id,
        brightness=device.brightness,
        is_connected=device.serial_number in connected_serials,
        created_at=device.created_at,
        updated_at=device.updated_at,
    )


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(device_id: str, device_update: DeviceUpdate, db: Session = Depends(get_db)):
    """Update a device (name, brightness, active profile)."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    update_data = device_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(device, field, value)

    db.commit()
    db.refresh(device)

    # Apply changes to physical device
    connected_serials = streamdeck_service.get_connected_devices()
    is_connected = device.serial_number in connected_serials

    if is_connected:
        if "brightness" in update_data:
            streamdeck_service.set_brightness(device.serial_number, device.brightness)
        if "active_profile_id" in update_data:
            streamdeck_service.refresh_device(device.serial_number, db)

    return DeviceResponse(
        id=device.id,
        serial_number=device.serial_number,
        deck_type=device.deck_type,
        name=device.name,
        firmware_version=device.firmware_version,
        key_count=device.key_count,
        active_profile_id=device.active_profile_id,
        brightness=device.brightness,
        is_connected=is_connected,
        created_at=device.created_at,
        updated_at=device.updated_at,
    )


@router.post("/{device_id}/identify")
def identify_device(device_id: str, db: Session = Depends(get_db)):
    """Flash the device for identification."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if not streamdeck_service.is_device_connected(device.serial_number):
        raise HTTPException(status_code=400, detail="Device is not connected")

    streamdeck_service.identify_device(device.serial_number)
    return {"status": "identifying"}
