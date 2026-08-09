from app.core.database import SessionLocal
from app.models.db import User, StaffProfile, UserChannelIdentity
from datetime import datetime, timezone

staff_members = [
    {"phone": "0911111111", "email": "youraddress@gmail.com", "specialty": "support"},
    {"phone": "0922222222", "email": "youraddress+sales@gmail.com", "specialty": "sales"},
    {"phone": "0933333333", "email": "youraddress+hr@gmail.com", "specialty": "hr"},
]

db = SessionLocal()
try:
    for s in staff_members:
        existing_identity = (
            db.query(UserChannelIdentity)
            .filter(UserChannelIdentity.channel_specific_id == s["phone"])
            .first()
        )
        if existing_identity:
            print(f"Skipping '{s['phone']}' — already exists")
            continue

        user = User(preferred_language="en", is_admin=False)
        db.add(user)
        db.flush()

        db.add(UserChannelIdentity(
            user_id=user.id,
            channel_type="web",
            channel_specific_id=s["phone"],
            verified_at=datetime.now(timezone.utc),
        ))

        db.add(StaffProfile(
            user_id=user.id,
            email=s["email"],
            specialty=s["specialty"],
            is_available=True,
        ))
        print(f"Seeded staff for '{s['phone']}' (specialty={s['specialty']})")

    db.commit()
finally:
    db.close()