from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.db import Message, Agent, Tool, PendingAction, User, Language
from app.agents.intent_router import classify_intent
from app.tools.executor import execute_tool
from langchain_groq import ChatGroq
# from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.config import settings

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=settings.groq_api_key,
)

# llm = ChatOllama(
#     model="qwen3:8b",
#     temperature=0,
#     keep_alive="30m",
#     num_predict=512,  # adjust based on how long responses actually need to be
# )


def _get_language_instruction(user_id: str, db: Session) -> str:
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.preferred_language == "en":
        return ""

    language = db.query(Language).filter(Language.code == user.preferred_language, Language.is_active == True).first()
    if not language:
        return ""

    return f"\n\nIMPORTANT: Respond ONLY in {language.name}, regardless of what language the user writes in, unless they explicitly ask to switch languages."


def _get_tools_for_agent(agent_name: str, db: Session) -> list[Tool]:
    return (
        db.query(Tool)
        .filter(Tool.is_active == True)
        .filter((Tool.agent_name == agent_name) | (Tool.agent_name.is_(None)))
        .all()
    )


def _tool_to_llm_schema(tool: Tool) -> dict:
    return {
        "type": "function",
        "function": {"name": tool.name, "description": tool.description, "parameters": tool.parameters_schema},
    }

def handle_message(latest_message: str, history: list[Message], db: Session, user_id: str) -> tuple[str, str]:
    language_instruction = _get_language_instruction(user_id, db)

    pending = (
        db.query(PendingAction)
        .filter(PendingAction.user_id == user_id, PendingAction.status == "awaiting_confirmation")
        .order_by(PendingAction.created_at.desc())
        .first()
    )

    if pending and pending.expires_at > datetime.now(timezone.utc):
        return _handle_confirmation_reply(latest_message, pending, db, language_instruction)

    # NEW LINE — find the most recent assistant message in history, if any
    last_assistant_msg = next((m.content for m in reversed(history) if m.role == "assistant"), None)

    # UPDATED LINE — pass it into classify_intent
    classification = classify_intent(latest_message, db, last_assistant_msg)

    primary_agent_name = classification.agents[0]
    pending_agent_names = classification.agents[1:]

    agent_row = db.query(Agent).filter(Agent.name == primary_agent_name, Agent.is_active == True).first()
    if not agent_row:
        agent_row = db.query(Agent).filter(Agent.is_active == True).first()


    tools = _get_tools_for_agent(agent_row.name, db)
    tool_schemas = [_tool_to_llm_schema(t) for t in tools]

    system_prompt = agent_row.system_prompt
    system_prompt += """

Tool-calling rules:
- Only call a tool if the user's CURRENT message clearly and directly requests that action.
- Do NOT call a tool just because it was discussed or used earlier in the conversation.
- Do NOT repeat a tool call for something that was already completed, unless the user explicitly asks again.
- If the current message is a greeting, acknowledgment, or unrelated to any tool, respond normally without calling a tool.
"""
    if pending_agent_names:
        system_prompt += f"\n\nNote: the user's message may also touch on: {', '.join(pending_agent_names)}. If you haven't already addressed that in your response, briefly acknowledge it and offer to help next."

    system_prompt += language_instruction

    messages = [SystemMessage(content=system_prompt)]
    for msg in history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    llm_with_tools = llm.bind_tools(tool_schemas) if tool_schemas else llm
    response = llm_with_tools.invoke(messages)

    if response.tool_calls:
        return _handle_tool_call(response, tools, user_id, db, agent_row.display_name, language_instruction)

    return response.content, agent_row.display_name


def _generate_in_language(exact_message: str, language_instruction: str) -> str:
    """Translate a precise, pre-written message into the user's language.
    Does NOT ask the model to compose new content — only to translate."""
    if not language_instruction:
        return exact_message  

    prompt = f"""Translate the following message into the target language. Output ONLY the translation, nothing else — no extra commentary, no elaboration, no additional information.

Message to translate: "{exact_message}"
{language_instruction}"""

    result = llm.invoke([SystemMessage(content=prompt), HumanMessage(content=exact_message)])
    return result.content


def _handle_tool_call(response, tools: list[Tool], user_id: str, db: Session, agent_display_name: str, language_instruction: str) -> tuple[str, str]:
    tool_call = response.tool_calls[0]
    tool_name = tool_call["name"]
    tool_args = tool_call["args"]

    tool = next((t for t in tools if t.name == tool_name), None)
    tool = next((t for t in tools if t.name == tool_name), None)
    if not tool:
        text = _generate_in_language("Tell the user, briefly and politely, that you couldn't process that request.", language_instruction)
        return text, agent_display_name

    if tool.name == "change_language":
        requested_code = tool_args.get("value", "").lower()
        valid_language = db.query(Language).filter(Language.code == requested_code, Language.is_active == True).first()
        if not valid_language:
            supported = ", ".join(l.name for l in db.query(Language).filter(Language.is_active == True).all())
            text = _generate_in_language(f"That language isn't supported yet. Supported languages: {supported}.", language_instruction)
            return text, agent_display_name

    if tool.risk_tier == "safe":
        execute_tool(tool.action_type, tool.action_config, tool_args, user_id, db)
        fresh_language_instruction = _get_language_instruction(user_id, db)
        text = _generate_in_language(f"Done — {tool.description}.", fresh_language_instruction)
        return text, agent_display_name

    pending = PendingAction(
        user_id=user_id,
        tool_name=tool.name,
        tool_args=tool_args,
        status="awaiting_confirmation",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
    )
    db.add(pending)
    db.commit()

    text = _generate_in_language(f"Confirm: {tool.description} — details: {tool_args}. Reply yes or no.", language_instruction)
    return text, agent_display_name


def _handle_confirmation_reply(latest_message: str, pending: PendingAction, db: Session, language_instruction: str) -> tuple[str, str]:
    confirm_check_prompt = f"""
The user has a pending action: {pending.tool_name} with details {pending.tool_args}.

The user may respond in ANY language. Your job is to understand the meaning regardless of language.

Does the user's message mean yes/agree or no/decline to this specific pending action?
Message: "{latest_message}"

Reply with exactly one word:
- "confirm" if the message means agreement in any language
- "decline" if the message means rejection in any language
- "unrelated" if the message is completely unrelated to confirming or declining
"""
    result = llm.invoke([SystemMessage(content=confirm_check_prompt)])
    decision = result.content.strip().lower()

    if "confirm" in decision:
        tool = db.query(Tool).filter(Tool.name == pending.tool_name).first()
        exec_result = execute_tool(tool.action_type, tool.action_config, pending.tool_args, str(pending.user_id), db)

        pending.status = "confirmed"
        db.commit()

        fresh_language_instruction = _get_language_instruction(str(pending.user_id), db)

        if exec_result.get("success"):
            text = _generate_in_language(f"Done — {tool.description}.", fresh_language_instruction)
        else:
            text = _generate_in_language("Something went wrong. Please try again.", fresh_language_instruction)
        return text, "System"

    elif "decline" in decision:
        pending.status = "cancelled"
        db.commit()
        text = _generate_in_language("Cancelled.", language_instruction)
        return text, "System"

    else:
        pending.status = "cancelled"
        db.commit()
        return handle_message(latest_message, [], db, str(pending.user_id))