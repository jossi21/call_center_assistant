from fastapi import APIRouter, Depends, Request, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db import Channel
from app.channels.registry import CHANNEL_TYPES
from app.channels.identity import resolve_or_create_identity
from app.channels.verification import handle_channel_verification
from app.channels.dispatch import extract_path, send_via_channel, extract_path, send_via_channel, send_structured_via_channel
from app.channels.formatting import format_for_channel
from app.services.chat_service import process_channel_message



router = APIRouter(prefix="/channels", tags=["Channels"])


@router.get("/{channel_name}/webhook")
async def verify_channel_webhook(
    channel_name: str,
    request: Request,
    db: Session = Depends(get_db),
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    channel = db.query(Channel).filter(Channel.name == channel_name, Channel.is_active == True).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    expected_token = channel.config.get("verify_token")
    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        return PlainTextResponse(content=hub_challenge)

    raise HTTPException(status_code=403, detail="Verification failed")



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

    # Fall back to button-tap extraction if the primary text path found nothing.
    if not text:
        interactive_path = type_def.get("interactive_text_path")
        if interactive_path:
            text = extract_path(data, interactive_path)

    if (not sender_id or not text) and type_def.get("callback_map"):
        callback_sender = extract_path(data, type_def["callback_map"]["sender_id_path"])
        callback_text = extract_path(data, type_def["callback_map"]["text_path"])
        if callback_sender and callback_text:
            sender_id, text = callback_sender, callback_text

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
            formatted_reply = format_for_channel(channel_name, verification_reply)
            send_via_channel(type_def["outbound"], channel.config, str(sender_id), formatted_reply)
            return {"status": "verification"}

    response = process_channel_message(text, db, str(identity.user_id), channel_type=channel_name)

    if response.structured and type_def.get("supports_structured"):
        send_result = send_structured_via_channel(channel_name, type_def["outbound"], channel.config, str(sender_id), response.structured)
    else:
        formatted_answer = format_for_channel(channel_name, response.answer)
        send_result = send_via_channel(type_def["outbound"], channel.config, str(sender_id), formatted_answer)

    if not send_result["success"]:
        print(f"[WEBHOOK SEND FAILED] channel={channel_name} status={send_result['status_code']} body={send_result['body']}")

    return {"status": "sent" if send_result["success"] else "send_failed"}