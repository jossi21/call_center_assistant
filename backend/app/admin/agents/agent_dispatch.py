from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.core.config import settings

# admin folder imports
from app.models.db import Message, Agent, Tool, PendingAction, User, Language, Handoff, AuditLog, UserMemory
from app.admin.agents.intent_router import classify_intent
from app.admin.agents.handoff import (
    wants_human_handoff,
    create_handoff_request,
    confirm_handoff,
    cancel_handoff
)
from app.tools.executor import execute_tool
from app.core.llm import llm
from typing import Callable, Optional
import threading
# from langchain_ollama import ChatOllama


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


def _is_case_status_question(latest_message: str) -> bool:
    check_prompt = f"""Is this message specifically asking for a status update or progress check on an existing issue (e.g. "any update?", "what's happening with my case?", "is this fixed yet?")?

Message: "{latest_message}"

Reply with exactly one word: "yes" or "no".
"""
    result = llm.invoke([SystemMessage(content=check_prompt)])
    return result.content.strip().lower().startswith("yes")


def _summarize_case_status(handoff: Handoff, db: Session) -> str:
    staff_messages = (
        db.query(Message)
        .filter(Message.user_id == handoff.user_id, Message.role == "assistant", Message.agent_name.isnot(None))
        .order_by(Message.created_at.desc())
        .limit(5)
        .all()
    )
    staff_messages.reverse()

    if not staff_messages:
        return "No updates yet — a specialist is on it and will follow up shortly."

    transcript = "\n".join(f"- {m.content}" for m in staff_messages)
    prompt = f"""A customer is asking for a status update on this issue: "{handoff.reason}"

Here are the most recent updates from the support agent handling it:
{transcript}

Write a short, natural status update for the customer based on the above — don't invent anything not stated here."""
    result = llm.invoke([SystemMessage(content=prompt)])
    return result.content.strip()


def _check_active_handoff(user_id: str, db: Session) -> Optional[Handoff]:
    """Shared lookup: is there a case assigned to a human where staff has
    explicitly taken over (ai_paused)? Used identically by both the
    streaming and non-streaming entry points."""
    return (
        db.query(Handoff)
        .filter(Handoff.user_id == user_id, Handoff.status == "assigned", Handoff.ai_paused == True)
        .order_by(Handoff.created_at.desc())
        .first()
    )


def handle_message(
    latest_message: str,
    history: list[Message],
    db: Session,
    user_id: str,
):
    """Routes the message, runs tools/handoff/confirmation logic, and returns
    (answer, agent_display_name). Used by non-streaming callers (Telegram,
    WhatsApp, and the plain /chat endpoint)."""

    language_instruction = _get_language_instruction(user_id, db)

    pending_handoff = (
        db.query(Handoff)
        .filter(Handoff.user_id == user_id, Handoff.status == "waiting_confirmation")
        .order_by(Handoff.created_at.desc())
        .first()
    )
    if pending_handoff:
        return _handle_handoff_confirmation_reply(latest_message, pending_handoff, history, db, language_instruction)

    pending = (
        db.query(PendingAction)
        .filter(PendingAction.user_id == user_id, PendingAction.status == "awaiting_confirmation")
        .order_by(PendingAction.created_at.desc())
        .first()
    )
    if pending and pending.expires_at > datetime.now(timezone.utc):
        return _handle_confirmation_reply(latest_message, pending, db, language_instruction)

    last_assistant_msg = next((m.content for m in reversed(history) if m.role == "assistant"), None)

    active_handoff = _check_active_handoff(user_id, db)

    if active_handoff:
    # Paused: swallow the message entirely. No AI reply, no canned filler —
    # the customer's message is saved (by the caller) and delivered to staff
    # over the websocket; staff answers directly, with zero AI intervention.
        return text, "System"

    # Not paused — AI has full control. But if there's an assigned case (paused
    # or not) and the customer is asking for a status update on it, answer that
    # accurately from the case's real history instead of a generic AI guess.
    current_handoff = (
        db.query(Handoff)
        .filter(Handoff.user_id == user_id, Handoff.status == "assigned")
        .order_by(Handoff.created_at.desc())
        .first()
    )
    if (
        current_handoff
        and _is_case_status_question(latest_message)
        and _is_related_to_handoff(latest_message, current_handoff.reason)
    ):
        summary = _summarize_case_status(current_handoff, db)
        text = _generate_in_language(summary, language_instruction)
        return text, "System"

    # Otherwise, proceed exactly as if there were no handoff at all.
    if wants_human_handoff(latest_message, last_assistant_msg):
        return _start_handoff(latest_message, history, db, user_id, language_instruction)

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
    system_prompt += _get_user_memory_context(user_id, db)
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


