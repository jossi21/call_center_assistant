from app.services.intent_router import classify_intent

test_messages = [
    "How much does the premium package cost?",
    "My internet has been down since yesterday",
    "What's the policy on annual leave?",
    "I need help with my bill and also want to buy airtime",
]

for msg in test_messages:
    result = classify_intent(msg)
    agents = [a.value for a in result.agents]
    print(f"'{msg}' -> {agents} ({result.reasoning})")