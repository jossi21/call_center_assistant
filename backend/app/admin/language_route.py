from app.models.db import Language
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import Agent

router = APIRouter(prefix="/admin", tags=["admin"])

class LanguageCreate(BaseModel):
    code: str
    name: str


class LanguageUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


@router.get("/languages")
def list_languages(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(Language).all()


@router.post("/languages")
def create_language(body: LanguageCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    existing = db.query(Language).filter(Language.code == body.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Language with this code already exists")

    language = Language(**body.model_dump(), is_active=True)
    db.add(language)
    db.commit()
    db.refresh(language)
    return language


@router.patch("/languages/{language_id}")
def update_language(language_id: str, body: LanguageUpdate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(language, field, value)

    db.commit()
    db.refresh(language)
    return language


@router.delete("/languages/{language_id}")
def delete_language(language_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    language.is_active = False  # soft delete, same pattern as agents
    db.commit()
    return {"message": "Language deactivated"}