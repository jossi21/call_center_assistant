from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.core.config import settings
from app.models.db import Message

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=settings.groq_api_key,
)
 
SYSTEM_PROMPT = """
You are a customer support AI assistant for a call center.

Your job is to help users with their requests — answering
questions, helping them navigate account or service issues,
and guiding them toward the right kind of help.

Rules:

1. Be clear, concise, and professional.

2. If you don't know the answer or don't have enough
information, say so honestly rather than guessing.

3. If the user's request seems like something that requires
taking an action (e.g. changing a setting, making a purchase,
checking an account), acknowledge the request clearly —
action execution will be handled separately.

4. If the request is something you genuinely cannot help
with, let the user know you can connect them with a human
agent.
"""


def ask_ai(history: list[Message]) -> str:
    """
    Generate a response using the full recent conversation history,
    not just the latest message.
    """
    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    for msg in history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    response = llm.invoke(messages)
    return response.content