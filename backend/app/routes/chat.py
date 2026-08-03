from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import process_chat
from app.core.database import get_db
from app.core.current_user import get_current_user_id

router = APIRouter()

@router.post('/chat', response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return process_chat(request, db, user_id)