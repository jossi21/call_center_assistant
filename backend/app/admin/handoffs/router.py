from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import Handoff, StaffProfile

router = APIRouter(prefix="/handoffs", tags=["Handoffs"])


@router.patch("/toggle-status/{handoff_id}")
def toggle_handoff_status(handoff_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")

    if handoff.status == "resolved":
        handoff.status = "assigned" if handoff.assigned_staff_id else "waiting"
        handoff.resolved_at = None
    else:
        handoff.status = "resolved"
        handoff.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(handoff)
    return handoff


class ReassignBody(BaseModel):
    staff_id: str  # StaffProfile.id, not user_id — the frontend will send the profile id


@router.patch("/reassign/{handoff_id}")
def reassign_handoff(handoff_id: str, body: ReassignBody, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")

    new_staff = db.query(StaffProfile).filter(StaffProfile.id == body.staff_id).first()
    if not new_staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    handoff.assigned_staff_id = new_staff.user_id
    handoff.status = "assigned"
    handoff.assigned_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(handoff)
    return handoff