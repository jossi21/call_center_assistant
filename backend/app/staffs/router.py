from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.current_user import get_current_user_id
from app.models.db import StaffProfile, Handoff, Message, UserChannelIdentity

router = APIRouter(prefix="/staff", tags=["Staff Profile"])


def _require_staff(user_id: str, db: Session) -> StaffProfile:
    profile = db.query(StaffProfile).filter(StaffProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=403, detail="Not a staff member")
    return profile


@router.get("/my-profile")
def get_my_profile(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return _require_staff(user_id, db)


class AvailabilityUpdate(BaseModel):
    is_available: bool


@router.patch("/update-my-availability")
def update_my_availability(body: AvailabilityUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    profile = _require_staff(user_id, db)
    profile.is_available = body.is_available
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/get-my-cases")
def list_my_cases(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_staff(user_id, db)
    cases = (
        db.query(Handoff)
        .filter(Handoff.assigned_staff_id == user_id, Handoff.status == "assigned")
        .order_by(Handoff.assigned_at.desc())
        .all()
    )

    result = []
    for c in cases:
        identity = db.query(UserChannelIdentity).filter(UserChannelIdentity.user_id == c.user_id).first()
        history = (
            db.query(Message)
            .filter(Message.user_id == c.user_id)
            .order_by(Message.created_at.desc())
            .limit(20)
            .all()
        )
        history.reverse()
        result.append({
            "id": str(c.id),
            "reason": c.reason,
            "user_contact": identity.channel_specific_id if identity else "unknown",
            "assigned_at": c.assigned_at,
            "history": [{"role": m.role, "content": m.content} for m in history],
        })
    return result


@router.post("/my-cases/{handoff_id}/resolve")
def resolve_case(handoff_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_staff(user_id, db)
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id, Handoff.assigned_staff_id == user_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Case not found or not assigned to you")

    handoff.status = "resolved"
    handoff.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Case resolved"}