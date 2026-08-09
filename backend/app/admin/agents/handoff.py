from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.db import Handoff, StaffProfile, Message, UserChannelIdentity
from app.services.email_service import send_handoff_email
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage

from app.core.config import settings

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=settings.groq_api_key)


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
        # For each candidate, count their currently active (unresolved) handoffs
        scored = []
        for staff in candidates:
            active_count = (
                db.query(Handoff)
                .filter(Handoff.assigned_staff_id == staff.user_id, Handoff.status == "assigned")
                .count()
            )
            scored.append((active_count, staff))
        scored.sort(key=lambda x: x[0])  # fewest active cases first
        return scored[0][1]

    # First, try staff matching the specific specialty
    if originating_agent:
        specialty_matches = (
            db.query(StaffProfile)
            .filter(StaffProfile.specialty == originating_agent, StaffProfile.is_available == True)
            .all()
        )
        best = _pick_least_busy(specialty_matches)
        if best:
            return best

    # Fall back to any available staff, still picking the least busy
    all_available = db.query(StaffProfile).filter(StaffProfile.is_available == True).all()
    return _pick_least_busy(all_available)

def create_handoff_request(user_id: str, reason: str, originating_agent: str | None, db: Session) -> Handoff:
    handoff = Handoff(
        user_id=user_id,
        reason=reason,
        originating_agent=originating_agent,
        status="waiting_confirmation",
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