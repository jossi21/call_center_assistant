import requests
from sqlalchemy.orm import Session

from app.models.db import User, UserMemory


def execute_tool(action_type: str, action_config: dict, tool_args: dict, user_id: str, db: Session) -> dict:
    if action_type == "update_user_field":
        return _update_user_field(action_config, tool_args, user_id, db)
    elif action_type == "write_user_memory":
        return _write_user_memory(action_config, tool_args, user_id, db)
    elif action_type == "call_webhook":
        return _call_webhook(action_config, tool_args, user_id)
    else:
        return {"success": False, "error": f"Unknown action_type: {action_type}"}


def _update_user_field(action_config: dict, tool_args: dict, user_id: str, db: Session) -> dict:
    field = action_config["field"]
    value = tool_args.get(field) or tool_args.get("value")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not hasattr(user, field):
        return {"success": False, "error": f"Invalid field: {field}"}

    setattr(user, field, value)
    db.commit()
    return {"success": True, "field": field, "value": value}


def _write_user_memory(action_config: dict, tool_args: dict, user_id: str, db: Session) -> dict:
    key = action_config["memory_key"]
    value = tool_args.get("value") or str(tool_args)

    existing = db.query(UserMemory).filter(UserMemory.user_id == user_id, UserMemory.key == key).first()
    if existing:
        existing.value = value
    else:
        db.add(UserMemory(user_id=user_id, key=key, value=value))

    db.commit()
    return {"success": True, "key": key, "value": value}


def _call_webhook(action_config: dict, tool_args: dict, user_id: str) -> dict:
    url = action_config["url"].format(**tool_args, user_id=user_id)
    method = action_config.get("method", "POST")
    headers = action_config.get("headers", {})

    try:
        response = requests.request(method, url, json=tool_args, headers=headers, timeout=10)
        return {"success": response.ok, "status_code": response.status_code, "body": response.text}
    except requests.RequestException as e:
        return {"success": False, "error": str(e)}