def handle_message_stream(
    latest_message: str,
    history: list[Message],
    db: Session,
    user_id: str,
    on_stage: Optional[Callable[[str], None]] = None,
    on_token: Optional[Callable[[str], None]] = None,
    stop_event: Optional["threading.Event"] = None,
):
    """Same routing/tool logic as handle_message, but streams tokens for the
    plain-reply path via on_token. Non-streamable paths (confirmations, handoff,
    tool-call results) are returned as complete strings, same as handle_message."""

    def stage(name: str):
        if on_stage:
            on_stage(name)

    stage("thinking")
    language_instruction = _get_language_instruction(user_id, db)

    pending_handoff = (
        db.query(Handoff)
        .filter(Handoff.user_id == user_id, Handoff.status == "waiting_confirmation")
        .order_by(Handoff.created_at.desc())
        .first()
    )
    if pending_handoff:
        stage("validating")
        return _handle_handoff_confirmation_reply(latest_message, pending_handoff, history, db, language_instruction, on_stage=on_stage, on_token=on_token, stop_event=stop_event)

    pending = (
        db.query(PendingAction)
        .filter(PendingAction.user_id == user_id, PendingAction.status == "awaiting_confirmation")
        .order_by(PendingAction.created_at.desc())
        .first()
    )
    if pending and pending.expires_at > datetime.now(timezone.utc):
        stage("validating")
        return _handle_confirmation_reply(latest_message, pending, db, language_instruction, on_stage=on_stage, on_token=on_token, stop_event=stop_event)

    last_assistant_msg = next((m.content for m in reversed(history) if m.role == "assistant"), None)

    active_handoff = _check_active_handoff(user_id, db)

    if active_handoff:
        return None, "System"

    # Not paused — AI has full control. But if there's an assigned case (paused
    # or not) and the customer is asking for a status update on it, answer that
    # accurately from the case's real history instead of a generic AI guess.
    current_handoff = (
        db.query(Handoff)
        .filter(Handoff.user_id == user_id, Handoff.status == "assigned")
        .order_by(Handoff.created_at.desc())
        .first()
    )
    if (
        current_handoff
        and _is_case_status_question(latest_message)
        and _is_related_to_handoff(latest_message, current_handoff.reason)
    ):
        stage("generating")
        summary = _summarize_case_status(current_handoff, db)
        text = _generate_in_language(summary, language_instruction)
        return text, "System"

    # Otherwise, proceed exactly as if there were no handoff at all.
    stage("validating")
    if wants_human_handoff(latest_message,      last_assistant_msg):
        return _start_handoff(latest_message, history, db, user_id, language_instruction)

    
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
    system_prompt += _get_user_memory_context(user_id, db)
    system_prompt += language_instruction

    messages = [SystemMessage(content=system_prompt)]
    for msg in history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    llm_with_tools = llm.bind_tools(tool_schemas) if tool_schemas else llm

    stage("generating")

    # Stream the response. If it turns out to include tool_calls, we've already
    # streamed some text (rare — tool-calling responses are usually pure tool_calls
    # with empty content), but we still handle the tool call correctly afterward.
    # If stop_event is set mid-stream, we break immediately: this stops pulling
    # further chunks from the Groq stream (no further tokens are billed/generated)
    # and we return whatever partial text was produced so far.
    full_chunk = None
    was_stopped = False
    for chunk in llm_with_tools.stream(messages):
        if stop_event is not None and stop_event.is_set():
            was_stopped = True
            break
        if chunk.content and on_token:
            on_token(chunk.content)
        full_chunk = chunk if full_chunk is None else full_chunk + chunk

    if was_stopped:
        return (full_chunk.content if full_chunk else ""), agent_row.display_name

    if full_chunk and full_chunk.tool_calls:
        return _handle_tool_call(full_chunk, tools, user_id, db, agent_row.display_name, language_instruction)

    return full_chunk.content if full_chunk else "", agent_row.display_name


