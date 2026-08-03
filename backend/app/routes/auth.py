from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.auth.auth_service import generate_otp, verify_otp
from app.core.security import create_access_token

router = APIRouter()


class RequestOTPBody(BaseModel):
    phone_number: str


class VerifyOTPBody(BaseModel):
    phone_number: str
    code: str
    channel_type: str = "web"


@router.post("/auth/request-otp")
def request_otp(body: RequestOTPBody, db: Session = Depends(get_db)):
    code = generate_otp(db, body.phone_number)
    return {"message": "OTP generated", "demo_code": code}  # demo_code: remove in production


@router.post("/auth/verify-otp")
def verify_otp_route(body: VerifyOTPBody, db: Session = Depends(get_db)):
    user = verify_otp(db, body.phone_number, body.code, body.channel_type)

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    token = create_access_token(str(user.id))
    return {"access_token": token, "preferred_language": user.preferred_language}