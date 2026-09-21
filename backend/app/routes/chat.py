import json
import time
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from datetime import datetime, timezone
from fastapi import Query
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.chat import ChatRequest, ChatResponse
from app.models.db import Message, Language
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
                "agent_name": m.agent_name,
                "is_staff": m.is_staff,
                "structured": m.structured_payload,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }


@router.get("/chat/history")
def get_chat_history(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    messages = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return {
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "agent": m.agent_name,
                "is_staff": m.is_staff,
                "structured": m.structured_payload,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }


GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech"


def fix_wav_header(data: bytes) -> bytes:
    """
    Rewrites the RIFF chunk size and 'data' subchunk size fields to match
    the actual byte length of `data`.

    Streaming TTS APIs commonly emit a WAV header with a placeholder/incorrect
    size (0, or the max uint32) in these two fields, since they don't know the
    final length until generation finishes. Browsers, VLC, ffmpeg, etc. are
    lenient and just read to EOF regardless -- Android's native MediaPlayer /
    Stagefright extractor is not, and rejects these files outright with
    MEDIA_ERROR_UNKNOWN even though the audio data itself is perfectly valid.

    This does a byte-level patch rather than a full re-encode via the `wave`
    module, because `wave` also trusts the (possibly bogus) size field when
    reading frames back out -- patching the header directly is more robust
    to whatever the provider actually sent.
    """
    if len(data) < 44 or data[0:4] != b"RIFF" or data[8:12] != b"WAVE":
        # Not a WAV file we recognize the shape of -- return untouched
        # rather than risk corrupting something we don't understand.
        return data

    data = bytearray(data)

    # RIFF chunk size = total file size - 8 (the 'RIFF' + size field itself)
    riff_size = len(data) - 8
    data[4:8] = riff_size.to_bytes(4, "little")

    # Find the 'data' subchunk -- usually at offset 36 for a canonical
    # 44-byte header, but scan for it in case extra chunks (e.g. 'fact',
    # 'LIST') were inserted before it.
    pos = 12
    while pos + 8 <= len(data):
        chunk_id = bytes(data[pos:pos + 4])
        if chunk_id == b"data":
            data_size = len(data) - (pos + 8)
            data[pos + 4:pos + 8] = data_size.to_bytes(4, "little")
            break
        # Otherwise skip this chunk using ITS declared size to find the next
        # one. If a chunk's size is itself bogus we just stop scanning and
        # return what we've fixed so far rather than loop incorrectly.
        try:
            chunk_size = int.from_bytes(data[pos + 4:pos + 8], "little")
        except Exception:
            break
        pos += 8 + chunk_size + (chunk_size % 2)  # chunks are word-aligned

    return bytes(data)


class SpeakRequest(BaseModel):
    text: str
    language_code: str = "en"


@router.post("/voice/speak")
async def speak(
    request: SpeakRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Voice output routed per-language via the `languages` table, so an admin
    can enable/disable voice for a language without a code change. A language
    with tts_provider = None (the default for any newly added language) has
    no voice configured yet -- returns 204 so the frontend silently falls
    back to text-only, instead of guessing a provider or erroring.
    """
    language = db.query(Language).filter(Language.code == request.language_code).first()

    if not language or not language.tts_provider:
        return Response(status_code=204)

    if language.tts_provider == "groq_orpheus":
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                GROQ_TTS_URL,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json={
                    "model": "canopylabs/orpheus-v1-english",
                    "input": request.text[:200],
                    "voice": language.tts_voice_id or "troy",
                    "response_format": "wav",
                },
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"TTS provider error: {resp.text}")

        audio_bytes = fix_wav_header(resp.content)
        return StreamingResponse(iter([audio_bytes]), media_type="audio/wav")

    else:
        # "device_tts", or any provider value with no server-side handler
        # wired up yet -- falls back to text-only rather than guessing.
        return Response(status_code=204)


class TranscribeResponse(BaseModel):
    text: str


@router.post("/voice/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile,
    language_code: str = Form("en"),
    user_id: str = Depends(get_current_user_id),
):
    """
    Server-side STT via Groq's Whisper endpoint, used for languages the
    phone's on-device recognizer can't reliably handle. Whisper covers far
    more languages uniformly than any single on-device engine, so this is
    the default transcription path going forward rather than a fallback.
    """
    audio_bytes = await audio.read()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            files={"file": (audio.filename, audio_bytes, audio.content_type)},
            data={"model": "whisper-large-v3", "language": language_code},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"STT provider error: {resp.text}")

    return TranscribeResponse(text=resp.json().get("text", ""))