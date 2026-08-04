from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field
from app.core.config import settings

# models
from app.models.agent import AgentType

router_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=settings.groq_api_key,
)

# class used to get intent route and why is to be selected
class IntentClassification(BaseModel):
    agents: list[AgentType] = Field(
        description="One or more agents needed to fully handle this message, in priority order"
    )
    reasoning: str = Field(description="Brief reason for this routing decision")


structured_router = router_llm.with_structured_output(IntentClassification)

ROUTER_SYSTEM_PROMPT = """
You are an intent classifier for a call center chatbot.

Classify the user's message into one or more of these agents:

- sales: product questions, pricing, buying airtime or packages, upgrades, new services
- support: technical issues, billing problems, account access, service outages, complaints
- hr: employee policy questions, HR-related requests (only relevant if the user is clearly an employee, not a customer)

If the message contains multiple distinct requests, list ALL relevant agents
in priority order (most urgent or primary first).
If genuinely ambiguous or a single clear intent, return just one agent.
If nothing matches clearly, default to support.
"""

# the classify function
def classify_intent(message: str) -> IntentClassification:
    result = structured_router.invoke([
        SystemMessage(content=ROUTER_SYSTEM_PROMPT),
        HumanMessage(content=message)
    ])

    return result