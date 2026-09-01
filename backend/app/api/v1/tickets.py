import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_current_user, require_hospital_staff
from app.models.user import User
from app.models.queue import Ticket
from app.models.enums import TicketSource
from app.schemas.queue import (
    BookTicketRequest,
    WalkInTicketRequest,
    TicketActionRequest,
    TicketResponse,
    TicketDetailResponse,
)
from app.services.queue_service import QueueService

router = APIRouter(prefix="/tickets", tags=["Tickets & Appointments"])


@router.post("/book", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def book_ticket(
    data: BookTicketRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Remote patient ticket reservation with live queue estimation"""
    # 1. Get or create today's queue session for this department/doctor
    queue_sess = await QueueService.get_or_create_queue_session(
        db,
        hospital_id=data.hospital_id,
        department_id=data.department_id,
        doctor_id=data.doctor_id,
    )

    patient_name = data.patient_name or (current_user.full_name if current_user else "Anonymous Patient")
    patient_phone = data.patient_phone or (current_user.phone_number if current_user else None)
    patient_id = current_user.id if current_user else None

    return await QueueService.issue_ticket(
        db,
        queue_session_id=queue_sess.id,
        patient_name=patient_name,
        patient_phone=patient_phone,
        patient_id=patient_id,
        doctor_id=data.doctor_id,
        service_id=data.service_id,
        ticket_source=TicketSource.ONLINE,
    )


@router.post("/walk-in", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def issue_walk_in_ticket(
    data: WalkInTicketRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Receptionist Counter Action: Issue walk-in ticket for a physical arrival"""
    queue_sess = await QueueService.get_or_create_queue_session(
        db,
        hospital_id=data.hospital_id,
        department_id=data.department_id,
        doctor_id=data.doctor_id,
    )

    return await QueueService.issue_ticket(
        db,
        queue_session_id=queue_sess.id,
        patient_name=data.patient_name,
        patient_phone=data.patient_phone,
        patient_id=None,
        doctor_id=data.doctor_id,
        service_id=data.service_id,
        ticket_source=TicketSource.WALK_IN,
    )


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket_detail(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get live tracking detail for a specific ticket (positions ahead, wait time, logs)"""
    query = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(selectinload(Ticket.logs))
    )
    res = await db.execute(query)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return TicketDetailResponse.model_validate(ticket)


@router.post("/{ticket_id}/start", response_model=TicketResponse)
async def start_consultation(
    ticket_id: uuid.UUID,
    action: TicketActionRequest = TicketActionRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Doctor / Staff Action: Start serving patient consultation"""
    ticket = await QueueService.start_consultation(db, ticket_id=ticket_id, staff_user=current_user, note=action.note)
    return TicketResponse.model_validate(ticket)


@router.post("/{ticket_id}/complete", response_model=TicketResponse)
async def complete_consultation(
    ticket_id: uuid.UUID,
    action: TicketActionRequest = TicketActionRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Doctor / Staff Action: Mark patient consultation as completed"""
    ticket = await QueueService.complete_consultation(db, ticket_id=ticket_id, staff_user=current_user, note=action.note)
    return TicketResponse.model_validate(ticket)


@router.post("/{ticket_id}/skip", response_model=TicketResponse)
async def skip_patient(
    ticket_id: uuid.UUID,
    action: TicketActionRequest = TicketActionRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Counter Action: Skip absent patient"""
    ticket = await QueueService.skip_ticket(db, ticket_id=ticket_id, staff_user=current_user, note=action.note)
    return TicketResponse.model_validate(ticket)


@router.post("/{ticket_id}/no-show", response_model=TicketResponse)
async def mark_patient_no_show(
    ticket_id: uuid.UUID,
    action: TicketActionRequest = TicketActionRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Counter Action: Mark patient as no-show"""
    ticket = await QueueService.mark_no_show(db, ticket_id=ticket_id, staff_user=current_user, note=action.note)
    return TicketResponse.model_validate(ticket)


@router.post("/{ticket_id}/cancel", response_model=TicketResponse)
async def cancel_ticket(
    ticket_id: uuid.UUID,
    action: TicketActionRequest = TicketActionRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Patient / Staff Action: Cancel a reserved ticket"""
    ticket = await QueueService.cancel_ticket(db, ticket_id=ticket_id, user=current_user, note=action.note)
    return TicketResponse.model_validate(ticket)
