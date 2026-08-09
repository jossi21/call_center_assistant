from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import StaffProfile, User, UserChannelIdentity

router = APIRouter(prefix="/staffs", tags=["Staffs"])


class StaffCreate(BaseModel):
    phone_number: str
    name: str
    email: str
    specialty: str


class StaffUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    specialty: str | None = None


class AvailabilityToggle(BaseModel):
    is_available: bool


@router.get("/get-staffs")
def list_staff(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    profiles = db.query(StaffProfile).all()
    result = []
    for p in profiles:
        identity = db.query(UserChannelIdentity).filter(UserChannelIdentity.user_id == p.user_id).first()
        result.append({
            "id": str(p.id),
            "user_id": str(p.user_id),
            "phone_number": identity.channel_specific_id if identity else None,
            "name": p.name,
            "email": p.email,
            "specialty": p.specialty,
            "is_available": p.is_available,
})
    return result


@router.post("/create-staff")
def create_staff(body: StaffCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    existing_identity = (
        db.query(UserChannelIdentity)
        .filter(UserChannelIdentity.channel_specific_id == body.phone_number)
        .first()
    )

    if existing_identity:
        user_id = existing_identity.user_id
        existing_profile = db.query(StaffProfile).filter(StaffProfile.user_id == user_id).first()
        if existing_profile:
            raise HTTPException(status_code=400, detail="This person is already a staff member")
    else:
        user = User(preferred_language="en", is_admin=False)
        db.add(user)
        db.flush()
        user_id = user.id
        db.add(UserChannelIdentity(
            user_id=user_id,
            channel_type="web",
            channel_specific_id=body.phone_number,
            verified_at=datetime.now(timezone.utc),
        ))

    profile = StaffProfile(
        user_id=user_id,
        name=body.name,
        email=body.email,
        specialty=body.specialty,
        is_available=True,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/update-staff/{staff_id}")
def update_staff(staff_id: str, body: StaffUpdate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    profile = db.query(StaffProfile).filter(StaffProfile.id == staff_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Staff member not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/toggle-active/{staff_id}")
def toggle_staff_active(staff_id: str, body: AvailabilityToggle, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    profile = db.query(StaffProfile).filter(StaffProfile.id == staff_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Staff member not found")

    profile.is_available = body.is_available
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/delete-staff/{staff_id}")
def delete_staff(staff_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    profile = db.query(StaffProfile).filter(StaffProfile.id == staff_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Staff member not found")

    db.delete(profile)  
    db.commit()
    return {"message": "Staff member permanently removed"}