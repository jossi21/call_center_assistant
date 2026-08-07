from app.core.database import SessionLocal
from app.models.db import Tool

tools = [
    {
        "name": "change_language",
        "description": "Change the user's preferred language for all future responses across every channel",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "value": {"type": "string", "description": "The language code, e.g. 'en' or 'am'"}
            },
            "required": ["value"],
        },
        "risk_tier": "reversible",
        "action_type": "update_user_field",
        "action_config": {"field": "preferred_language"},
        "agent_name": None,  
    },
    {
        "name": "buy_airtime",
        "description": "Purchase airtime for the user's phone number",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "amount": {"type": "number", "description": "Amount in Birr"},
            },
            "required": ["amount"],
        },
        "risk_tier": "destructive",
        "action_type": "call_webhook",
        "action_config": {
            "url": "https://httpbin.org/post",  # placeholder until a real endpoint exists
            "method": "POST",
        },
        "agent_name": "sales",
    },
]

db = SessionLocal()
try:
    for t in tools:
        exists = db.query(Tool).filter(Tool.name == t["name"]).first()
        if exists:
            print(f"Skipping '{t['name']}' — already exists")
            continue
        db.add(Tool(**t, is_active=True))
        print(f"Seeded '{t['name']}'")
    db.commit()
finally:
    db.close()