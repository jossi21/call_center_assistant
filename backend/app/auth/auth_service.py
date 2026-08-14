import random
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.db import OTPVerification, User, UserChannelIdentity

OTP_EXPIRY_MINUTES = 2


def generate_otp(db: Session, phone_number: str) -> str:
    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)  

    otp = OTPVerification(
        phone_number=phone_number,
        code=code,
        expires_at=expires_at,
    )
    db.add(otp)
    db.commit()

    return code


def verify_otp(db: Session, phone_number: str, code: str, channel_type: str = "web") -> User | None:
    otp = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone_number == phone_number,
            OTPVerification.code == code,
            OTPVerification.verified == False,
            OTPVerification.expires_at > datetime.now(timezone.utc), 
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not otp:
        return None

    otp.verified = True

    identity = (
        db.query(UserChannelIdentity)
        .filter(
            UserChannelIdentity.channel_type == channel_type,
            UserChannelIdentity.channel_specific_id == phone_number,
        )
        .first()
    )

    if identity:
        user = identity.user
    else:
        user = User()
        db.add(user)
        db.flush()

        identity = UserChannelIdentity(
            user_id=user.id,
            channel_type=channel_type,
            channel_specific_id=phone_number,
            verified_at=datetime.now(timezone.utc),  
        )
        db.add(identity)

    db.commit()
    db.refresh(user)

    return user