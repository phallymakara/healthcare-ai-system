import uuid
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hospital_staff
from app.models.user import User
from app.models.enums import QueueStatus
from app.schemas.queue import (
    OpenQueueSessionRequest,
    QueueSessionResponse,
    LiveQueueStatusResponse,
    TicketResponse,
    TicketActionRequest,
)
from app.services.queue_service import QueueService

router = APIRouter(prefix="/queues", tags=["Queue Operations"])


@router.post("/sessions", response_model=QueueSessionResponse, status_code=status.HTTP_200_OK)
async def open_or_get_queue_session(
    data: OpenQueueSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Open or get today's active queue session for a hospital department or doctor counter"""
    return await QueueService.get_or_create_queue_session(
        db,
        hospital_id=data.hospital_id,
        department_id=data.department_id,
        doctor_id=data.doctor_id,
        branch_id=data.branch_id,
    )


@router.get("/{session_id}", response_model=LiveQueueStatusResponse)
async def get_live_queue_status(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get live queue snapshot (currently serving number, waiting list, wait times)"""
    return await QueueService.get_live_queue_snapshot(db, queue_session_id=session_id)


@router.post("/{session_id}/call-next", response_model=TicketResponse)
async def call_next_patient(
    session_id: uuid.UUID,
    action: TicketActionRequest = TicketActionRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Staff Counter Action: Call the next waiting patient in line"""
    next_ticket = await QueueService.call_next_patient(
        db,
        queue_session_id=session_id,
        staff_user=current_user,
        note=action.note,
    )
    if not next_ticket:
        return {
            "id": uuid.uuid4(),
            "ticket_number": "NONE",
            "queue_session_id": session_id,
            "hospital_id": current_user.hospital_id or uuid.uuid4(),
            "department_id": uuid.uuid4(),
            "patient_name": "No Waiting Patients",
            "ticket_source": "ONLINE",
            "status": "COMPLETED",
            "position": 0,
            "estimated_wait_minutes": 0,
            "created_at": "2026-09-01T00:00:00",
            "updated_at": "2026-09-01T00:00:00",
        }
    return TicketResponse.model_validate(next_ticket)
