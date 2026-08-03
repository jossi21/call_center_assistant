from typing import Any

from app.services.chat_service import process_chat
from app.models.chat import ChatRequest
from app.channels.web.adapter import WebAdapter
from app.channels.telegram.adapter import TelegramAdapter
from app.channels.whatsapp.adapter import WhatsAppAdapter


class ChannelGateway:

    def __init__(self):
        self.adapters = {
            "web": WebAdapter(),
            "telegram": TelegramAdapter(),
            "whatsapp": WhatsAppAdapter(),
        }

    def handle_channel(self, request: Any, channel: str):
        adapter = self.adapters.get(channel)

        if not adapter:
            raise ValueError(f"Unsupported channel: {channel}")

        # Channel format -> AI format
        message = adapter.parse_message(request)

        # AI processing — now goes through the live pipeline
        chat_request = ChatRequest(message=message)
        response = process_chat(chat_request)

        # AI format -> Channel format
        return adapter.format_response(response.answer)