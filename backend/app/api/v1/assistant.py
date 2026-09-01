from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.assistant import (
    TriageRequest,
    TriageResponse,
    AssistantChatRequest,
    AssistantChatResponse,
)
from app.services.triage_assistant import TriageAssistantService

router = APIRouter(prefix="/assistant", tags=["AI Healthcare Assistant"])


@router.post("/triage", response_model=TriageResponse)
async def triage_symptoms(
    data: TriageRequest,
    db: AsyncSession = Depends(get_db),
):
    """Analyze patient symptoms, determine medical urgency, and find shortest-wait clinic matches"""
    if not data.symptoms or len(data.symptoms.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a more detailed symptom description.",
        )
    return await TriageAssistantService.analyze_symptoms(data, db)


@router.post("/chat", response_model=AssistantChatResponse)
async def assistant_chat(
    data: AssistantChatRequest,
):
    """Healthcare guidance, queue inquiries, and platform assistance"""
    return TriageAssistantService.get_chat_reply(data.message)
