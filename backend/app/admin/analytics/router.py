from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta, timezone
from sqlalchemy import cast, Date

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import User, Message, AuditLog, StaffProfile


from datetime import datetime, timedelta, timezone
from sqlalchemy import func, distinct
from app.models.db import Handoff, StaffProfile, AuditLog  

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/get-analytics")
def get_analytics(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    total_users = db.query(User).count()
    total_messages = db.query(Message).filter(Message.role == "user").count()

    agent_usage = (
        db.query(Message.agent_name, func.count(Message.id))
        .filter(Message.role == "assistant", Message.agent_name.isnot(None))
        .group_by(Message.agent_name)
        .order_by(func.count(Message.id).desc())
        .all()
    )

    tool_usage = (
        db.query(AuditLog.action, func.count(AuditLog.id))
        .group_by(AuditLog.action)
        .order_by(func.count(AuditLog.id).desc())
        .all()
    )

    avg_response_ms = (
        db.query(func.avg(Message.response_time_ms))
        .filter(Message.role == "assistant", Message.response_time_ms.isnot(None))
        .scalar()
    )

    return {
        "total_users": total_users,
        "total_messages": total_messages,
        "agent_usage": [{"agent": a, "count": c} for a, c in agent_usage],
        "tool_usage": [{"tool": t, "count": c} for t, c in tool_usage],
        "avg_response_time_ms": round(avg_response_ms) if avg_response_ms else None,
    }


@router.get("/get-timeseries")
def get_timeseries(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    today = datetime.now(timezone.utc).date()
    since_date = today - timedelta(days=29)
    since = datetime.combine(since_date, datetime.min.time(), tzinfo=timezone.utc)

    staff_user_ids = db.query(StaffProfile.user_id).subquery()

    daily_messages = (
        db.query(cast(Message.created_at, Date).label("day"), func.count(Message.id))
        .join(User, User.id == Message.user_id)
        .filter(
            Message.role == "user",
            Message.created_at >= since,
            User.is_admin == False,
            ~User.id.in_(staff_user_ids),
        )
        .group_by("day")
        .order_by("day")
        .all()
    )

    daily_new_users = (
        db.query(cast(User.created_at, Date).label("day"), func.count(User.id))
        .filter(
            User.created_at >= since,
            User.is_admin == False,
            ~User.id.in_(staff_user_ids),
        )
        .group_by("day")
        .order_by("day")
        .all()
    )

    message_map = {str(d): c for d, c in daily_messages}
    user_map = {str(d): c for d, c in daily_new_users}

    days = []
    for i in range(30):
        day = since_date + timedelta(days=i)
        day_str = str(day)
        days.append({
            "date": day_str,
            "messages": message_map.get(day_str, 0),
            "new_users": user_map.get(day_str, 0),
        })

    return days

def _conversation_outcome_for_users(user_ids: list, db: Session) -> dict:
    """Classify each given user_id into exactly one outcome bucket, based on
    their most recent Handoff (if any)."""
    counts = {"ai_resolved": 0, "human_handoff": 0, "pending": 0, "closed": 0}
    if not user_ids:
        return counts

    latest_handoffs = (
        db.query(Handoff)
        .filter(Handoff.user_id.in_(user_ids))
        .order_by(Handoff.user_id, Handoff.created_at.desc())
        .all()
    )
    latest_by_user = {}
    for h in latest_handoffs:
        if h.user_id not in latest_by_user:
            latest_by_user[h.user_id] = h

    for uid in user_ids:
        h = latest_by_user.get(uid)
        if not h:
            counts["ai_resolved"] += 1
        elif h.status in ("assigned", "resolved"):
            counts["human_handoff"] += 1
        elif h.status in ("waiting", "waiting_confirmation"):
            counts["pending"] += 1
        elif h.status == "cancelled":
            counts["closed"] += 1
        else:
            counts["ai_resolved"] += 1

    return counts


def _staff_user_ids(db: Session):
    return db.query(StaffProfile.user_id).subquery()


@router.get("/dashboard")
def get_admin_dashboard(
    date_from: str,
    date_to: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    try:
        start = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
        end = datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc) + timedelta(days=1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date_from/date_to")

    period_length = end - start
    prev_start = start - period_length
    prev_end = start

    staff_ids = _staff_user_ids(db)

    def real_customer_filter(q, col_user, col_created):
        return q.filter(
            col_created >= start, col_created < end,
            ~col_user.in_(staff_ids),
        )

    # --- Headline stats: current period ---
    total_users = (
        db.query(func.count(distinct(User.id)))
        .filter(User.created_at >= start, User.created_at < end, User.is_admin == False, ~User.id.in_(staff_ids))
        .scalar()
    ) or 0

    total_messages = (
        db.query(func.count(Message.id))
        .filter(Message.role == "user", Message.created_at >= start, Message.created_at < end, ~Message.user_id.in_(staff_ids))
        .scalar()
    ) or 0

    active_user_ids = [
        row[0] for row in
        db.query(distinct(Message.user_id))
        .filter(Message.created_at >= start, Message.created_at < end, ~Message.user_id.in_(staff_ids))
        .all()
    ]
    total_conversations = len(active_user_ids)

    outcome_counts = _conversation_outcome_for_users(active_user_ids, db)
    ai_resolved_rate = round((outcome_counts["ai_resolved"] / total_conversations) * 100, 1) if total_conversations else 0.0
    human_handoff_rate = round((outcome_counts["human_handoff"] / total_conversations) * 100, 1) if total_conversations else 0.0

    avg_response_ms = (
        db.query(func.avg(Message.response_time_ms))
        .filter(Message.role == "assistant", Message.response_time_ms.isnot(None), Message.created_at >= start, Message.created_at < end)
        .scalar()
    )
    avg_response_seconds = round(avg_response_ms / 1000, 1) if avg_response_ms else 0.0

    # --- Same stats for the preceding period, for % deltas ---
    prev_total_users = (
        db.query(func.count(distinct(User.id)))
        .filter(User.created_at >= prev_start, User.created_at < prev_end, User.is_admin == False, ~User.id.in_(staff_ids))
        .scalar()
    ) or 0

    prev_total_messages = (
        db.query(func.count(Message.id))
        .filter(Message.role == "user", Message.created_at >= prev_start, Message.created_at < prev_end, ~Message.user_id.in_(staff_ids))
        .scalar()
    ) or 0

    prev_active_user_ids = [
        row[0] for row in
        db.query(distinct(Message.user_id))
        .filter(Message.created_at >= prev_start, Message.created_at < prev_end, ~Message.user_id.in_(staff_ids))
        .all()
    ]
    prev_total_conversations = len(prev_active_user_ids)

    prev_outcome_counts = _conversation_outcome_for_users(prev_active_user_ids, db)
    prev_ai_rate = round((prev_outcome_counts["ai_resolved"] / prev_total_conversations) * 100, 1) if prev_total_conversations else 0.0
    prev_handoff_rate = round((prev_outcome_counts["human_handoff"] / prev_total_conversations) * 100, 1) if prev_total_conversations else 0.0

    prev_avg_response_ms = (
        db.query(func.avg(Message.response_time_ms))
        .filter(Message.role == "assistant", Message.response_time_ms.isnot(None), Message.created_at >= prev_start, Message.created_at < prev_end)
        .scalar()
    )
    prev_avg_response_seconds = round(prev_avg_response_ms / 1000, 1) if prev_avg_response_ms else 0.0

    def pct_delta(current, previous):
        if previous == 0:
            return 0.0
        return round(((current - previous) / previous) * 100, 1)

    # --- Daily trend, within the selected range ---
    daily_rows = (
        db.query(cast(Message.created_at, Date).label("day"), func.count(Message.id))
        .filter(Message.created_at >= start, Message.created_at < end, ~Message.user_id.in_(staff_ids))
        .group_by("day")
        .order_by("day")
        .all()
    )
    daily_messages = {str(d): c for d, c in daily_rows}

    daily_user_rows = (
        db.query(cast(Message.created_at, Date).label("day"), Message.user_id)
        .filter(Message.created_at >= start, Message.created_at < end, ~Message.user_id.in_(staff_ids))
        .distinct()
        .all()
    )
    daily_conversations: dict = {}
    for day, uid in daily_user_rows:
        daily_conversations.setdefault(str(day), set()).add(uid)

    daily_handoff_rows = (
        db.query(cast(Handoff.created_at, Date).label("day"), Handoff.status)
        .filter(Handoff.created_at >= start, Handoff.created_at < end)
        .all()
    )
    daily_resolved: dict = {}
    daily_handoff: dict = {}
    for day, status in daily_handoff_rows:
        key = str(day)
        if status in ("assigned", "resolved"):
            daily_handoff[key] = daily_handoff.get(key, 0) + 1
        elif status == "resolved":
            daily_resolved[key] = daily_resolved.get(key, 0) + 1

    trend = []
    num_days = (end.date() - start.date()).days
    for i in range(num_days):
        day = (start + timedelta(days=i)).date()
        key = str(day)
        trend.append({
            "date": key,
            "messages": daily_messages.get(key, 0),
            "conversations": len(daily_conversations.get(key, set())),
            "human_handoff": daily_handoff.get(key, 0),
        })

    # --- Top agents (reuses same aggregation pattern as get-analytics) ---
    agent_usage = (
        db.query(Message.agent_name, func.count(Message.id))
        .filter(Message.role == "assistant", Message.agent_name.isnot(None), Message.created_at >= start, Message.created_at < end)
        .group_by(Message.agent_name)
        .order_by(func.count(Message.id).desc())
        .limit(6)
        .all()
    )
    total_agent_messages = sum(c for _, c in agent_usage) or 1
    top_agents = [
        {"agent": a, "count": c, "pct": round((c / total_agent_messages) * 100, 1)}
        for a, c in agent_usage
    ]

    # --- Top tools ---
    tool_usage = (
        db.query(AuditLog.action, func.count(AuditLog.id))
        .filter(AuditLog.created_at >= start, AuditLog.created_at < end)
        .group_by(AuditLog.action)
        .order_by(func.count(AuditLog.id).desc())
        .limit(6)
        .all()
    )
    total_tool_uses = sum(c for _, c in tool_usage) or 1
    top_tools = [
        {"tool": t, "count": c, "pct": round((c / total_tool_uses) * 100, 1)}
        for t, c in tool_usage
    ]

    # --- Recent activity, latest 10, across a few real sources ---
    activity = []
    recent_users = db.query(Message).filter(Message.role == "user", Message.created_at >= start, Message.created_at < end).order_by(Message.created_at.desc()).limit(5).all()
    for m in recent_users:
        activity.append({"type": "message", "detail": f'New message: "{m.content[:60]}"', "created_at": m.created_at})

    recent_assignments = db.query(Handoff).filter(Handoff.assigned_at.isnot(None), Handoff.assigned_at >= start, Handoff.assigned_at < end).order_by(Handoff.assigned_at.desc()).limit(5).all()
    for h in recent_assignments:
        activity.append({"type": "assignment", "detail": f"Case assigned to staff", "created_at": h.assigned_at})

    recent_handoffs = (
    db.query(Handoff)
    .order_by(Handoff.created_at.desc())
    .limit(5)
    .all()
)
    recent_cases = []
    for h in recent_handoffs:
        assigned_staff = (
        db.query(StaffProfile).filter(StaffProfile.user_id == h.assigned_staff_id).first()
        if h.assigned_staff_id else None
    )
        recent_cases.append({
        "id": str(h.id),
        "reason": h.reason,
        "status": h.status,
        "assigned_to": assigned_staff.name if assigned_staff else "Unassigned",
        "created_at": h.created_at,
    })

    return {
    "total_users": {"value": total_users, "delta_pct": pct_delta(total_users, prev_total_users)},
    "total_conversations": {"value": total_conversations, "delta_pct": pct_delta(total_conversations, prev_total_conversations)},
    "total_messages": {"value": total_messages, "delta_pct": pct_delta(total_messages, prev_total_messages)},
    "ai_resolution_rate": {"value": ai_resolved_rate, "delta_pct": pct_delta(ai_resolved_rate, prev_ai_rate)},
    "human_handoff_rate": {"value": human_handoff_rate, "delta_pct": pct_delta(human_handoff_rate, prev_handoff_rate)},
    "avg_response_seconds": {"value": avg_response_seconds, "delta_pct": pct_delta(avg_response_seconds, prev_avg_response_seconds)},
    "trend": trend,
    "outcome": {
        "total": total_conversations,
        "ai_resolved": outcome_counts["ai_resolved"],
        "human_handoff": outcome_counts["human_handoff"],
        "pending": outcome_counts["pending"],
        "closed": outcome_counts["closed"],
    },
    "top_agents": top_agents,
    "top_tools": top_tools,
    "recent_activity": activity,
    "recent_cases": recent_cases,
}