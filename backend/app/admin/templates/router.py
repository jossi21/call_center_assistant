from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import ReplyTemplate

router = APIRouter(prefix="/templates", tags=["Reply Templates"])


class TemplateCreate(BaseModel):
    title: str
    body: str
    category: str | None = None


class TemplateUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    category: str | None = None
    is_active: bool | None = None


@router.get("/get-templates")
def list_templates(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(ReplyTemplate).order_by(ReplyTemplate.created_at.desc()).all()


@router.post("/create-template")
def create_template(body: TemplateCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    template = ReplyTemplate(title=body.title, body=body.body, category=body.category)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.patch("/update-template/{template_id}")
def update_template(template_id: str, body: TemplateUpdate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    template = db.query(ReplyTemplate).filter(ReplyTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/delete-template/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    template = db.query(ReplyTemplate).filter(ReplyTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}