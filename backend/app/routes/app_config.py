from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db import FeatureFlag

router = APIRouter()


@router.get("/app-config")
def get_app_config(db: Session = Depends(get_db)):
    """
    Returns every flag as {key: enabled_bool}. The mobile app fetches this
    once at startup (alongside /languages and /ui-strings) and gates
    features behind it -- e.g. hide the language picker entirely if
    "language_switcher" is off, without a store update.

    A key that doesn't exist yet in the table is simply absent from the
    response -- the Flutter side should default missing keys to whatever
    is safe (usually `false` for a new/unreleased feature, `true` for an
    existing one you're just now wrapping in a flag).
    """
    flags = db.query(FeatureFlag).all()
    return {f.key: f.enabled for f in flags}

