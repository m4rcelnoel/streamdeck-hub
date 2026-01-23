import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models.profile import Profile
from ..models.button import Button
from ..models.action import Action
from ..schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse, ProfileExport

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("", response_model=List[ProfileResponse])
def list_profiles(db: Session = Depends(get_db)):
    """List all profiles."""
    profiles = db.query(Profile).all()
    return profiles


@router.post("", response_model=ProfileResponse)
def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    """Create a new profile."""
    db_profile = Profile(**profile.model_dump())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.get("/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: str, db: Session = Depends(get_db)):
    """Get a profile with its buttons."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/{profile_id}", response_model=ProfileResponse)
def update_profile(profile_id: str, profile_update: ProfileUpdate, db: Session = Depends(get_db)):
    """Update a profile."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = profile_update.model_dump(exclude_unset=True)

    # If setting as default, unset other defaults
    if update_data.get("is_default"):
        db.query(Profile).filter(Profile.is_default == True).update({"is_default": False})

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/{profile_id}")
def delete_profile(profile_id: str, db: Session = Depends(get_db)):
    """Delete a profile."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    db.delete(profile)
    db.commit()
    return {"status": "deleted"}


@router.post("/{profile_id}/duplicate", response_model=ProfileResponse)
def duplicate_profile(profile_id: str, db: Session = Depends(get_db)):
    """Duplicate a profile with all its buttons."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Create new profile
    new_profile = Profile(
        name=f"{profile.name} (Copy)",
        description=profile.description,
        device_type=profile.device_type,
        is_default=False
    )
    db.add(new_profile)
    db.flush()

    # Copy buttons
    buttons = db.query(Button).filter(Button.profile_id == profile_id).all()
    for button in buttons:
        new_button = Button(
            profile_id=new_profile.id,
            position=button.position,
            page=button.page,
            label=button.label,
            icon_path=button.icon_path,
            icon_color=button.icon_color,
            background_color=button.background_color,
            action_id=button.action_id,
            is_toggle=button.is_toggle,
            on_color=button.on_color,
            off_color=button.off_color,
            data_source=button.data_source,
            data_format=button.data_format,
            refresh_interval=button.refresh_interval,
            data_config=button.data_config,
            animation=button.animation,
            animation_speed=button.animation_speed,
            animation_trigger=button.animation_trigger
        )
        db.add(new_button)

    db.commit()
    db.refresh(new_profile)
    return new_profile


@router.get("/{profile_id}/export")
def export_profile(profile_id: str, db: Session = Depends(get_db)):
    """Export a profile as JSON."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    buttons = db.query(Button).filter(Button.profile_id == profile_id).all()

    # Collect all action IDs used by buttons
    action_ids = {b.action_id for b in buttons if b.action_id}
    actions = db.query(Action).filter(Action.id.in_(action_ids)).all() if action_ids else []

    export_data = {
        "name": profile.name,
        "description": profile.description,
        "device_type": profile.device_type,
        "buttons": [
            {
                "position": b.position,
                "page": b.page,
                "label": b.label,
                "icon_path": b.icon_path,
                "icon_color": b.icon_color,
                "background_color": b.background_color,
                "action_id": b.action_id,
                "is_toggle": b.is_toggle,
                "on_color": b.on_color,
                "off_color": b.off_color,
                "data_source": b.data_source,
                "data_format": b.data_format,
                "refresh_interval": b.refresh_interval,
                "data_config": b.data_config,
                "animation": b.animation,
                "animation_speed": b.animation_speed,
                "animation_trigger": b.animation_trigger
            }
            for b in buttons
        ],
        "actions": [
            {
                "id": a.id,
                "name": a.name,
                "action_type": a.action_type,
                "config": json.loads(a.config) if isinstance(a.config, str) else a.config
            }
            for a in actions
        ]
    }

    return JSONResponse(content=export_data)


@router.post("/import", response_model=ProfileResponse)
def import_profile(profile_data: ProfileExport, db: Session = Depends(get_db)):
    """Import a profile from JSON."""
    # Create action ID mapping (old -> new)
    action_mapping = {}

    # Create actions first
    for action_data in profile_data.actions:
        old_id = action_data.get("id")
        new_action = Action(
            name=action_data["name"],
            action_type=action_data["action_type"],
            config=json.dumps(action_data.get("config", {}))
        )
        db.add(new_action)
        db.flush()
        if old_id:
            action_mapping[old_id] = new_action.id

    # Create profile
    new_profile = Profile(
        name=profile_data.name,
        description=profile_data.description,
        device_type=profile_data.device_type,
        is_default=False
    )
    db.add(new_profile)
    db.flush()

    # Create buttons with updated action IDs
    for button_data in profile_data.buttons:
        old_action_id = button_data.get("action_id")
        new_action_id = action_mapping.get(old_action_id) if old_action_id else None

        new_button = Button(
            profile_id=new_profile.id,
            position=button_data["position"],
            page=button_data.get("page", 0),
            label=button_data.get("label"),
            icon_path=button_data.get("icon_path"),
            icon_color=button_data.get("icon_color"),
            background_color=button_data.get("background_color"),
            action_id=new_action_id,
            is_toggle=button_data.get("is_toggle", False),
            on_color=button_data.get("on_color"),
            off_color=button_data.get("off_color"),
            data_source=button_data.get("data_source"),
            data_format=button_data.get("data_format"),
            refresh_interval=button_data.get("refresh_interval"),
            data_config=button_data.get("data_config"),
            animation=button_data.get("animation"),
            animation_speed=button_data.get("animation_speed", "normal"),
            animation_trigger=button_data.get("animation_trigger", "always")
        )
        db.add(new_button)

    db.commit()
    db.refresh(new_profile)
    return new_profile
