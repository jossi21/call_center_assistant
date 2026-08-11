from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from sqlalchemy import cast, Date

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import User, Message, AuditLog, StaffProfile


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