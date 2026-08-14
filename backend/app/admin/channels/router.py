# app/admin/channels/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import Channel
from app.channels.registry import CHANNEL_TYPES

router = APIRouter(prefix="/channels", tags=["Channels"])


class ChannelCreate(BaseModel):
    name: str
    display_name: str
    config: dict


class ChannelUpdate(BaseModel):
    display_name: str | None = None
    config: dict | None = None


def _validate_config(channel_type: str, config: dict):
    type_def = CHANNEL_TYPES.get(channel_type)
    if not type_def:
        raise HTTPException(status_code=400, detail=f"Unknown channel type: {channel_type}")

    missing = [
        f["key"] for f in type_def["fields"]
        if f["required"] and not config.get(f["key"])
    ]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")


@router.get("/channel-types")
def list_channel_types(_: str = Depends(require_admin)):
    return CHANNEL_TYPES


@router.get("/get-channels")
def list_channels(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(Channel).all()


@router.post("/create-channel")
def create_channel(body: ChannelCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    existing = db.query(Channel).filter(Channel.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Channel with this name already exists")

    _validate_config(body.name, body.config)

    channel = Channel(**body.model_dump(), is_active=True)
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


@router.patch("/update-channel/{channel_id}")
def update_channel(channel_id: str, body: ChannelUpdate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    update_data = body.model_dump(exclude_unset=True)
    if "config" in update_data:
        _validate_config(channel.name, update_data["config"])

    for field, value in update_data.items():
        setattr(channel, field, value)

    db.commit()
    db.refresh(channel)
    return channel


@router.patch("/toggle-active/{channel_id}")
def toggle_channel_active(channel_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    channel.is_active = not channel.is_active
    db.commit()
    db.refresh(channel)
    return channel


@router.delete("/delete-channel/{channel_id}")
def delete_channel(channel_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    db.delete(channel)
    db.commit()
    return {"message": "Channel permanently deleted"}