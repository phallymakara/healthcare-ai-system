import re
import uuid
from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_current_user, require_hospital_staff
from app.models.user import User
from app.models.queue import Ticket, TicketLog
from app.models.enums import TicketSource, TicketStatus
from app.schemas.queue import (
    BookTicketRequest,
    WalkInTicketRequest,
    TicketActionRequest,
    TicketResponse,
    TicketDetailResponse,
    SlotAvailabilityItem,
    SlotsAvailabilityResponse,
)
from app.services.queue_service import QueueService

DEFAULT_TIME_SLOTS = [
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:30 PM - 02:30 PM',
    '02:30 PM - 03:30 PM',
    '03:30 PM - 04:30 PM',
    '04:30 PM - 05:30 PM',
]


def parse_time_to_minutes(time_str: Optional[str]) -> Optional[int]:
    """Parses time strings like '09:30 AM', '10:49 AM', '14:30' into minutes from midnight."""
    if not time_str:
        return None
    cleaned = time_str.strip().upper().replace("\u202f", " ").replace("\u00a0", " ")
    m = re.match(r"^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$", cleaned)
    if not m:
        return None
    hours = int(m.group(1))
    minutes = int(m.group(2))
    ampm = m.group(3)
    if ampm == "PM" and hours < 12:
        hours += 12
    elif ampm == "AM" and hours == 12:
        hours = 0
    return hours * 60 + minutes


def match_slot_for_time(time_str: Optional[str]) -> Optional[str]:
    """Finds which standard time slot (e.g. '09:00 AM - 10:00 AM') a given time string belongs to."""
    if not time_str:
        return None
    cleaned = re.sub(r"\s+", " ", time_str.strip().upper().replace("\u202f", " ").replace("\u00a0", " "))
    for s in DEFAULT_TIME_SLOTS:
        if s.upper() == cleaned:
            return s
    check_time = cleaned.split(" - ")[0].strip() if " - " in cleaned else cleaned
    t_min = parse_time_to_minutes(check_time)
    if t_min is not None:
        for s in DEFAULT_TIME_SLOTS:
            parts = s.split(" - ")
            s_start = parse_time_to_minutes(parts[0])
            s_end = parse_time_to_minutes(parts[1])
            if s_start is not None and s_end is not None and s_start <= t_min < s_end:
                return s
    return None


router = APIRouter(prefix="/tickets", tags=["Tickets & Appointments"])


