from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.profile import Profile
from ..models.button import Button
from ..models.device import Device
from ..schemas.button import ButtonCreate, ButtonUpdate, ButtonResponse
from ..services.streamdeck import streamdeck_service

router = APIRouter(prefix="/api/profiles/{profile_id}/buttons", tags=["buttons"])


@router.get("", response_model=List[ButtonResponse])
def list_buttons(profile_id: str, page: int = None, db: Session = Depends(get_db)):
    """Get all buttons for a profile, optionally filtered by page."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    query = db.query(Button).filter(Button.profile_id == profile_id)
    if page is not None:
        query = query.filter(Button.page == page)

    buttons = query.order_by(Button.page, Button.position).all()
    return buttons


@router.put("/{position}", response_model=ButtonResponse)
def update_button(
    profile_id: str,
    position: int,
    button_update: ButtonUpdate,
    page: int = 0,
    db: Session = Depends(get_db)
):
    """Update or create a button at a position on a specific page."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Get page from update data or query param
    update_data = button_update.model_dump(exclude_unset=True)
    button_page = update_data.get("page", page)

    button = db.query(Button).filter(
        Button.profile_id == profile_id,
        Button.position == position,
        Button.page == button_page
    ).first()

    if button:
        # Update existing button
        for field, value in update_data.items():
            setattr(button, field, value)
    else:
        # Create new button
        button = Button(
            profile_id=profile_id,
            position=position,
            page=button_page,
            **{k: v for k, v in update_data.items() if k != "page"}
        )
        db.add(button)

    db.commit()
    db.refresh(button)

    # Update physical devices using this profile (only if on current page)
    _update_connected_devices(profile_id, position, button, db, button_page)

    return button


@router.delete("/{position}")
def delete_button(profile_id: str, position: int, page: int = 0, db: Session = Depends(get_db)):
    """Clear a button at a position on a specific page."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    button = db.query(Button).filter(
        Button.profile_id == profile_id,
        Button.position == position,
        Button.page == page
    ).first()

    if button:
        db.delete(button)
        db.commit()

        # Update physical devices (only if on same page)
        devices = db.query(Device).filter(Device.active_profile_id == profile_id).all()
        for device in devices:
            if streamdeck_service.is_device_connected(device.serial_number):
                state = streamdeck_service.get_device_state(device.serial_number)
                if state and state.get("current_page", 0) == page:
                    streamdeck_service.refresh_device(device.serial_number, db, page)

    return {"status": "deleted"}


def _update_connected_devices(profile_id: str, position: int, button: Button, db: Session, page: int = 0):
    """Update the button on all connected devices using this profile (if on same page)."""
    devices = db.query(Device).filter(Device.active_profile_id == profile_id).all()

    for device in devices:
        if streamdeck_service.is_device_connected(device.serial_number):
            # Only update if device is on the same page
            state = streamdeck_service.get_device_state(device.serial_number)
            if state and state.get("current_page", 0) == page:
                streamdeck_service.update_button(device.serial_number, position, button)
