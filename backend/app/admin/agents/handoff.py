from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.db import Handoff, StaffProfile, Message, UserChannelIdentity, Notification, StaffSettings
from app.services.email_service import send_handoff_email
from langchain_core.messages import SystemMessage

from app.core.config import settings
from app.core.llm import llm



def wants_human_handoff(message: str, last_assistant_message: str | None) -> bool:
    context = f'\nThe assistant just said: "{last_assistant_message}"' if last_assistant_message else ""
    check_prompt = f"""Does this message ask to talk to a human, a real person, or a support agent — either directly, or by agreeing to an offer to connect them with one?{context}
Message: "{message}"
Reply with exactly one word: yes or no.
"""
    result = llm.invoke([SystemMessage(content=check_prompt)])
    return result.content.strip().lower().startswith("yes")


def _get_user_contact(user_id: str, db: Session) -> str:
    identity = db.query(UserChannelIdentity).filter(UserChannelIdentity.user_id == user_id).first()
    return identity.channel_specific_id if identity else "unknown"


def _build_conversation_summary(history: list[Message]) -> str:
    lines = [f"{m.role}: {m.content}" for m in history[-10:]]
    return "\n".join(lines) if lines else "No prior conversation."


def _assign_staff(originating_agent: str | None, db: Session) -> StaffProfile | None:
    def _pick_least_busy(candidates: list[StaffProfile]) -> StaffProfile | None:
        if not candidates:
            return None
        scored = []
        for staff in candidates:
            active_count = (
                db.query(Handoff)
                .filter(Handoff.assigned_staff_id == staff.user_id, Handoff.status == "assigned")
                .count()
            )
            scored.append((active_count, staff))
        scored.sort(key=lambda x: x[0])
        return scored[0][1]

    def _auto_assign_enabled(candidates: list[StaffProfile]) -> list[StaffProfile]:
        # Only consider staff who've opted into auto-assignment. Someone who's
        # never visited Settings has no row yet — treat that as "enabled",
        # matching StaffSettings' own column default.
        enabled = []
        for staff in candidates:
            settings_row = (
                db.query(StaffSettings)
                .filter(StaffSettings.user_id == staff.user_id)
                .first()
            )
            if settings_row is None or settings_row.auto_assign_cases:
                enabled.append(staff)
        return enabled

    if originating_agent:
        specialty_matches = (
            db.query(StaffProfile)
            .filter(StaffProfile.specialty == originating_agent, StaffProfile.is_available == True)
            .all()
        )
        best = _pick_least_busy(_auto_assign_enabled(specialty_matches))
        if best:
            return best

    all_available = db.query(StaffProfile).filter(StaffProfile.is_available == True).all()
    return _pick_least_busy(_auto_assign_enabled(all_available))

def create_handoff_request(user_id: str, reason: str, originating_agent: str | None, db: Session, priority: str = "medium") -> Handoff:
    handoff = Handoff(
        user_id=user_id,
        reason=reason,
        originating_agent=originating_agent,
        status="waiting_confirmation",
        priority=priority,
    )
    db.add(handoff)
    db.commit()
    db.refresh(handoff)
    return handoff

def confirm_handoff(handoff: Handoff, history: list[Message], db: Session) -> str:
    staff = _assign_staff(handoff.originating_agent, db)

    if not staff:
        handoff.status = "waiting"
        db.commit()
        return "no_staff_available"

    handoff.assigned_staff_id = staff.user_id
    handoff.status = "assigned"
    handoff.assigned_at = datetime.now(timezone.utc)
    db.commit()

    user_contact = _get_user_contact(str(handoff.user_id), db)
    summary = _build_conversation_summary(history)
    send_handoff_email(staff.email, handoff.reason, user_contact, summary)

    return "assigned"


def cancel_handoff(handoff: Handoff, db: Session) -> None:
    handoff.status = "cancelled"
    db.commit()