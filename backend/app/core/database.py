from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

engine = create_engine(settings.database_url)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    """
    FastAPI dependency — yields a DB session per request,
    closes it automatically when the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()