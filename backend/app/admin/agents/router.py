from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.current_user import require_admin
from app.models.db import Agent

router = APIRouter(prefix="/agents", tags=["Agents"])


class AgentCreate(BaseModel):
    name: str
    display_name: str
    description: str
    system_prompt: str


class AgentUpdate(BaseModel):
    display_name: str | None = None
    description: str | None = None
    system_prompt: str | None = None
    is_active: bool | None = None


@router.get("/get-agents")
def list_agents(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(Agent).all()


@router.post("/create-agent")
def create_agent(body: AgentCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    existing = db.query(Agent).filter(Agent.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Agent with this name already exists")

    agent = Agent(**body.model_dump(), is_active=True)
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/get-agent/{agent_id}")
def get_agent(agent_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/update-agent/{agent_id}")
def update_agent(agent_id: str, body: AgentUpdate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)

    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/delete-agent/{agent_id}")
def delete_agent(agent_id: str, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Perform hard delete: remove the agent row from the database
    db.delete(agent)
    db.commit()
    return {"message": "Agent deleted"}