import re
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.db import UserChannelIdentity, OTPVerification, Message
from app.auth.auth_service import generate_otp

PHONE_REGEX = re.compile(r"^09\d{8}$")


def _verify_code(phone: str, code: str, db: Session) -> bool:
    otp = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone_number == phone,
            OTPVerification.code == code.strip(),
            OTPVerification.verified == False,
            OTPVerification.expires_at > datetime.now(timezone.utc),
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )
    if not otp:
        return False
    otp.verified = True
    db.commit()
    return True


def handle_channel_verification(identity: UserChannelIdentity, text: str, db: Session) -> str | None:
    """Returns a reply string while verification is still in progress,
    or None once verified — meaning the caller should proceed to normal handling."""
    if identity.verified_at:
        return None

    cleaned = text.strip()

    if not identity.pending_phone:
        if not PHONE_REGEX.match(cleaned):
            return "Welcome! To get started, please share your phone number in the format 09XXXXXXXX."

        code = generate_otp(db, cleaned)
        print(f"[DEV OTP] {cleaned} -> {code}")
        identity.pending_phone = cleaned
        db.commit()
        return "Thanks! We've sent a verification code to that number. Please enter it here."

    # if user sends what looks like a phone number again while awaiting OTP,
    # treat it as "start over with a new code" rather than "wrong OTP"
    if PHONE_REGEX.match(cleaned):
        code = generate_otp(db, cleaned)
        print(f"[DEV OTP] {cleaned} -> {code}")
        identity.pending_phone = cleaned
        db.commit()
        return "Got it, sent a new verification code to that number. Please enter it here."

    phone = identity.pending_phone

    if not _verify_code(phone, cleaned, db):
        return "That code doesn't look right or has expired. Please try again, or send your phone number again to get a new code."


    # Check if this phone is already linked to an existing user via another channel (e.g. web)
    existing_identity = (
        db.query(UserChannelIdentity)
        .filter(UserChannelIdentity.channel_specific_id == phone, UserChannelIdentity.id != identity.id)
        .first()
    )

    if existing_identity:
        # Merge: this Telegram identity now points at the same canonical user as their web account
        old_user_id = identity.user_id
        identity.user_id = existing_identity.user_id
        identity.verified_at = datetime.now(timezone.utc)
        identity.pending_phone = None
        # carry over any messages sent during this brief verification exchange
        db.query(Message).filter(Message.user_id == old_user_id).update({"user_id": existing_identity.user_id})
        db.commit()
        return "You're verified, and I can see you've chatted with us before — welcome back! How can I help you today?"

    identity.verified_at = datetime.now(timezone.utc)
    identity.pending_phone = None
    db.commit()
    return "You're verified! How can I help you today?"