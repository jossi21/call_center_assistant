from sqlalchemy.orm import Session

from app.models.chat import ChatRequest, ChatResponse
from app.models.db import Message
from app.agents.agent_dispatch import handle_message


MAX_HISTORY_MESSAGES = 10


def process_chat(request: ChatRequest, db: Session, user_id: str) -> ChatResponse:
    user_message = Message(
        user_id=user_id,
        channel_type="web",
        role="user",
        content=request.message,
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

    answer, agent_used = handle_message(request.message, history, db)  # <- add db here

    assistant_message = Message(
        user_id=user_id,
        channel_type="web",
        role="assistant",
        content=answer,
    )
    db.add(assistant_message)
    db.commit()

    return ChatResponse(answer=answer, agent=agent_used)