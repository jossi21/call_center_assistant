from app.models.chat import ChatRequest, ChatResponse
from app.channels.base import ChannelAdapter
from app.models.channel import ChannelMessage


class WebAdapter(ChannelAdapter):

    def parse_message(self, data:ChatRequest)-> ChannelMessage:

        return ChannelMessage(
            user_id=f"web:{data.session_id or 'anonymous'}",
            channel="web",
            session_id=data.session_id,
            message=data.message,
        )


    def format_response(self, response: ChatResponse)-> ChatResponse:
        return response