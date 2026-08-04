from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# app files
from app.core.config import settings
from app.models.db import Message

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=settings.groq_api_key,
)

# base agent class
class BaseAgent:
    system_prompt: str = ""

    def respond(self, history: list[Message], pending_agents: list[str] | None)-> str:
        messages = [SystemMessage(content=self._build_prompt(pending_agents))]

        for msg in history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))

        response = llm.invoke(messages)
        return response.content


    def _build_prompt(self, pending_agents: list[str] | None) -> str:
        prompt = self.system_prompt
        if pending_agents:
            prompt += f"\n\nNote: the user's message may also touch on: {', '.join(pending_agents)}. If you haven't already addressed that in your response, briefly acknowledge it and offer to help next. Don't repeat yourself if you've already covered it."
        return prompt