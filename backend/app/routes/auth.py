import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from app.models.db import StaffProfile



from app.core.database import get_db
from app.auth.auth_service import generate_otp, verify_otp
from app.core.security import create_access_token

router = APIRouter()

PHONE_REGEX = re.compile(r"^09\d{8}$")
class RequestOTPBody(BaseModel):
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not PHONE_REGEX.match(v):
            raise ValueError("Phone number must be in the format 09XXXXXXXX")
        return v
    
class VerifyOTPBody(BaseModel):
    phone_number: str
    code: str
    channel_type: str = "web"

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not PHONE_REGEX.match(v):
            raise ValueError("Phone number must be in the format 09XXXXXXXX")
        return v


@router.post("/auth/request-otp")
def request_otp(body: RequestOTPBody, db: Session = Depends(get_db)):
    code = generate_otp(db, body.phone_number)
    print(f"[DEV OTP] {body.phone_number} -> {code}")  
    return {"message": "OTP sent"}


@router.post("/auth/verify-otp")
def verify_otp_route(body: VerifyOTPBody, db: Session = Depends(get_db)):
    user = verify_otp(db, body.phone_number, body.code, body.channel_type)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    token = create_access_token(str(user.id))

    staff_profile = db.query(StaffProfile).filter(StaffProfile.user_id == user.id).first()

    return {
        "access_token": token,
        "preferred_language": user.preferred_language,
        "is_admin": user.is_admin,
        "is_staff": staff_profile is not None,
    }