@router.get("/slots/availability", response_model=SlotsAvailabilityResponse)
async def get_slots_availability(
    hospital_id: uuid.UUID,
    date: str,
    department_id: Optional[uuid.UUID] = None,
    doctor_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Get real-time booking availability for all appointment time slots on a given date.
    Returns which slots are available vs already booked.
    """
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    query = select(Ticket).where(
        Ticket.hospital_id == hospital_id,
        or_(
            Ticket.appointment_date == parsed_date,
            and_(Ticket.appointment_date.is_(None), func.date(Ticket.created_at) == parsed_date),
        ),
        Ticket.status.notin_([TicketStatus.CANCELLED, TicketStatus.SKIPPED, TicketStatus.NO_SHOW]),
    )
    if department_id:
        query = query.where(Ticket.department_id == department_id)
    if doctor_id:
        query = query.where(Ticket.doctor_id == doctor_id)

    res = await db.execute(query)
    booked_tickets = res.scalars().all()

    # Tally bookings per standard slot string
    booked_counts: dict[str, int] = {}
    for t in booked_tickets:
        raw_time = t.appointment_time
        if not raw_time and t.created_at:
            local_time = t.created_at + timedelta(hours=7)
            raw_time = local_time.strftime("%I:%M %p")

        matched_slot = match_slot_for_time(raw_time)
        if matched_slot:
            booked_counts[matched_slot] = booked_counts.get(matched_slot, 0) + 1

    slot_items: List[SlotAvailabilityItem] = []
    total_slots = len(DEFAULT_TIME_SLOTS)
    available_slots_count = 0
    booked_slots_count = 0

    for slot in DEFAULT_TIME_SLOTS:
        count = booked_counts.get(slot, 0)
        max_cap = 1
        is_booked = count >= max_cap
        if is_booked:
            booked_slots_count += 1
        else:
            available_slots_count += 1

        slot_items.append(
            SlotAvailabilityItem(
                slot=slot,
                is_booked=is_booked,
                booked_count=count,
                max_capacity=max_cap,
                available_spots=max(0, max_cap - count),
            )
        )

    return SlotsAvailabilityResponse(
        date=date,
        hospital_id=hospital_id,
        department_id=department_id,
        doctor_id=doctor_id,
        total_slots=total_slots,
        available_slots=available_slots_count,
        booked_slots=booked_slots_count,
        slots=slot_items,
    )


@router.post("/book", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def book_ticket(
    data: BookTicketRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Remote patient ticket reservation with live queue estimation"""
    # Verify slot is not already booked
    if data.appointment_date and data.appointment_time:
        target_slot = match_slot_for_time(data.appointment_time) or data.appointment_time.strip()
        chk_query = select(Ticket).where(
            Ticket.hospital_id == data.hospital_id,
            or_(
                Ticket.appointment_date == data.appointment_date,
                and_(Ticket.appointment_date.is_(None), func.date(Ticket.created_at) == data.appointment_date),
            ),
            Ticket.status.notin_([TicketStatus.CANCELLED, TicketStatus.SKIPPED, TicketStatus.NO_SHOW]),
        )
        if data.department_id:
            chk_query = chk_query.where(Ticket.department_id == data.department_id)
        if data.doctor_id:
            chk_query = chk_query.where(Ticket.doctor_id == data.doctor_id)

        chk_res = await db.execute(chk_query)
        existing_tickets = chk_res.scalars().all()
        for et in existing_tickets:
            raw_time = et.appointment_time
            if not raw_time and et.created_at:
                local_time = et.created_at + timedelta(hours=7)
                raw_time = local_time.strftime("%I:%M %p")
            et_slot = match_slot_for_time(raw_time) or (raw_time.strip() if raw_time else None)
            if et_slot and et_slot.upper() == target_slot.upper():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This time slot has already been booked. Please choose an available time slot.",
                )

    # 1. Get or create queue session for this department/doctor on the appointment date (or today)
    queue_sess = await QueueService.get_or_create_queue_session(
        db,
        hospital_id=data.hospital_id,
        department_id=data.department_id,
        doctor_id=data.doctor_id,
        session_date=data.appointment_date,
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
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
    )


