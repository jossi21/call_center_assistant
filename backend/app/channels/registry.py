CHANNEL_TYPES = {
    "telegram": {
        "display_name": "Telegram",
        "fields": [
            {"key": "bot_token", "label": "Bot Token", "type": "password", "required": True},
            {"key": "webhook_secret", "label": "Webhook Secret (optional)", "type": "text", "required": False},
        ],
        "inbound_map": {
            "sender_id_path": "message.chat.id",
            "text_path": "message.text",
            "username_path": "message.from.username",
            "display_name_path": "message.from.first_name",
        },
        "outbound": {
            "url_template": "https://api.telegram.org/bot{bot_token}/sendMessage",
            "method": "POST",
            "body_template": {
                "chat_id": "{sender_id}", 
                "text": "{message}",
                "parse_mode": "Markdown"
                },
        },
    },
    "whatsapp": {
    "display_name": "WhatsApp",
    "trusted_sender_id": True,
    "fields": [
        {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
        {"key": "phone_number_id", "label": "Phone Number ID", "type": "text", "required": True},
        {"key": "verify_token", "label": "Webhook Verify Token", "type": "text", "required": True},
    ],
    "inbound_map": {
        "sender_id_path": "entry.0.changes.0.value.messages.0.from",
        "text_path": "entry.0.changes.0.value.messages.0.text.body",
        "display_name_path": "entry.0.changes.0.value.contacts.0.profile.name", 
    },
    "outbound": {
        "url_template": "https://graph.facebook.com/v18.0/{phone_number_id}/messages",
        "method": "POST",
        "headers_template": {"Authorization": "Bearer {access_token}"},
        "body_template": {
            "messaging_product": "whatsapp",
            "to": "{sender_id}",
            "text": {"body": "{message}"},
        },
    },
},
}