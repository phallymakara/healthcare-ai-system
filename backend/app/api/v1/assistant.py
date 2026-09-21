import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, status, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_optional_current_user, get_current_user
from app.models.user import User
from app.models.chat import ChatConversation, ChatMessage
from app.services.guest_limit_service import GuestLimitService
from app.services.langchain_agent import HealthcareAgentService
from app.services.triage_assistant import TriageAssistantService
from app.schemas.assistant import (
    TriageRequest,
    TriageResponse,
    TriageHospitalMatch,
    AssistantChatRequest,
    AssistantChatResponse,
    ChatHistoryItem,
    ChatMessageResponse,
    ConversationSummaryResponse,
    ConversationDetailResponse,
    CreateConversationRequest,
    UpdateConversationRequest,
)

router = APIRouter(prefix="/assistant", tags=["AI Healthcare Assistant"])
logger = logging.getLogger(__name__)


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


@router.get("/conversations", response_model=List[ConversationSummaryResponse])
async def list_user_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all AI consultation conversations for the authenticated user, ordered by most recent activity"""
    stmt = (
        select(ChatConversation)
        .where(ChatConversation.user_id == current_user.id)
        .options(selectinload(ChatConversation.messages))
        .order_by(desc(ChatConversation.updated_at))
    )
    result = await db.execute(stmt)
    conversations = result.scalars().all()

    summaries = []
    for conv in conversations:
        msgs = conv.messages or []
        last_msg = msgs[-1].content if msgs else None
        summaries.append(
            ConversationSummaryResponse(
                id=conv.id,
                title=conv.title,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=len(msgs),
                last_message=last_msg[:120] if last_msg else None,
            )
        )
    return summaries


@router.post("/conversations", response_model=ConversationSummaryResponse, status_code=status.HTTP_201_CREATED)
async def create_user_conversation(
    data: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Explicitly start a new AI consultation thread for the authenticated user"""
    title = (data.title or "").strip() or "New Consultation"
    conv = ChatConversation(
        user_id=current_user.id,
        title=title,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    return ConversationSummaryResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=0,
        last_message=None,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_user_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a specific consultation thread and all its stored messages"""
    stmt = (
        select(ChatConversation)
        .where(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == current_user.id,
        )
        .options(selectinload(ChatConversation.messages))
    )
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    msg_responses = [
        ChatMessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            image_url=m.image_url,
            triage_data=m.triage_data,
            booked_ticket=m.booked_ticket,
            suggested_actions=m.suggested_actions,
            created_at=m.created_at,
        )
        for m in (conv.messages or [])
    ]

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=msg_responses,
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
async def delete_user_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an AI consultation thread and all related message records (cascade)"""
    stmt = select(ChatConversation).where(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    await db.delete(conv)
    await db.commit()
    return {"message": "Conversation deleted successfully"}


@router.patch("/conversations/{conversation_id}", response_model=ConversationSummaryResponse)
async def update_user_conversation(
    conversation_id: uuid.UUID,
    data: UpdateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an AI consultation thread title for the authenticated user"""
    stmt = (
        select(ChatConversation)
        .where(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == current_user.id,
        )
        .options(selectinload(ChatConversation.messages))
    )
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    clean_title = (data.title or "").strip()
    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot be empty",
        )

    conv.title = clean_title
    conv.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(conv)

    msgs = conv.messages or []
    last_msg = msgs[-1].content if msgs else None
    return ConversationSummaryResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=len(msgs),
        last_message=last_msg[:120] if last_msg else None,
    )


@router.post("/chat", response_model=AssistantChatResponse)
async def assistant_chat(
    data: AssistantChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Healthcare guidance, system search (doctors, clinics, wait times), and autonomous booking via LangChain Agent.
    Automatically persists prompt & assistant reply into the database when user is authenticated.
    """
    # Database-backed rate limit check for unauthenticated guests (7 messages/hour)
    if not current_user:
        is_allowed, _, mins_remaining = await GuestLimitService.check_and_increment(request, db)
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "GUEST_LIMIT_REACHED",
                    "message": f"Free chat limit reached (7 messages/hour). Please log in or try again in {mins_remaining} minutes.",
                    "minutes_remaining": mins_remaining,
                },
            )

    user_context = None
    if current_user:
        user_context = {
            "full_name": current_user.full_name,
            "phone_number": current_user.phone_number or "",
            "user_id": str(current_user.id),
        }

    # Find or establish conversation if user is authenticated
    active_conversation: Optional[ChatConversation] = None
    if current_user:
        if data.conversation_id:
            stmt = select(ChatConversation).where(
                ChatConversation.id == data.conversation_id,
                ChatConversation.user_id == current_user.id,
            )
            result = await db.execute(stmt)
            active_conversation = result.scalar_one_or_none()

        if not active_conversation:
            # Create a new conversation thread
            title = data.message[:45].strip() or "Health Consultation"
            active_conversation = ChatConversation(
                user_id=current_user.id,
                title=title,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(active_conversation)
            await db.flush()

        # Save user message to database
        user_db_msg = ChatMessage(
            conversation_id=active_conversation.id,
            role="user",
            content=data.message,
            image_url=data.image_url,
            created_at=datetime.utcnow(),
        )
        db.add(user_db_msg)
        await db.flush()

    # Determine conversational history for LLM
    history_payload = data.history or []

    agent_result = await HealthcareAgentService.run_agent(
        message=data.message,
        history=history_payload,
        db=db,
        user_context=user_context,
        language=data.language or "en",
        user_latitude=data.user_latitude,
        user_longitude=data.user_longitude,
    )

    matching_objs = []
    for m in agent_result.get("matching_hospitals", []):
        try:
            matching_objs.append(TriageHospitalMatch(**m))
        except Exception:
            pass

    # If authenticated, persist assistant message and update conversation timestamp
    if current_user and active_conversation:
        assistant_db_msg = ChatMessage(
            conversation_id=active_conversation.id,
            role="assistant",
            content=agent_result["reply"],
            triage_data={
                "urgency_level": agent_result.get("urgency_level"),
                "recommended_specialty": agent_result.get("recommended_specialty"),
                "matching_hospitals": agent_result.get("matching_hospitals", []),
            } if agent_result.get("matching_hospitals") else None,
            booked_ticket=agent_result.get("booked_ticket"),
            suggested_actions=agent_result.get("suggested_actions", []),
            created_at=datetime.utcnow(),
        )
        db.add(assistant_db_msg)
        active_conversation.updated_at = datetime.utcnow()
        await db.commit()

    return AssistantChatResponse(
        reply=agent_result["reply"],
        booked_ticket=agent_result.get("booked_ticket"),
        matching_hospitals=matching_objs,
        suggested_actions=agent_result.get("suggested_actions", []),
        detected_language=agent_result.get("detected_language", "en"),
        conversation_id=active_conversation.id if active_conversation else None,
    )


@router.post("/chat/stream", summary="Real-time end-to-end streaming AI conversation response")
async def chat_assistant_stream(
    data: AssistantChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Healthcare guidance with end-to-end token streaming via Server-Sent Events (SSE).
    Persists user message upfront and saves completed assistant message upon stream finish.
    """
    # Database-backed rate limit check for unauthenticated guests (7 messages/hour)
    if not current_user:
        is_allowed, _, mins_remaining = await GuestLimitService.check_and_increment(request, db)
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "GUEST_LIMIT_REACHED",
                    "message": f"Free chat limit reached (7 messages/hour). Please log in or try again in {mins_remaining} minutes.",
                    "minutes_remaining": mins_remaining,
                },
            )

    user_context = None
    if current_user:
        user_context = {
            "full_name": current_user.full_name,
            "phone_number": current_user.phone_number or "",
            "user_id": str(current_user.id),
        }

    # Find or establish conversation if user is authenticated
    active_conversation: Optional[ChatConversation] = None
    if current_user:
        if data.conversation_id:
            stmt = select(ChatConversation).where(
                ChatConversation.id == data.conversation_id,
                ChatConversation.user_id == current_user.id,
            )
            result = await db.execute(stmt)
            active_conversation = result.scalar_one_or_none()

        if not active_conversation:
            title = data.message[:45].strip() or "Health Consultation"
            active_conversation = ChatConversation(
                user_id=current_user.id,
                title=title,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(active_conversation)
            await db.flush()

        # Save user message to database immediately
        user_db_msg = ChatMessage(
            conversation_id=active_conversation.id,
            role="user",
            content=data.message,
            image_url=data.image_url,
            created_at=datetime.utcnow(),
        )
        db.add(user_db_msg)
        await db.commit()

    history_payload = data.history or []

    async def event_generator():
        full_reply = ""
        final_meta = None
        try:
            async for chunk in HealthcareAgentService.stream_agent(
                message=data.message,
                history=history_payload,
                db=db,
                user_context=user_context,
                language=data.language or "en",
                user_latitude=data.user_latitude,
                user_longitude=data.user_longitude,
            ):
                chunk_type = chunk.get("type")
                if chunk_type == "token":
                    delta = chunk.get("delta", "")
                    full_reply += delta
                    payload = json.dumps({"delta": delta})
                    yield f"event: token\ndata: {payload}\n\n"
                elif chunk_type == "metadata":
                    final_meta = chunk

            # Persist assistant reply to database
            if current_user and active_conversation:
                assistant_text = final_meta.get("reply", full_reply) if final_meta else full_reply
                matching_hosp = final_meta.get("matching_hospitals", []) if final_meta else []
                assistant_db_msg = ChatMessage(
                    conversation_id=active_conversation.id,
                    role="assistant",
                    content=assistant_text,
                    triage_data={
                        "urgency_level": final_meta.get("urgency_level") if final_meta else None,
                        "recommended_specialty": final_meta.get("recommended_specialty") if final_meta else None,
                        "matching_hospitals": matching_hosp,
                    } if matching_hosp else None,
                    booked_ticket=final_meta.get("booked_ticket") if final_meta else None,
                    suggested_actions=final_meta.get("suggested_actions", []) if final_meta else [],
                    created_at=datetime.utcnow(),
                )
                db.add(assistant_db_msg)
                active_conversation.updated_at = datetime.utcnow()
                await db.commit()

            # Emit metadata event
            meta_payload = {
                "conversation_id": str(active_conversation.id) if active_conversation else None,
                "reply": final_meta.get("reply", full_reply) if final_meta else full_reply,
                "matching_hospitals": final_meta.get("matching_hospitals", []) if final_meta else [],
                "suggested_actions": final_meta.get("suggested_actions", []) if final_meta else [],
                "detected_language": final_meta.get("detected_language", "en") if final_meta else "en",
            }
            yield f"event: metadata\ndata: {json.dumps(meta_payload)}\n\n"
            yield "event: done\ndata: {}\n\n"

        except Exception as err:
            logger.error(f"Error in streaming event generator: {err}")
            yield f"event: error\ndata: {json.dumps({'error': str(err)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
