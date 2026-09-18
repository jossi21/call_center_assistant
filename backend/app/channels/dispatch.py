import requests
import json

def extract_path(data: dict, path: str):
    current = data
    for part in path.split("."):
        if isinstance(current, list):
            try:
                current = current[int(part)]
            except (ValueError, IndexError):
                return None
        elif isinstance(current, dict):
            current = current.get(part)
        else:
            return None
        if current is None:
            return None
    return current


def _fill_template(obj, values: dict):
    if isinstance(obj, str):
        return obj.format(**values)
    if isinstance(obj, dict):
        return {k: _fill_template(v, values) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_fill_template(v, values) for v in obj]
    return obj


def send_via_channel(outbound_def: dict, channel_config: dict, sender_id: str, message: str):
    values = {**channel_config, "sender_id": sender_id, "message": message}

    url = outbound_def["url_template"].format(**values)
    method = outbound_def.get("method", "POST")
    headers = _fill_template(outbound_def.get("headers_template", {}), values)
    body = _fill_template(outbound_def.get("body_template", {}), values)

    response = requests.request(method, url, json=body, headers=headers, timeout=10)
    return {"success": response.ok, "status_code": response.status_code, "body": response.text}




def build_whatsapp_list_body(sender_id: str, payload: dict) -> dict:
    rows = [
        {
            "id": f"opt_{i}",
            "title": item["title"][:24],
            "description": item.get("description", "")[:72],
        }
        for i, item in enumerate(payload["items"][:10])  # WhatsApp hard cap: 10 rows
    ]
    return {
        "messaging_product": "whatsapp",
        "to": sender_id,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "header": {"type": "text", "text": payload["title"][:60]},
            "body": {"text": payload.get("intro", "Select an option below:")},
            "action": {
                "button": "View Options",
                "sections": [{"title": payload["title"][:24], "rows": rows}],
            },
        },
    }


def build_telegram_keyboard_body(sender_id: str, payload: dict) -> dict:
    keyboard = [
        [{"text": item["title"][:64], "callback_data": item["title"][:64]}]
        for item in payload["items"][:20]  # Telegram has no hard row cap, keep it sane
    ]
    lines = [f"*{payload['title']}*", ""]
    for item in payload["items"]:
        lines.append(f"• *{item['title']}* — {item.get('description', '')}")
    return {
        "chat_id": sender_id,
        "text": "\n".join(lines),
        "parse_mode": "Markdown",
        "reply_markup": {"inline_keyboard": keyboard},
    }


STRUCTURED_BUILDERS = {
    "whatsapp": build_whatsapp_list_body,
    "telegram": build_telegram_keyboard_body,
}


def send_structured_via_channel(channel_name: str, outbound_def: dict, channel_config: dict, sender_id: str, payload: dict):
    """Sends a real interactive message (WhatsApp list / Telegram inline keyboard)
    instead of plain text. Reuses the same URL/auth already defined for that
    channel's plain-text send — only the request body differs."""
    builder = STRUCTURED_BUILDERS.get(channel_name)
    if not builder:
        raise ValueError(f"No structured builder for channel '{channel_name}'")

    values = {**channel_config, "sender_id": sender_id, "message": ""}
    url = outbound_def["url_template"].format(**values)
    method = outbound_def.get("method", "POST")
    headers = _fill_template(outbound_def.get("headers_template", {}), values)
    body = builder(sender_id, payload)

    response = requests.request(method, url, json=body, headers=headers, timeout=10)
    return {"success": response.ok, "status_code": response.status_code, "body": response.text}