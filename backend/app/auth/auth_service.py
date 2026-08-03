import random
import string
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.db import OTPVerification, User, UserChannelIdentity

OTP_EXPIRY_MINUTES = 5


def generate_otp(db: Session, phone_number: str) -> str:
    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    otp = OTPVerification(
        phone_number=phone_number,
        code=code,
        expires_at=expires_at,
    )
    db.add(otp)
    db.commit()

    return code  # demo mode: returned directly instead of sent via SMS


def verify_otp(db: Session, phone_number: str, code: str, channel_type: str = "web") -> User | None:
    otp = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone_number == phone_number,
            OTPVerification.code == code,
            OTPVerification.verified == False,
            OTPVerification.expires_at > datetime.utcnow(),
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not otp:
        return None

    otp.verified = True

    # Look up existing identity, or create a new user + identity
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
        db.flush()  # get user.id before creating the identity row

        identity = UserChannelIdentity(
            user_id=user.id,
            channel_type=channel_type,
            channel_specific_id=phone_number,
            verified_at=datetime.utcnow(),
        )
        db.add(identity)

    db.commit()
    db.refresh(user)

    return user