def continue_message_stream(
    partial_answer: str,
    agent_display_name: str,
    user_id: str,
    db: Session,
    on_stage: Optional[Callable[[str], None]] = None,
    on_token: Optional[Callable[[str], None]] = None,
    stop_event: Optional["threading.Event"] = None,
):
    """Resume an interrupted assistant reply exactly where it left off.

    This intentionally skips routing/classification/tool logic — the original
    message already determined which agent should answer and got most of the
    way there. We just hand the model its own unfinished reply and ask it to
    keep going, so the continuation reads as one seamless message rather than
    a new turn."""

    def stage(name: str):
        if on_stage:
            on_stage(name)

    stage("generating")
    language_instruction = _get_language_instruction(user_id, db)

    agent_row = (
        db.query(Agent)
        .filter(Agent.display_name == agent_display_name, Agent.is_active == True)
        .first()
    )
    if not agent_row:
        agent_row = db.query(Agent).filter(Agent.is_active == True).first()

    tools = _get_tools_for_agent(agent_row.name, db)
    tool_schemas = [_tool_to_llm_schema(t) for t in tools]
    llm_with_tools = llm.bind_tools(tool_schemas) if tool_schemas else llm

    system_prompt = agent_row.system_prompt + language_instruction

    messages = [
        SystemMessage(content=system_prompt),
        AIMessage(content=partial_answer),
        HumanMessage(content=(
            "Continue exactly where you left off. Do not repeat any earlier text, "
            "do not restart, and do not add any preamble or acknowledgement — just "
            "pick up mid-thought if needed and keep going naturally until the answer "
            "is complete."
        )),
    ]

    full_chunk = None
    for chunk in llm_with_tools.stream(messages):
        if stop_event is not None and stop_event.is_set():
            break
        if chunk.content and on_token:
            on_token(chunk.content)
        full_chunk = chunk if full_chunk is None else full_chunk + chunk

    continuation = full_chunk.content if full_chunk else ""
    return continuation, agent_row.display_name


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
        exec_result = execute_tool(tool.action_type, tool.action_config, tool_args, user_id, db)
        _log_action(user_id, tool.name, tool_args, "success" if exec_result.get("success") else "failed", db)
        fresh_language_instruction = _get_language_instruction(user_id, db)

        if not exec_result.get("success"):
            text = _generate_in_language("Something went wrong completing that. Please try again.", fresh_language_instruction)
            return text, agent_display_name

        result_summary = str(exec_result.get("body", exec_result))[:1500]  # cap length
        prompt = f"""The following data was just retrieved: {result_summary}

Summarize the relevant parts of this for the user in a natural, helpful way, in response to their request. Don't mention raw technical details like HTTP or JSON unless genuinely relevant."""
        result = llm.invoke([SystemMessage(content=prompt)] + ([HumanMessage(content=fresh_language_instruction)] if fresh_language_instruction else []))
        text = result.content
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
    _log_action(user_id, tool.name, tool_args, "pending_confirmation", db)

    text = _generate_in_language(f"Confirm: {tool.description} — details: {tool_args}. Reply yes or no.", language_instruction)
    return text, agent_display_name


def _handle_confirmation_reply(latest_message: str, pending: PendingAction, db: Session, language_instruction: str, on_stage: Optional[Callable[[str], None]] = None, on_token: Optional[Callable[[str], None]] = None, stop_event: Optional["threading.Event"] = None):
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
        _log_action(str(pending.user_id), tool.name, pending.tool_args, "success" if exec_result.get("success") else "failed", db)

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
        _log_action(str(pending.user_id), pending.tool_name, pending.tool_args, "declined", db)
        if on_token is not None or on_stage is not None:
            return handle_message_stream(latest_message, [], db, str(pending.user_id), on_stage=on_stage, on_token=on_token, stop_event=stop_event)
        return handle_message(latest_message, [], db, str(pending.user_id))


