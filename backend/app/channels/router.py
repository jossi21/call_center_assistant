from fastapi import APIRouter, Depends, Request, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db import Channel
from app.channels.registry import CHANNEL_TYPES
from app.channels.identity import resolve_or_create_identity
from app.channels.verification import handle_channel_verification
from app.channels.dispatch import extract_path, send_via_channel
from app.services.chat_service import process_channel_message

router = APIRouter(prefix="/channels", tags=["Channels"])


@router.post("/{channel_name}/webhook")
async def channel_webhook(channel_name: str, request: Request, db: Session = Depends(get_db)):
    channel = db.query(Channel).filter(Channel.name == channel_name, Channel.is_active == True).first()
    if not channel:
        raise HTTPException(status_code=503, detail=f"Channel '{channel_name}' not configured or inactive")

    type_def = CHANNEL_TYPES.get(channel_name)
    if not type_def:
        raise HTTPException(status_code=500, detail=f"No connector registered for '{channel_name}'")

    data = await request.json()

    sender_id = extract_path(data, type_def["inbound_map"]["sender_id_path"])
    text = extract_path(data, type_def["inbound_map"]["text_path"])

    if not sender_id or not text:
        return {"status": "ignored"}

    username = extract_path(data, type_def["inbound_map"].get("username_path", "")) if type_def["inbound_map"].get("username_path") else None
    display_name = extract_path(data, type_def["inbound_map"].get("display_name_path", "")) if type_def["inbound_map"].get("display_name_path") else None

    is_trusted = type_def.get("trusted_sender_id", False)
    auto_verified_phone = str(sender_id) if is_trusted else None

    identity = resolve_or_create_identity(
        channel_name, str(sender_id), db,
        username=username, display_name=display_name,
        auto_verified_phone=auto_verified_phone,
    )

    if not is_trusted:
        verification_reply = handle_channel_verification(identity, text, db)
        if verification_reply is not None:
            send_via_channel(type_def["outbound"], channel.config, str(sender_id), verification_reply)
            return {"status": "verification"}

    response = process_channel_message(text, db, str(identity.user_id), channel_type=channel_name)
    send_via_channel(type_def["outbound"], channel.config, str(sender_id), response.answer)

    return {"status": "sent"}