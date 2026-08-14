import requests


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