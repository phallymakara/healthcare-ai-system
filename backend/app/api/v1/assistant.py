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

from typing import Optional
from app.core.deps import get_optional_current_user
from app.models.user import User
from app.services.langchain_agent import HealthcareAgentService
from app.schemas.assistant import TriageHospitalMatch

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
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Healthcare guidance, system search (doctors, clinics, wait times), and autonomous booking via LangChain Agent"""
    user_context = None
    if current_user:
        user_context = {
            "full_name": current_user.full_name,
            "phone_number": current_user.phone_number or "",
            "user_id": str(current_user.id),
        }

    agent_result = await HealthcareAgentService.run_agent(
        message=data.message,
        history=data.history or [],
        db=db,
        user_context=user_context,
        language=data.language or "en",
    )

    matching_objs = []
    for m in agent_result.get("matching_hospitals", []):
        try:
            matching_objs.append(TriageHospitalMatch(**m))
        except Exception:
            pass

    return AssistantChatResponse(
        reply=agent_result["reply"],
        booked_ticket=agent_result.get("booked_ticket"),
        matching_hospitals=matching_objs,
        suggested_actions=agent_result.get("suggested_actions", []),
    )
