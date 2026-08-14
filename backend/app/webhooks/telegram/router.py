# app/webhooks/telegram/router.py — new file
import requests
from fastapi import APIRouter, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.models.db import Channel, User, UserChannelIdentity, Message
from app.agents.dispatch import handle_message

router = APIRouter(prefix="/webhooks/telegram", tags=["Telegram Webhook"])


def _get_telegram_config(db: Session) -> dict | None:
    channel = db.query(Channel).filter(Channel.name == "telegram", Channel.is_active == True).first()
    return channel.config if channel else None


def _resolve_or_create_user(chat_id: str, db: Session) -> str:
    identity = (
        db.query(UserChannelIdentity)
        .filter(UserChannelIdentity.channel_type == "telegram", UserChannelIdentity.channel_specific_id == chat_id)
        .first()
    )
    if identity:
        return str(identity.user_id)

    user = User(preferred_language="en")
    db.add(user)
    db.flush()
    db.add(UserChannelIdentity(
        user_id=user.id,
        channel_type="telegram",
        channel_specific_id=chat_id,
        verified_at=datetime.now(timezone.utc),
    ))
    db.commit()
    return str(user.id)


def _send_telegram_message(bot_token: str, chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": text}, timeout=10)


@router.post("")
async def telegram_webhook(request: Request):
    db = SessionLocal()
    try:
        config = _get_telegram_config(db)
        if not config or not config.get("bot_token"):
            return {"ok": False}

        update = await request.json()
        message = update.get("message")
        if not message or "text" not in message:
            return {"ok": True}  # ignore non-text updates (stickers, etc.)

        chat_id = str(message["chat"]["id"])
        text = message["text"]

        user_id = _resolve_or_create_user(chat_id, db)

        user_message = Message(user_id=user_id, channel_type="telegram", role="user", content=text)
        db.add(user_message)
        db.commit()

        history = (
            db.query(Message)
            .filter(Message.user_id == user_id)
            .order_by(Message.created_at.desc())
            .limit(10)
            .all()
        )
        history.reverse()

        answer, agent_used = handle_message(text, history, db, user_id)

        assistant_message = Message(
            user_id=user_id, channel_type="telegram", role="assistant", content=answer, agent_name=agent_used
        )
        db.add(assistant_message)
        db.commit()

        _send_telegram_message(config["bot_token"], chat_id, answer)

        return {"ok": True}
    finally:
        db.close()