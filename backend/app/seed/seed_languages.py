from app.core.database import SessionLocal
from app.models.db import Language

languages = [
    {"code": "en", "name": "English"},
    {"code": "am", "name": "Amharic"},
    {"code": "ti", "name": "Tigrinya"},
    {"code": "om", "name": "Afaan Oromoo"},
    {"code": "so", "name": "Somali"},
]

db = SessionLocal()
try:
    for l in languages:
        if db.query(Language).filter(Language.code == l["code"]).first():
            continue
        db.add(Language(**l, is_active=True))
        print(f"Seeded '{l['code']}'")
    db.commit()
finally:
    db.close()