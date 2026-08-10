from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import User, UserChannelIdentity, Message, AuditLog, UserMemory, Handoff

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/get-users")
def list_users(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        identity = db.query(UserChannelIdentity).filter(UserChannelIdentity.user_id == u.id).first()
        message_count = db.query(Message).filter(Message.user_id == u.id).count()
        last_message = (
            db.query(Message)
            .filter(Message.user_id == u.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        result.append({
            "id": str(u.id),
            "phone_number": identity.channel_specific_id if identity else None,
            "preferred_language": u.preferred_language,
            "is_admin": u.is_admin,
            "message_count": message_count,
            "last_active": last_message.created_at if last_message else None,
            "created_at": u.created_at,
        })
    return result


@router.get("/get-user/{user_id}")
def get_user_detail(user_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    identity = db.query(UserChannelIdentity).filter(UserChannelIdentity.user_id == user_id).first()

    messages = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.created_at.desc())
        .limit(100)
        .all()
    )
    messages.reverse()

    audit_entries = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(50)
        .all()
    )

    memory_entries = db.query(UserMemory).filter(UserMemory.user_id == user_id).all()

    handoff_count = db.query(Handoff).filter(Handoff.user_id == user_id).count()

    return {
        "id": str(user.id),
        "phone_number": identity.channel_specific_id if identity else None,
        "preferred_language": user.preferred_language,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "analytics": {
            "message_count": len(messages),
            "handoff_count": handoff_count,
            "last_active": messages[-1].created_at if messages else None,
        },
        "messages": [
            {"role": m.role, "content": m.content, "channel_type": m.channel_type, "created_at": m.created_at}
            for m in messages
        ],
        "audit_log": [
            {"action": a.action, "payload": a.payload, "result": a.result, "created_at": a.created_at}
            for a in audit_entries
        ],
        "memory": [
            {"id": str(m.id), "key": m.key, "value": m.value, "updated_at": m.updated_at}
            for m in memory_entries
        ],
    }


@router.patch("/toggle-active/{user_id}")
def toggle_user_active(user_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/delete-user/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Reassign handoffs where this user is assigned_staff to NULL
    db.query(Handoff).filter(Handoff.assigned_staff_id == user_id).update(
        {"assigned_staff_id": None}
    )
    
    # Delete other related records
    db.query(UserChannelIdentity).filter(UserChannelIdentity.user_id == user_id).delete()
    db.query(Message).filter(Message.user_id == user_id).delete()
    db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()
    db.query(UserMemory).filter(UserMemory.user_id == user_id).delete()
    db.query(Handoff).filter(Handoff.user_id == user_id).delete()
    
    # Finally delete the user
    db.delete(user)
    db.commit()
    return {"message": "User deleted permanently"}


class MemoryUpdate(BaseModel):
    value: str


@router.patch("/memory/{memory_id}")
def update_memory_entry(memory_id: str, body: MemoryUpdate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    entry = db.query(UserMemory).filter(UserMemory.id == memory_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    entry.value = body.value
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/memory/{memory_id}")
def delete_memory_entry(memory_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    entry = db.query(UserMemory).filter(UserMemory.id == memory_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Memory entry deleted"}


@router.post("/memory/reset/{user_id}")
def reset_user_memory(user_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    db.query(UserMemory).filter(UserMemory.user_id == user_id).delete()
    db.commit()
    return {"message": "All memory entries reset for this user"}