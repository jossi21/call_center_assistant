from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.db import FeatureFlag

router = APIRouter()


admin_router = APIRouter()  # rename to `router` to match your convention if needed


class FeatureFlagOut(BaseModel):
    key: str
    enabled: bool
    description: str | None = None


class FeatureFlagUpsert(BaseModel):
    key: str
    enabled: bool
    description: str | None = None


@admin_router.get("/feature-flags", response_model=list[FeatureFlagOut])
def admin_list_feature_flags(db: Session = Depends(get_db)):
    flags = db.query(FeatureFlag).order_by(FeatureFlag.key).all()
    return [FeatureFlagOut(key=f.key, enabled=f.enabled, description=f.description) for f in flags]


@admin_router.put("/feature-flags", response_model=FeatureFlagOut)
def admin_upsert_feature_flag(payload: FeatureFlagUpsert, db: Session = Depends(get_db)):
    row = db.query(FeatureFlag).filter(FeatureFlag.key == payload.key).first()
    if row:
        row.enabled = payload.enabled
        if payload.description is not None:
            row.description = payload.description
    else:
        row = FeatureFlag(key=payload.key, enabled=payload.enabled, description=payload.description)
        db.add(row)
    db.commit()
    return payload


@admin_router.delete("/feature-flags")
def admin_delete_feature_flag(key: str, db: Session = Depends(get_db)):
    row = db.query(FeatureFlag).filter(FeatureFlag.key == key).first()
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}