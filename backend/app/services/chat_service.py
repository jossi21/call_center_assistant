from sqlalchemy.orm import Session

from app.models.chat import ChatRequest, ChatResponse
from app.models.db import Message
from app.services.agent_dispatch import handel_message


MAX_HISTORY_MESSAGES = 10


def process_chat(request: ChatRequest, db: Session, user_id: str) -> ChatResponse:
    # Save the incoming user message
    user_message = Message(
        user_id=user_id,
        channel_type="web",
        role="user",
        content=request.message,
    )
    db.add(user_message)
    db.commit()

    # Pull recent history (including the message just saved) for context
    history = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    history.reverse()  # chronological order for the LLM

    # Generate the reply, grounded in real conversation history
    answer, agent_used = handel_message(request.message, history)

    # Save the assistant's reply
    assistant_message = Message(
        user_id=user_id,
        channel_type="web",
        role="assistant",
        content=answer,
    )
    db.add(assistant_message)
    db.commit()

    return ChatResponse(answer=answer, agent=agent_used)