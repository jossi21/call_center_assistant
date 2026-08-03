from app.channels.base import ChannelAdapter
from app.models.channel import ChannelMessage


class TelegramAdapter(ChannelAdapter):

    def parse_message(self, data):

        # Normal text message
        if "message" in data:
            message = data["message"]

            return ChannelMessage(
                user_id=str(message["from"]["id"]),
                user_name=message["from"].get("first_name"),
                session_id=f"telegram:{message['chat']['id']}",
                message=message.get("text", ""),
                channel="telegram"
            )


        # Inline keyboard callback
        if "callback_query" in data:
            callback = data["callback_query"]

            return ChannelMessage(
                user_id=str(callback["from"]["id"]),
                user_name=callback["from"].get("first_name"),
                session_id=f"telegram:{callback['message']['chat']['id']}",
                message=callback.get("data", ""),
                channel="telegram"
            )

        raise ValueError("Unsupported Telegram update")


    def format_response(self, response):

        return {
            "chat_id": response.session_id.replace(
                "telegram:",
                ""
            ),
            "message": response.answer,
            "actions": response.actions
        }