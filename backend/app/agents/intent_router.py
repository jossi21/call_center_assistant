from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field, create_model
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import Agent

router_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=settings.groq_api_key,
)


class IntentClassification(BaseModel):
    agents: list[str] = Field(
        description="One or more agent names needed to fully handle this message, in priority order"
    )
    reasoning: str = Field(description="Brief reason for this routing decision")


def classify_intent(message: str, db: Session) -> IntentClassification:
    active_agents = db.query(Agent).filter(Agent.is_active == True).all()

    agent_list_text = "\n".join(
        f"- {a.name}: {a.description}" for a in active_agents
    )

    system_prompt = f"""
You are an intent classifier for a call center chatbot.

Classify the user's message into one or more of these agents:

{agent_list_text}

If the message contains multiple distinct requests, list ALL relevant agent
names in priority order (most urgent or primary first).
If genuinely ambiguous or a single clear intent, return just one agent.
If nothing matches clearly, default to the most general support-like agent available.
"""

    structured_router = router_llm.with_structured_output(IntentClassification)

    result = structured_router.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=message),
    ])

    return result