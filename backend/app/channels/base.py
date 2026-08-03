from abc import ABC, abstractmethod


class ChannelAdapter(ABC):
# Convert channel-specific message into our internal message format.
    @abstractmethod
    def parse_message(self, data):
       
        pass

# Convert our AI response into channel-specific response.
    @abstractmethod
    def format_response(self, response):
        
        pass