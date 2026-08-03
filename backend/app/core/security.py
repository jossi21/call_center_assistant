from datetime import datetime, timedelta
from jose import jwt, JWTError

from app.core.config import settings

ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24 * 7  # 1 week — adjust based on how long a session should last


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None