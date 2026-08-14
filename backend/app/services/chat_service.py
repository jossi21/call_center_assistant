import time
from sqlalchemy.orm import Session

from app.models.chat import ChatRequest, ChatResponse
from app.models.db import Message, User
from app.admin.agents.agent_dispatch import handle_message


MAX_HISTORY_MESSAGES = 10


def process_channel_message(message: str, db: Session, user_id: str, channel_type: str) -> ChatResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if user and not user.is_active:
        return ChatResponse(answer="This account has been suspended. Please contact support.", agent="System")

    user_message = Message(
        user_id=user_id,
        channel_type=channel_type,
        role="user",
        content=message,
    )
    db.add(user_message)
    db.commit()

    history = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    history.reverse()

    start = time.perf_counter()
    answer, agent_used = handle_message(message, history, db, user_id)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    assistant_message = Message(
        user_id=user_id,
        channel_type=channel_type,
        role="assistant",
        content=answer,
        agent_name=agent_used,
        response_time_ms=elapsed_ms,
    )
    db.add(assistant_message)
    db.commit()

    return ChatResponse(answer=answer, agent=agent_used)


def process_chat(request: ChatRequest, db: Session, user_id: str) -> ChatResponse:
    return process_channel_message(request.message, db, user_id, channel_type="web")