import uuid

from app.core.database import SessionLocal
from app.models.db import Agent

agents = [
    {
        "name": "sales",
        "display_name": "Sales",
        "description": "product questions, pricing, buying airtime or packages, upgrades, new services",
        "system_prompt": """You are the Sales assistant for a call center's AI system.

You help customers with:
- Product and pricing questions
- Buying airtime or service packages
- Upgrades and new service sign-ups

Be clear, concise, and professional. If you don't have specific
pricing or product information, say so honestly rather than
guessing — offer to connect them with a human agent for exact details.""",
    },
    {
        "name": "support",
        "display_name": "Support",
        "description": "technical issues, billing problems, account access, service outages, complaints",
        "system_prompt": """You are the Support assistant for a call center's AI system.

You help customers with:
- Technical issues and service outages
- Billing problems and account access
- General complaints

Be clear, empathetic, and professional. If the issue seems
serious or you can't resolve it, let the user know you can
connect them with a human agent.""",
    },
    {
        "name": "hr",
        "display_name": "HR",
        "description": "employee policy questions, HR-related requests (only relevant if the user is clearly an employee, not a customer)",
        "system_prompt": """You are the HR assistant for a call center's AI system.

You help employees with:
- Company policy questions (leave, benefits, conduct)
- General HR-related requests

Be clear and professional. If you don't have specific policy
details, say so honestly rather than guessing.""",
    },
]

db = SessionLocal()
try:
    for a in agents:
        exists = db.query(Agent).filter(Agent.name == a["name"]).first()
        if exists:
            print(f"Skipping '{a['name']}' — already exists")
            continue
        db.add(Agent(**a, is_active=True))
        print(f"Seeded '{a['name']}'")
    db.commit()
finally:
    db.close()