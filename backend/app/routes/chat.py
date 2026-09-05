import json
import time
import uuid
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from fastapi import Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.chat import ChatRequest, ChatResponse
from app.models.db import Message
from app.services.chat_service import process_chat, process_chat_stream, process_chat_continue_stream
from app.services import stream_registry
from app.core.database import get_db
from app.core.current_user import get_current_user_id

router = APIRouter()


def _json_default(obj):
    if isinstance(obj, uuid.UUID):
        return str(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


@router.post('/chat', response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return process_chat(request, db, user_id)


@router.post("/chat/stream")
def chat_stream(request: ChatRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    def event_generator():
        for event_type, payload in process_chat_stream(request, db, user_id):
            if event_type == "chunk":
                time.sleep(0.02)
            yield f"event: {event_type}\ndata: {json.dumps(payload, default=_json_default)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


class StopStreamRequest(BaseModel):
    stream_id: str


@router.post("/chat/stream/stop")
def chat_stream_stop(request: StopStreamRequest, user_id: str = Depends(get_current_user_id)):
    found = stream_registry.request_stop(request.stream_id)
    if not found:
        return {"stopped": False}
    return {"stopped": True}


class ContinueRequest(BaseModel):
    message_id: str


@router.post("/chat/continue/stream")
def chat_continue_stream(request: ContinueRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    def event_generator():
        for event_type, payload in process_chat_continue_stream(request.message_id, db, user_id):
            if event_type == "chunk":
                time.sleep(0.02)
            yield f"event: {event_type}\ndata: {json.dumps(payload, default=_json_default)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


class RegenerateRequest(BaseModel):
    message_id: str


@router.post("/chat/regenerate/stream")
def chat_regenerate_stream(request: RegenerateRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    target = (
        db.query(Message)
        .filter(Message.id == request.message_id, Message.user_id == user_id, Message.role == "assistant")
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Message not found")

    preceding_user = (
        db.query(Message)
        .filter(Message.user_id == user_id, Message.role == "user", Message.created_at <= target.created_at)
        .order_by(Message.created_at.desc())
        .first()
    )
    if not preceding_user:
        raise HTTPException(status_code=400, detail="No preceding user message to regenerate from")

    original_text = preceding_user.content
    db.delete(target)
    db.commit()

    fake_request = ChatRequest(message=original_text)

    def event_generator():
        for event_type, payload in process_chat_stream(fake_request, db, user_id, save_user_message=False):
            if event_type == "chunk":
                time.sleep(0.02)
            yield f"event: {event_type}\ndata: {json.dumps(payload, default=_json_default)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


class EditMessageRequest(BaseModel):
    message_id: str
    new_content: str


@router.post("/chat/edit")
def chat_edit(request: EditMessageRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    target = (
        db.query(Message)
        .filter(Message.id == request.message_id, Message.user_id == user_id, Message.role == "user")
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Message not found")

    db.query(Message).filter(
        Message.user_id == user_id,
        Message.created_at >= target.created_at,
    ).delete()
    db.commit()

    return {"ok": True}


@router.get("/chat/messages")
def get_new_messages(
    after: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = db.query(Message).filter(
        Message.user_id == user_id,
        Message.role == "assistant",
    )

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