# the function which handel handoff the issue
def _start_handoff(latest_message: str, history: list[Message], db: Session, user_id: str, language_instruction: str) -> tuple[str, str]:
    last_assistant_msg = next((m.content for m in reversed(history) if m.role == "assistant"), None)

    reason_prompt = f"""Summarize, in one short sentence, why this user needs a human agent, based on this context.
User's message: "{latest_message}"
Assistant's last message: "{last_assistant_msg or 'none'}"
"""
    reason_result = llm.invoke([SystemMessage(content=reason_prompt)])
    reason = reason_result.content.strip()

    # infer which agent was active, if any, from the most recent assistant turn's agent label —
    # not tracked on Message today, so left None for now; falls back to "any available staff"
    originating_agent = None

    create_handoff_request(user_id, reason, originating_agent, db)

    text = _generate_in_language(
        "I'd like to confirm — should I connect you with a human agent? (yes/no)",
        language_instruction,
    )
    return text, "System"


def _handle_handoff_confirmation_reply(latest_message: str, handoff: Handoff, history: list[Message], db: Session, language_instruction: str, on_stage: Optional[Callable[[str], None]] = None, on_token: Optional[Callable[[str], None]] = None, stop_event: Optional["threading.Event"] = None):
    confirm_check_prompt = f"""
Does this message confirm or decline connecting to a human agent? The user may respond in any language.
Message: "{latest_message}"
Reply with exactly one word: confirm, decline, or unrelated.
"""
    result = llm.invoke([SystemMessage(content=confirm_check_prompt)])
    decision = result.content.strip().lower()

    if "confirm" in decision:
        outcome = confirm_handoff(handoff, history, db)
        if outcome == "no_staff_available":
            text = _generate_in_language(
                "I've logged your request, but no staff member is available to claim it right now — someone will follow up as soon as possible.",
                language_instruction,
            )
        else:
            text = _generate_in_language(
                "You're connected — a team member has been notified and will respond here shortly.",
                language_instruction,
            )
        return text, "System"

    elif "decline" in decision:
        cancel_handoff(handoff, db)
        text = _generate_in_language("No problem, I'll keep helping. What can I do for you?", language_instruction)
        return text, "System"

    else:
        cancel_handoff(handoff, db)
        if on_token is not None or on_stage is not None:
            return handle_message_stream(latest_message, [], db, str(handoff.user_id), on_stage=on_stage, on_token=on_token, stop_event=stop_event)
        return handle_message(latest_message, [], db, str(handoff.user_id))


# track every tool execution
def _log_action(user_id: str, action: str, payload: dict, result: str, db: Session):
    entry = AuditLog(
        user_id=user_id,
        action=action,
        payload=payload,
        result=result,
    )
    db.add(entry)
    db.commit()


def _is_related_to_handoff(latest_message: str, handoff_reason: str) -> bool:
    """Distinguishes 'still about the handed-off issue' from 'a separate,
    unrelated request' — so an active handoff only blocks AI replies for
    messages that actually continue that same issue, not everything the
    customer says while the case is open."""
    check_prompt = f"""A customer has an unresolved support case currently being handled by a human agent, about: "{handoff_reason}"

Does the customer's CURRENT message continue, follow up on, or ask about THAT SAME issue? Or is it a new, unrelated request — a different service, a different problem, or general help — that has nothing to do with that case?

Message: "{latest_message}"

Reply with exactly one word: "related" or "unrelated".
"""
    result = llm.invoke([SystemMessage(content=check_prompt)])
    return result.content.strip().lower().startswith("related")


# add a memory-context helper
def _get_user_memory_context(user_id: str, db: Session) -> str:
    entries = db.query(UserMemory).filter(UserMemory.user_id == user_id).all()
    if not entries:
        return ""

    facts = "\n".join(f"- {e.key}: {e.value}" for e in entries)
    return f"\n\nKnown facts about this user (from previous conversations):\n{facts}\n\nUse these naturally where relevant. Don't ask for information you already have here."