@router.post("/walk-in", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def issue_walk_in_ticket(
    data: WalkInTicketRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Receptionist Counter Action: Issue walk-in ticket for a physical arrival"""
    # Verify slot is not already booked if a specific slot time was provided
    if data.appointment_date and data.appointment_time:
        target_slot = match_slot_for_time(data.appointment_time) or data.appointment_time.strip()
        chk_query = select(Ticket).where(
            Ticket.hospital_id == data.hospital_id,
            or_(
                Ticket.appointment_date == data.appointment_date,
                and_(Ticket.appointment_date.is_(None), func.date(Ticket.created_at) == data.appointment_date),
            ),
            Ticket.status.notin_([TicketStatus.CANCELLED, TicketStatus.SKIPPED, TicketStatus.NO_SHOW]),
        )
        if data.department_id:
            chk_query = chk_query.where(Ticket.department_id == data.department_id)
        if data.doctor_id:
            chk_query = chk_query.where(Ticket.doctor_id == data.doctor_id)

        chk_res = await db.execute(chk_query)
        existing_tickets = chk_res.scalars().all()
        for et in existing_tickets:
            raw_time = et.appointment_time
            if not raw_time and et.created_at:
                local_time = et.created_at + timedelta(hours=7)
                raw_time = local_time.strftime("%I:%M %p")
            et_slot = match_slot_for_time(raw_time) or (raw_time.strip() if raw_time else None)
            if et_slot and et_slot.upper() == target_slot.upper():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This time slot has already been booked. Please choose an available time slot.",
                )

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
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
    )


def _enrich_ticket_detail(ticket: Ticket) -> TicketDetailResponse:
    resp = TicketDetailResponse.model_validate(ticket)
    if ticket.hospital:
        resp.hospital_name = ticket.hospital.name
        resp.hospital_logo_url = ticket.hospital.logo_url
        resp.hospital_address = ticket.hospital.address
        resp.hospital_phone = ticket.hospital.phone
        resp.hospital_latitude = ticket.hospital.latitude
        resp.hospital_longitude = ticket.hospital.longitude
    if ticket.department:
        resp.department_name = ticket.department.name
        resp.department_floor_room = ticket.department.floor_room
    if ticket.doctor:
        resp.doctor_name = ticket.doctor.full_name
        resp.doctor_specialty = ticket.doctor.specialty
        resp.doctor_photo_url = ticket.doctor.photo_url
        resp.room_number = ticket.doctor.room_number
    if ticket.service:
        resp.service_name = ticket.service.name
    return resp


@router.get("/lookup/{identifier}", response_model=TicketDetailResponse)
async def lookup_ticket(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Lookup appointment ticket by ticket number (e.g. CARD-001 or TK-123) or UUID"""
    clean_id = identifier.strip()
    query = (
        select(Ticket)
        .options(
            selectinload(Ticket.logs),
            selectinload(Ticket.hospital),
            selectinload(Ticket.department),
            selectinload(Ticket.doctor),
            selectinload(Ticket.service),
        )
    )
    try:
        val_uuid = uuid.UUID(clean_id)
        query = query.where(or_(Ticket.id == val_uuid, func.lower(Ticket.ticket_number) == clean_id.lower()))
    except ValueError:
        query = query.where(func.lower(Ticket.ticket_number) == clean_id.lower())

    res = await db.execute(query)
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment ticket not found")
    return _enrich_ticket_detail(ticket)


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket_detail(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get live tracking detail for a specific ticket (positions ahead, wait time, logs)"""
    query = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(
            selectinload(Ticket.logs),
            selectinload(Ticket.hospital),
            selectinload(Ticket.department),
            selectinload(Ticket.doctor),
            selectinload(Ticket.service),
        )
    )
    res = await db.execute(query)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return _enrich_ticket_detail(ticket)


@router.post("/{ticket_id}/check-in", response_model=TicketDetailResponse)
async def patient_check_in(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Patient on-site arrival check-in"""
    query = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(
            selectinload(Ticket.logs),
            selectinload(Ticket.hospital),
            selectinload(Ticket.department),
            selectinload(Ticket.doctor),
            selectinload(Ticket.service),
        )
    )
    res = await db.execute(query)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    log = TicketLog(
        ticket_id=ticket.id,
        from_status=ticket.status,
        to_status=ticket.status,
        note="Patient confirmed on-site arrival",
    )
    db.add(log)
    ticket.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ticket)
    return _enrich_ticket_detail(ticket)


@router.post("/{ticket_id}/cancel-booking", response_model=TicketDetailResponse)
async def cancel_scheduled_booking(
    ticket_id: uuid.UUID,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Patient self-cancellation for scheduled booking with immediate slot release"""
    query = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(
            selectinload(Ticket.logs),
            selectinload(Ticket.hospital),
            selectinload(Ticket.department),
            selectinload(Ticket.doctor),
            selectinload(Ticket.service),
        )
    )
    res = await db.execute(query)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    old_status = ticket.status
    ticket.status = TicketStatus.CANCELLED
    ticket.updated_at = datetime.utcnow()
    log = TicketLog(
        ticket_id=ticket.id,
        from_status=old_status,
        to_status=TicketStatus.CANCELLED,
        note=f"Cancelled by patient: {reason or 'Schedule conflict'}",
    )
    db.add(log)
    await db.commit()
    await db.refresh(ticket)
    return _enrich_ticket_detail(ticket)


@router.post("/{ticket_id}/call", response_model=TicketResponse)
async def call_specific_patient(
    ticket_id: uuid.UUID,
    action: TicketActionRequest = TicketActionRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Staff Counter Action: Call a specific patient to the consultation counter"""
    ticket = await QueueService.call_specific_ticket(db, ticket_id=ticket_id, staff_user=current_user, note=action.note)
    return TicketResponse.model_validate(ticket)


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


@router.post("/{ticket_id}/recall", response_model=TicketResponse)
async def recall_skipped_patient(
    ticket_id: uuid.UUID,
    action: TicketActionRequest = TicketActionRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Counter Action: Recall previously skipped patient back to active consultation"""
    ticket = await QueueService.recall_ticket(db, ticket_id=ticket_id, staff_user=current_user, note=action.note)
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
