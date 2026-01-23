import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.action import Action
from ..schemas.action import ActionCreate, ActionUpdate, ActionResponse
from ..services.action_executor import action_executor

router = APIRouter(prefix="/api/actions", tags=["actions"])


@router.get("", response_model=List[ActionResponse])
def list_actions(db: Session = Depends(get_db)):
    """List all actions."""
    actions = db.query(Action).all()
    result = []
    for action in actions:
        config = json.loads(action.config) if isinstance(action.config, str) else action.config
        result.append(ActionResponse(
            id=action.id,
            name=action.name,
            action_type=action.action_type,
            config=config,
            created_at=action.created_at,
            updated_at=action.updated_at
        ))
    return result


@router.post("", response_model=ActionResponse)
def create_action(action: ActionCreate, db: Session = Depends(get_db)):
    """Create a new action."""
    db_action = Action(
        name=action.name,
        action_type=action.action_type.value,
        config=json.dumps(action.config)
    )
    db.add(db_action)
    db.commit()
    db.refresh(db_action)

    config = json.loads(db_action.config) if isinstance(db_action.config, str) else db_action.config
    return ActionResponse(
        id=db_action.id,
        name=db_action.name,
        action_type=db_action.action_type,
        config=config,
        created_at=db_action.created_at,
        updated_at=db_action.updated_at
    )


@router.get("/{action_id}", response_model=ActionResponse)
def get_action(action_id: str, db: Session = Depends(get_db)):
    """Get an action by ID."""
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    config = json.loads(action.config) if isinstance(action.config, str) else action.config
    return ActionResponse(
        id=action.id,
        name=action.name,
        action_type=action.action_type,
        config=config,
        created_at=action.created_at,
        updated_at=action.updated_at
    )


@router.put("/{action_id}", response_model=ActionResponse)
def update_action(action_id: str, action_update: ActionUpdate, db: Session = Depends(get_db)):
    """Update an action."""
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    update_data = action_update.model_dump(exclude_unset=True)

    if "action_type" in update_data:
        update_data["action_type"] = update_data["action_type"].value
    if "config" in update_data:
        update_data["config"] = json.dumps(update_data["config"])

    for field, value in update_data.items():
        setattr(action, field, value)

    db.commit()
    db.refresh(action)

    config = json.loads(action.config) if isinstance(action.config, str) else action.config
    return ActionResponse(
        id=action.id,
        name=action.name,
        action_type=action.action_type,
        config=config,
        created_at=action.created_at,
        updated_at=action.updated_at
    )


@router.delete("/{action_id}")
def delete_action(action_id: str, db: Session = Depends(get_db)):
    """Delete an action."""
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    db.delete(action)
    db.commit()
    return {"status": "deleted"}


@router.post("/{action_id}/test")
async def test_action(action_id: str, db: Session = Depends(get_db)):
    """Test execute an action."""
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    result = await action_executor.test_action(action)
    return result
