import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.db import User, UserChannelIdentity


def resolve_or_create_identity(
    channel_type: str,
    channel_specific_id: str,
    db: Session,
    username: str | None = None,
    display_name: str | None = None,
    auto_verified_phone: str | None = None,  
) -> UserChannelIdentity:
    identity = (
        db.query(UserChannelIdentity)
        .filter(
            UserChannelIdentity.channel_type == channel_type,
            UserChannelIdentity.channel_specific_id == channel_specific_id,
        )
        .first()
    )

    if identity:
        if username:
            identity.username = username
        if display_name:
            identity.display_name = display_name
        db.commit()
        return identity

    user = User(id=uuid.uuid4())
    db.add(user)
    db.flush()

    identity = UserChannelIdentity(
        user_id=user.id,
        channel_type=channel_type,
        channel_specific_id=channel_specific_id,
        username=username,
        display_name=display_name,
        verified_at=datetime.now(timezone.utc) if auto_verified_phone else None,  
        pending_phone=None if auto_verified_phone else None,
    )
    db.add(identity)
    db.commit()
    db.refresh(identity)

    # If auto-verified, also check for an existing identity on another channel with this same phone,
    # and merge — same logic handle_channel_verification does manually for OTP-based channels
    if auto_verified_phone:
        _merge_if_existing_phone_owner(identity, auto_verified_phone, db)

    return identity


def _merge_if_existing_phone_owner(identity: UserChannelIdentity, phone: str, db: Session):
    existing = (
        db.query(UserChannelIdentity)
        .filter(UserChannelIdentity.channel_specific_id == phone, UserChannelIdentity.id != identity.id)
        .first()
    )
    if existing:
        identity.user_id = existing.user_id
        db.commit()