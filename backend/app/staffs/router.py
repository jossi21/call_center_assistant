from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from langchain_core.messages import SystemMessage
from app.core.llm import llm
from app.core.database import get_db
from app.core.current_user import get_current_user_id

from app.models.db import StaffProfile, Handoff, Message, UserChannelIdentity, Channel, ReplyTemplate, User
from app.channels.registry import CHANNEL_TYPES
from app.channels.dispatch import send_via_channel

router = APIRouter(prefix="/staff", tags=["Staff Profile"])

STATUS_VALUES = {"available", "away", "busy", "offline"}
PRIORITY_VALUES = {"low", "medium", "high"}

class ReplyBody(BaseModel):
    message: str

class PriorityUpdate(BaseModel):
    priority: str

class AvailabilityUpdate(BaseModel):
    is_available: bool

def _require_staff(user_id: str, db: Session) -> StaffProfile:
    profile = db.query(StaffProfile).filter(StaffProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=403, detail="Not a staff member")
    return profile


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _profile_out(profile: StaffProfile) -> dict:
    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "name": profile.name,
        "specialty": profile.specialty,
        "is_available": profile.is_available,
        "status": profile.status,
    }


@router.get("/my-profile")
def get_my_profile(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return _profile_out(_require_staff(user_id, db))


@router.patch("/update-my-availability")
def update_my_availability(body: AvailabilityUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    profile = _require_staff(user_id, db)
    profile.is_available = body.is_available
    profile.status = "available" if body.is_available else "offline"
    db.commit()
    db.refresh(profile)
    return _profile_out(profile)


class StatusUpdate(BaseModel):
    status: str


@router.patch("/update-my-status")
def update_my_status(body: StatusUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if body.status not in STATUS_VALUES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(STATUS_VALUES)}")
    profile = _require_staff(user_id, db)
    profile.status = body.status
    profile.is_available = (body.status == "available")
    db.commit()
    db.refresh(profile)
    return _profile_out(profile)


@router.get("/get-my-cases")
def list_my_cases(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_staff(user_id, db)
    cases = (
        db.query(Handoff)
        .filter(Handoff.assigned_staff_id == user_id)
        .order_by(Handoff.created_at.desc())
        .all()
    )
    result = []
    for c in cases:
        identity = db.query(UserChannelIdentity).filter(UserChannelIdentity.user_id == c.user_id).first()
        last_msg = (
            db.query(Message)
            .filter(Message.user_id == c.user_id)
            .order_by(Message.created_at.desc())
            .first()
        )
        history = (
            db.query(Message)
            .filter(Message.user_id == c.user_id)
            .order_by(Message.created_at.desc())
            .limit(20)
            .all()
        )
        history.reverse()
        result.append({
            "id": str(c.id),
            "reason": c.reason,
            "status": c.status,
            "channel_type": last_msg.channel_type if last_msg else "web",
            "user_contact": identity.channel_specific_id if identity else "unknown",
            "created_at": c.created_at,
            "assigned_at": c.assigned_at,
            "resolved_at": c.resolved_at,
            "history": [{"role": m.role, "content": m.content} for m in history],
            "priority": c.priority,
        })
    return result


@router.post("/my-cases/{handoff_id}/resolve")
def resolve_case(handoff_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_staff(user_id, db)
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id, Handoff.assigned_staff_id == user_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Case not found or not assigned to you")
    handoff.status = "resolved"
    handoff.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Case resolved"}


@router.patch("/my-cases/{handoff_id}/priority")
def update_case_priority(handoff_id: str, body: PriorityUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if body.priority not in PRIORITY_VALUES:
        raise HTTPException(status_code=400, detail=f"priority must be one of {sorted(PRIORITY_VALUES)}")
    _require_staff(user_id, db)
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id, Handoff.assigned_staff_id == user_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Case not found or not assigned to you")
    handoff.priority = body.priority
    db.commit()
    return {"message": "Priority updated"}

@router.post("/my-cases/{handoff_id}/reply")
def reply_to_case(handoff_id: str, body: ReplyBody, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    profile = _require_staff(user_id, db)
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id, Handoff.assigned_staff_id == user_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Case not found or not assigned to you")

    last_msg = (
        db.query(Message)
        .filter(Message.user_id == handoff.user_id)
        .order_by(Message.created_at.desc())
        .first()
    )
    channel_type = last_msg.channel_type if last_msg else "web"

    # Response time: elapsed since the customer's last message. Only meaningful
    # if that last message was from the customer, not a previous staff reply.
    response_time_ms = None
    if last_msg and last_msg.role == "user":
        elapsed = datetime.now(timezone.utc) - _ensure_utc(last_msg.created_at)
        response_time_ms = max(int(elapsed.total_seconds() * 1000), 0)

    reply = Message(
        user_id=handoff.user_id,
        channel_type=channel_type,
        role="assistant",
        content=body.message,
        agent_name=profile.name,
        response_time_ms=response_time_ms,
    )
    db.add(reply)
    db.commit()

    if channel_type != "web":
        identity = (
            db.query(UserChannelIdentity)
            .filter(UserChannelIdentity.user_id == handoff.user_id, UserChannelIdentity.channel_type == channel_type)
            .first()
        )
        channel = db.query(Channel).filter(Channel.name == channel_type, Channel.is_active == True).first()
        type_def = CHANNEL_TYPES.get(channel_type)
        if identity and channel and type_def:
            send_via_channel(type_def["outbound"], channel.config, identity.channel_specific_id, body.message)

    return {"message": "Reply sent"}


@router.get("/dashboard-stats")
def get_dashboard_stats(
    chart_range: str = "week",   # "week" | "month" — controls Cases Over Time
    perf_period: str = "today",  # "today" | "week" | "month" | "all" — controls Your Performance
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = _require_staff(user_id, db)
    my_handoffs = db.query(Handoff).filter(Handoff.assigned_staff_id == user_id)

    pending = my_handoffs.filter(Handoff.status.in_(["waiting", "waiting_confirmation"])).count()
    in_progress = my_handoffs.filter(Handoff.status == "assigned").count()

    now = datetime.now(timezone.utc)
    today = now.date()
    resolved_today = my_handoffs.filter(
        Handoff.status == "resolved",
        func.date(Handoff.resolved_at) == today,
    ).count()

    # --- Cases Over Time ---
    days = 7 if chart_range == "week" else 30
    since_date = today - timedelta(days=days - 1)
    cases_over_time = []
    for i in range(days):
        day = since_date + timedelta(days=i)
        created = my_handoffs.filter(func.date(Handoff.created_at) == day).count()
        resolved = my_handoffs.filter(Handoff.status == "resolved", func.date(Handoff.resolved_at) == day).count()
        cases_over_time.append({"date": str(day), "created": created, "resolved": resolved})

    # --- Your Performance (period-scoped) ---
    if perf_period == "today":
        period_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    elif perf_period == "week":
        period_start = now - timedelta(days=7)
    elif perf_period == "month":
        period_start = now - timedelta(days=30)
    else:
        period_start = None  # all-time

    perf_resolved_q = my_handoffs.filter(Handoff.status == "resolved")
    perf_total_q = my_handoffs
    if period_start:
        perf_resolved_q = perf_resolved_q.filter(Handoff.resolved_at >= period_start)
        perf_total_q = perf_total_q.filter(Handoff.created_at >= period_start)
    perf_resolved = perf_resolved_q.count()
    perf_total = perf_total_q.count()
    resolution_rate = round((perf_resolved / perf_total) * 100) if perf_total else 0

    messages_q = db.query(Message).filter(Message.agent_name == profile.name)
    if period_start:
        messages_q = messages_q.filter(Message.created_at >= period_start)
    messages_sent = messages_q.count()

    avg_ms_q = db.query(func.avg(Message.response_time_ms)).filter(
        Message.agent_name == profile.name, Message.response_time_ms.isnot(None)
    )
    period_avg_ms_q = avg_ms_q.filter(Message.created_at >= period_start) if period_start else avg_ms_q
    avg_ms_all_time = avg_ms_q.scalar()
    avg_ms_period = period_avg_ms_q.scalar()

    return {
        "active_cases": in_progress,
        "pending": pending,
        "in_progress": in_progress,
        "resolved_today": resolved_today,
        "avg_response_seconds": round(avg_ms_all_time / 1000) if avg_ms_all_time else 0,
        "cases_over_time": cases_over_time,
        "status_distribution": {
            "pending": pending,
            "in_progress": in_progress,
            "resolved": my_handoffs.filter(Handoff.status == "resolved").count(),
            "waiting_confirmation": my_handoffs.filter(Handoff.status == "waiting_confirmation").count(),
        },
        "total_cases": my_handoffs.count(),
        "performance": {
            "resolved": perf_resolved,
            "total_cases": perf_total,
            "messages_sent": messages_sent,
            "resolution_rate": resolution_rate,
            "avg_response_seconds": round(avg_ms_period / 1000) if avg_ms_period else 0,
        },
    }


@router.get("/templates")
def get_reply_templates(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_staff(user_id, db)
    return (
        db.query(ReplyTemplate)
        .filter(ReplyTemplate.is_active == True)
        .order_by(ReplyTemplate.title)
        .all()
    )


@router.post("/my-cases/{handoff_id}/suggest-reply")
def suggest_reply(handoff_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_staff(user_id, db)
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id, Handoff.assigned_staff_id == user_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Case not found or not assigned to you")

    history = (
        db.query(Message)
        .filter(Message.user_id == handoff.user_id)
        .order_by(Message.created_at.desc())
        .limit(10)
        .all()
    )
    history.reverse()
    transcript = "\n".join(f"{m.role}: {m.content}" for m in history) or "No prior messages."

    prompt = f"""You are helping a human support agent draft a reply to a customer.
Case reason: {handoff.reason}

Conversation so far:
{transcript}

Draft a short, professional, empathetic reply the agent could send next. Reply with only the message text, no preamble, no quotes."""

    result = llm.invoke([SystemMessage(content=prompt)])
    return {"suggested_reply": result.content.strip()}


class CustomerUpdate(BaseModel):
    name: str | None = None
    location: str | None = None


def _get_customer_for_staff(handoff_id: str, user_id: str, db: Session):
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id, Handoff.assigned_staff_id == user_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Case not found or not assigned to you")
    customer = db.query(User).filter(User.id == handoff.user_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return handoff, customer


@router.get("/my-cases/{handoff_id}/customer")
def get_case_customer(handoff_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_staff(user_id, db)
    handoff, customer = _get_customer_for_staff(handoff_id, user_id, db)

    identity = (
        db.query(UserChannelIdentity)
        .filter(UserChannelIdentity.user_id == customer.id)
        .order_by(UserChannelIdentity.verified_at.desc().nullslast())
        .first()
    )
    total_conversations = db.query(Message).filter(Message.user_id == customer.id).count()

    return {
        "id": str(customer.id),
        "name": customer.name,
        "location": customer.location,
        "phone": identity.channel_specific_id if identity else None,
        "channel_type": identity.channel_type if identity else None,
        "verified": bool(identity and identity.verified_at),
        "member_since": customer.created_at,
        "total_conversations": total_conversations,
    }


@router.patch("/my-cases/{handoff_id}/customer")
def update_case_customer(handoff_id: str, body: CustomerUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_staff(user_id, db)
    _, customer = _get_customer_for_staff(handoff_id, user_id, db)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return {"message": "Customer updated"}

@router.get("/my-cases/{handoff_id}/messages")
def get_case_messages(
    handoff_id: str,
    after: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    _require_staff(user_id, db)
    handoff = db.query(Handoff).filter(Handoff.id == handoff_id, Handoff.assigned_staff_id == user_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Case not found or not assigned to you")

    query = db.query(Message).filter(Message.user_id == handoff.user_id)
    if after:
        try:
            after_dt = datetime.fromisoformat(after.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid 'after' timestamp")
        query = query.filter(Message.created_at > after_dt)

    messages = query.order_by(Message.created_at.asc()).all()
    return {
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }


@router.get("/all-cases")
def list_all_cases(
    customer: str | None = None,
    channel: str | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    page: int = 1,
    page_size: int = 10,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    _require_staff(user_id, db)

    query = db.query(Handoff)

    if status and status != "all":
        query = query.filter(Handoff.status == status)

    if date_from:
        query = query.filter(Handoff.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Handoff.created_at <= datetime.fromisoformat(date_to))

    all_matching = query.order_by(Handoff.created_at.desc()).all()

    # Customer name / channel filters need the joined data, so filter after enrichment
    rows = []
    for h in all_matching:
        customer_user = db.query(User).filter(User.id == h.user_id).first()
        identity = (
            db.query(UserChannelIdentity)
            .filter(UserChannelIdentity.user_id == h.user_id)
            .order_by(UserChannelIdentity.verified_at.desc().nullslast())
            .first()
        )
        last_msg = (
            db.query(Message)
            .filter(Message.user_id == h.user_id)
            .order_by(Message.created_at.desc())
            .first()
        )
        assigned_staff = (
            db.query(StaffProfile).filter(StaffProfile.user_id == h.assigned_staff_id).first()
            if h.assigned_staff_id else None
        )

        customer_name = (customer_user.name if customer_user and customer_user.name else None) or (
            identity.channel_specific_id if identity else "Unknown"
        )
        channel_type = last_msg.channel_type if last_msg else (identity.channel_type if identity else "web")

        if customer and customer.lower() not in customer_name.lower():
            continue
        if channel and channel != "all" and channel_type != channel:
            continue

        rows.append({
            "id": str(h.id),
            "customer": customer_name,
            "channel_type": channel_type,
            "status": h.status,
            "priority": h.priority,
            "assigned_to": "You" if str(h.assigned_staff_id) == str(user_id) else (assigned_staff.name if assigned_staff else "Unassigned"),
            "updated_at": h.resolved_at or h.assigned_at or h.created_at,
        })

    total = len(rows)
    start = (page - 1) * page_size
    paginated = rows[start : start + page_size]

    return {"cases": paginated, "total": total, "page": page, "page_size": page_size}