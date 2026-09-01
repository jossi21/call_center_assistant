import time
import json
import queue
import threading
import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.models.chat import ChatRequest, ChatResponse
from app.models.db import Message, User
from app.admin.agents.agent_dispatch import handle_message, handle_message_stream, continue_message_stream
from app.services import stream_registry


MAX_HISTORY_MESSAGES = 10


def process_channel_message(message: str, db: Session, user_id: str, channel_type: str) -> ChatResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if user and not user.is_active:
        return ChatResponse(answer="This account has been suspended. Please contact support.", agent="System")

    user_message = Message(user_id=user_id, channel_type=channel_type, role="user", content=message)
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
        user_id=user_id, channel_type=channel_type, role="assistant",
        content=answer, agent_name=agent_used, response_time_ms=elapsed_ms,
    )
    db.add(assistant_message)
    db.commit()

    return ChatResponse(answer=answer, agent=agent_used)


def process_chat(request: ChatRequest, db: Session, user_id: str) -> ChatResponse:
    return process_channel_message(request.message, db, user_id, channel_type="web")


def process_chat_stream(
    request: ChatRequest,
    db: Session,
    user_id: str,
    save_user_message: bool = True,
):
    """Yields (event_type, payload) tuples: 'start', 'stage', 'chunk', 'final'.

    save_user_message=False is used by the regenerate flow: the user message
    already exists in the DB (we're just re-answering it), so we skip inserting
    a duplicate and rely on `history` already ending with that turn."""
    user = db.query(User).filter(User.id == user_id).first()
    if user and not user.is_active:
        yield "final", {"answer": "This account has been suspended. Please contact support.", "agent": "System"}
        return

    user_message_id: Optional[int] = None
    if save_user_message:
        user_message = Message(user_id=user_id, channel_type="web", role="user", content=request.message)
        db.add(user_message)
        db.commit()
        user_message_id = user_message.id

    history = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    history.reverse()

    # Register a stop-event for this stream so the client can interrupt generation
    # mid-flight via POST /chat/stream/stop. Emitted to the client immediately so
    # it has the id before any tokens arrive. user_message_id lets the frontend
    # attach a DB id to the user bubble it already optimistically rendered
    # (needed so Edit has something to reference).
    stream_id = str(uuid.uuid4())
    stop_event = stream_registry.register(stream_id)
    yield "start", {"stream_id": stream_id, "user_message_id": user_message_id}

    event_queue: "queue.Queue" = queue.Queue()
    result: dict = {}

    def on_stage(name: str):
        event_queue.put(("stage", {"stage": name}))

    def on_token(text: str):
        event_queue.put(("chunk", {"text": text}))

    def worker():
        start = time.perf_counter()
        answer, agent_used = handle_message_stream(
            request.message, history, db, user_id,
            on_stage=on_stage, on_token=on_token, stop_event=stop_event,
        )
        result["answer"] = answer
        result["agent"] = agent_used
        result["elapsed_ms"] = int((time.perf_counter() - start) * 1000)
        event_queue.put(("done", None))

    thread = threading.Thread(target=worker)
    thread.start()

    delivered_text_parts: list[str] = []

    try:
        while True:
            event_type, payload = event_queue.get()
            if event_type == "done":
                break

            if event_type == "chunk" and stop_event.is_set():
                # Stop was requested: the LLM call itself may have already
                # finished server-side (Groq is fast enough that this is common
                # even for a near-instant click), so there's nothing left to
                # cancel upstream. What we CAN still control is delivery — drop
                # the rest of the queued backlog instead of continuing to trickle
                # out text the user already asked to stop seeing.
                continue

            if event_type == "chunk":
                delivered_text_parts.append(payload.get("text", ""))

            yield event_type, payload

        thread.join()

        agent_used = result["agent"]
        interrupted = stop_event.is_set()

        # If interrupted, persist/display exactly what the user actually saw —
        # not the full completion, which may differ if generation had already
        # finished before the stop request arrived.
        answer = "".join(delivered_text_parts) if interrupted else result["answer"]

        assistant_message = Message(
            user_id=user_id, channel_type="web", role="assistant",
            content=answer, agent_name=agent_used, response_time_ms=result["elapsed_ms"],
        )
        db.add(assistant_message)
        db.commit()

        yield "final", {
            "answer": answer,
            "agent": agent_used,
            "interrupted": interrupted,
            "message_id": assistant_message.id,
        }
    finally:
        stream_registry.unregister(stream_id)


def process_chat_continue_stream(message_id: int, db: Session, user_id: str):
    """Resume an interrupted assistant message exactly where it left off,
    appending into the SAME message row rather than creating a new one."""
    message = (
        db.query(Message)
        .filter(Message.id == message_id, Message.user_id == user_id, Message.role == "assistant")
        .first()
    )
    if not message:
        yield "final", {"answer": "", "agent": "System", "interrupted": False, "message_id": message_id}
        return

    stream_id = str(uuid.uuid4())
    stop_event = stream_registry.register(stream_id)
    yield "start", {"stream_id": stream_id, "user_message_id": None}

    event_queue: "queue.Queue" = queue.Queue()
    result: dict = {}

    def on_stage(name: str):
        event_queue.put(("stage", {"stage": name}))

    def on_token(text: str):
        event_queue.put(("chunk", {"text": text}))

    def worker():
        continuation, agent_used = continue_message_stream(
            message.content, message.agent_name, user_id, db,
            on_stage=on_stage, on_token=on_token, stop_event=stop_event,
        )
        result["continuation"] = continuation
        result["agent"] = agent_used
        event_queue.put(("done", None))

    thread = threading.Thread(target=worker)
    thread.start()

    delivered_text_parts: list[str] = []

    try:
        while True:
            event_type, payload = event_queue.get()
            if event_type == "done":
                break

            if event_type == "chunk" and stop_event.is_set():
                continue

            if event_type == "chunk":
                delivered_text_parts.append(payload.get("text", ""))

            yield event_type, payload

        thread.join()

        interrupted = stop_event.is_set()
        continuation = "".join(delivered_text_parts) if interrupted else result["continuation"]

        message.content = message.content + continuation
        db.commit()

        yield "final", {
            "answer": message.content,
            "agent": result["agent"],
            "interrupted": interrupted,
            "message_id": message.id,
        }
    finally:
        stream_registry.unregister(stream_id)