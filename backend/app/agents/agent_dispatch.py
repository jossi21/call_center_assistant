from sqlalchemy.orm import Session

from app.models.db import Message, Agent
from app.agents.intent_router import classify_intent
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.config import settings

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=settings.groq_api_key,
)


def handle_message(latest_message: str, history: list[Message], db: Session) -> tuple[str, str]:
    classification = classify_intent(latest_message, db)

    primary_agent_name = classification.agents[0]
    pending_agent_names = classification.agents[1:]

    agent_row = db.query(Agent).filter(Agent.name == primary_agent_name, Agent.is_active == True).first()

    if not agent_row:
        # Fallback if the model hallucinated a name that doesn't exist
        agent_row = db.query(Agent).filter(Agent.is_active == True).first()

    system_prompt = agent_row.system_prompt
    if pending_agent_names:
        system_prompt += f"\n\nNote: the user's message may also touch on: {', '.join(pending_agent_names)}. If you haven't already addressed that in your response, briefly acknowledge it and offer to help next. Don't repeat yourself if you've already covered it."

    messages = [SystemMessage(content=system_prompt)]
    for msg in history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    response = llm.invoke(messages)

    return response.content, agent_row.display_name