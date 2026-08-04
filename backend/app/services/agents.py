from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.models.db import Message
from app.models.agent import AgentType

AGENT_PROMPTS = {
    AgentType.SALES: """
You are a sales assistant for a telecom call center.
Help customers with product questions, pricing, packages,
airtime purchases, and upgrades. Be helpful and clear about
pricing and options. If the request involves actually buying
something, acknowledge it clearly — the purchase itself is
handled separately.
""",
    AgentType.SUPPORT: """
You are a technical and billing support assistant for a
telecom call center. Help customers troubleshoot issues,
understand their bill, resolve account problems, and report
outages. If you can't resolve something, let them know you
can connect them with a human agent.
""",
    AgentType.HR: """
You are an HR assistant for company employees. Answer
questions about policies, leave, benefits, and internal
procedures clearly and professionally.
""",
}


def generate_agent_response(agent_type: AgentType, history: list[Message], llm) -> str:
    system_prompt = AGENT_PROMPTS[agent_type]
    messages = [SystemMessage(content=system_prompt)]

    for msg in history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    response = llm.invoke(messages)
    return response.content