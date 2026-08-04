from app.agents.sales_agent import SalesAgent
from app.agents.support_agent import SupportAgent
from app.agents.hr_agent import HRAgent
from app.models.agent import AgentType
from app.models.db import Message
from app.services.intent_router import classify_intent

AGENT_REGISTRY = {
    AgentType.SALES: SalesAgent(),
    AgentType.SUPPORT: SupportAgent(),
    AgentType.HR : HRAgent(),
}

# the function which handle message
def handel_message(latest_message: str, history: list[Message])-> str:
    classification =  classify_intent(latest_message)

    primary_agent_type = classification.agents[0]
    pending_agent_type = [a.value for a in classification.agents[1:]]

    agent = AGENT_REGISTRY[primary_agent_type]
    answer = agent.respond(history, pending_agents=pending_agent_type)

    return answer, primary_agent_type.value