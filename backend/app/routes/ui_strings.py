from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.current_user import get_current_user_id
from app.models.db import Language, User, UiString

router = APIRouter()

DEFAULT_LANGUAGE = "en"


# ---------------------------------------------------------------------
# Public: language list + UI strings (no auth -- needed on screens the
# user sees before logging in, e.g. the phone-number entry screen)
# ---------------------------------------------------------------------

class LanguageOut(BaseModel):
    code: str
    name: str


@router.get("/languages", response_model=list[LanguageOut])
def list_enabled_languages(db: Session = Depends(get_db)):
    languages = db.query(Language).filter(Language.is_active == True).all()  # noqa: E712
    return [LanguageOut(code=l.code, name=l.name) for l in languages]


class UiStringsResponse(BaseModel):
    language_code: str
    strings: dict[str, str]


@router.get("/ui-strings", response_model=UiStringsResponse)
def get_ui_strings(language_code: str = DEFAULT_LANGUAGE, db: Session = Depends(get_db)):
    """
    Every known key for `language_code`, falling back to the English value
    for anything not yet translated. Keys missing even in English are just
    absent here -- the Flutter side's t() falls back to the raw key, so a
    genuinely missing translation is visibly obvious rather than blank.
    """
    base_rows = db.query(UiString).filter(UiString.language_code == DEFAULT_LANGUAGE).all()
    merged: dict[str, str] = {row.key: row.value for row in base_rows}

    if language_code != DEFAULT_LANGUAGE:
        override_rows = db.query(UiString).filter(UiString.language_code == language_code).all()
        for row in override_rows:
            merged[row.key] = row.value

    return UiStringsResponse(language_code=language_code, strings=merged)


# ---------------------------------------------------------------------
# Profile: sync preferred_language when the user changes the app's UI
# language, so chat/voice move together with it.
# ---------------------------------------------------------------------

class SetProfileLanguageRequest(BaseModel):
    language_code: str


@router.patch("/profile/language")
def set_profile_language(
    request: SetProfileLanguageRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.preferred_language = request.language_code
    db.commit()
    return {"ok": True, "preferred_language": user.preferred_language}