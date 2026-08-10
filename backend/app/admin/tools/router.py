from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import Agent, Tool

router = APIRouter(prefix="/tools", tags=["Tools"])

class ToolCreate(BaseModel):
    name: str
    description: str
    parameters_schema: dict
    risk_tier: str  # safe, reversible, destructive
    action_type: str  # update_user_field, write_user_memory, call_webhook
    action_config: dict
    agent_name: str | None = None


class ToolUpdate(BaseModel):
    description: str | None = None
    parameters_schema: dict | None = None
    risk_tier: str | None = None
    action_type: str | None = None
    action_config: dict | None = None
    agent_name: str | None = None
    is_active: bool | None = None


@router.get("/get-tools")
def list_tools(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(Tool).all()


# ===== ADD THIS ENDPOINT =====
@router.get("/get-tool/{tool_id}")
def get_tool(tool_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.post("/create-tool")
def create_tool(body: ToolCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    existing = db.query(Tool).filter(Tool.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tool with this name already exists")

    if body.risk_tier not in ("safe", "reversible", "destructive"):
        raise HTTPException(status_code=400, detail="risk_tier must be safe, reversible, or destructive")

    if body.action_type not in ("update_user_field", "write_user_memory", "call_webhook"):
        raise HTTPException(status_code=400, detail="Invalid action_type")

    tool = Tool(**body.model_dump(), is_active=True)
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


@router.patch("/update-tool/{tool_id}")
def update_tool(tool_id: str, body: ToolUpdate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(tool, field, value)

    db.commit()
    db.refresh(tool)
    return tool


# ===== ADD THIS ENDPOINT =====
@router.patch("/toggle-active/{tool_id}")
def toggle_tool_active(tool_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    tool.is_active = not tool.is_active
    db.commit()
    db.refresh(tool)
    return tool


@router.delete("/delete-tool/{tool_id}")
def delete_tool(
    tool_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    db.delete(tool)
    db.commit()

    return {"message": "Tool deleted"}