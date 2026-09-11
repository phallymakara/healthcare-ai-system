import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select, and_, or_, func, nullslast
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_hospital_staff
from app.exceptions import not_found
from app.models import (
    Hospital,
    Department,
    Service,
    Doctor,
    Ticket,
    TicketSource,
    User,
    TicketStatus,
    QueueStatus,
)
from app.schemas.partner import (
    DepartmentQueueSummary,
    HourlyFlowItem,
    PartnerDashboardMetricsResponse,
    PartnerBookingItem,
    PartnerBookingsSummary,
    PartnerBookingsResponse,
)

router = APIRouter()


@router.get("/dashboard", response_model=PartnerDashboardMetricsResponse)
async def get_partner_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Real-time operational dashboard for hospital staff & doctors"""
    hospital_id = current_user.hospital_id
    if not hospital_id:
        h_res = await db.execute(select(Hospital))
        hosp = h_res.scalars().first()
        if not hosp:
            raise not_found("No hospital registered")
        hospital_id = hosp.id

    hosp_res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hospital = hosp_res.scalar_one_or_none()
    if not hospital:
        raise not_found("Hospital")

    # Real-time queue counts
    waiting_res = await db.execute(
        select(func.count(Ticket.id)).where(
            and_(
                Ticket.hospital_id == hospital_id,
                Ticket.status == TicketStatus.WAITING,
            )
        )
    )
    waiting_count = waiting_res.scalar() or 0

    serving_res = await db.execute(
        select(func.count(Ticket.id)).where(
            and_(
                Ticket.hospital_id == hospital_id,
                Ticket.status.in_([TicketStatus.CALLED, TicketStatus.SERVING]),
            )
        )
    )
    serving_count = serving_res.scalar() or 0

    today = date.today()
    tickets_res = await db.execute(
        select(Ticket).where(
            and_(
                Ticket.hospital_id == hospital_id,
                or_(
                    func.date(Ticket.created_at) == today,
                    Ticket.appointment_date == today,
                ),
            )
        )
    )
    today_tickets = tickets_res.scalars().all()

    if not today_tickets:
        latest_date_res = await db.execute(
            select(func.date(Ticket.created_at))
            .where(Ticket.hospital_id == hospital_id)
            .order_by(func.date(Ticket.created_at).desc())
            .limit(1)
        )
        latest_date = latest_date_res.scalar()
        if latest_date:
            ref_tickets_res = await db.execute(
                select(Ticket).where(
                    and_(
                        Ticket.hospital_id == hospital_id,
                        func.date(Ticket.created_at) == latest_date,
                    )
                )
            )
            today_tickets = ref_tickets_res.scalars().all()

    total_tickets = len(today_tickets)
    completed_count = len([t for t in today_tickets if t.status == TicketStatus.COMPLETED])
    skipped_no_show = len([t for t in today_tickets if t.status in [TicketStatus.SKIPPED, TicketStatus.NO_SHOW]])
    clearance_rate = round((completed_count / max(1, total_tickets)) * 100) if total_tickets > 0 else 0

    online_bookings = len([t for t in today_tickets if t.ticket_source == TicketSource.ONLINE])
    walkin_tickets = len([t for t in today_tickets if t.ticket_source == TicketSource.WALK_IN])

    dept_count_res = await db.execute(
        select(func.count(Department.id)).where(Department.hospital_id == hospital_id)
    )
    total_departments = dept_count_res.scalar() or 0

    staff_count_res = await db.execute(
        select(func.count(User.id)).where(User.hospital_id == hospital_id)
    )
    total_staff = staff_count_res.scalar() or 0
    if total_staff == 0:
        doc_count_res = await db.execute(
            select(func.count(Doctor.id)).where(Doctor.hospital_id == hospital_id)
        )
        total_staff = doc_count_res.scalar() or 0

    service_count_res = await db.execute(
        select(func.count(Service.id)).where(Service.hospital_id == hospital_id)
    )
    total_services = service_count_res.scalar() or 0

    dept_res = await db.execute(
        select(Department)
        .where(Department.hospital_id == hospital_id)
        .options(selectinload(Department.queue_sessions))
    )
    departments = dept_res.scalars().all()

    dept_summaries: List[DepartmentQueueSummary] = []
    total_wait_minutes = 0
    total_wait_samples = 0

    for d in departments:
        today_session = next(
            (s for s in d.queue_sessions if s.session_date == today or s.status == QueueStatus.ACTIVE), None
        )
        d_waiting_res = await db.execute(
            select(func.count(Ticket.id)).where(
                and_(
                    Ticket.department_id == d.id,
                    Ticket.status == TicketStatus.WAITING,
                )
            )
        )
        d_waiting = d_waiting_res.scalar() or 0

        d_serving_res = await db.execute(
            select(Ticket.ticket_number).where(
                and_(
                    Ticket.department_id == d.id,
                    Ticket.status.in_([TicketStatus.CALLED, TicketStatus.SERVING]),
                )
            ).order_by(Ticket.updated_at.desc()).limit(1)
        )
        d_serving_num = d_serving_res.scalar() or (today_session.current_serving_number if today_session else None)
        d_completed = len([t for t in today_tickets if t.department_id == d.id and t.status == TicketStatus.COMPLETED])
        d_status = today_session.status if today_session else QueueStatus.ACTIVE
        d_avg_wait = d.avg_consultation_minutes * d_waiting

        if d_waiting > 0:
            total_wait_minutes += d_avg_wait
            total_wait_samples += 1

        dept_summaries.append(
            DepartmentQueueSummary(
                department_id=d.id,
                department_name=d.name,
                code=d.code,
                session_id=today_session.id if today_session else None,
                queue_status=d_status,
                current_serving_number=d_serving_num,
                waiting_count=d_waiting,
                completed_today=d_completed,
                avg_wait_minutes=d_avg_wait,
            )
        )

    avg_wait = int(total_wait_minutes / max(1, total_wait_samples)) if total_wait_samples > 0 else 15

    hourly_flow: List[HourlyFlowItem] = []
    for h in range(8, 19):
        hour_label = f"{h:02d}:00"
        h_count = len([
            t for t in today_tickets
            if t.created_at is not None
            and t.created_at.replace(tzinfo=None).hour == h
        ])
        hourly_flow.append(HourlyFlowItem(hour=hour_label, count=h_count))

    return PartnerDashboardMetricsResponse(
        hospital_id=hospital.id,
        hospital_name=hospital.name,
        total_tickets_today=total_tickets,
        currently_waiting=waiting_count,
        currently_serving=serving_count,
        completed_today=completed_count,
        skipped_no_show_today=skipped_no_show,
        average_wait_minutes=avg_wait,
        online_bookings_today=online_bookings,
        walkin_tickets_today=walkin_tickets,
        hourly_flow=hourly_flow,
        departments=dept_summaries,
        total_departments=total_departments,
        total_staff=total_staff,
        total_services=total_services,
        clearance_rate=clearance_rate,
    )


@router.get("/bookings", response_model=PartnerBookingsResponse)
async def get_partner_bookings(
    department_id: Optional[uuid.UUID] = None,
    doctor_id: Optional[uuid.UUID] = None,
    booking_date: Optional[str] = None,
    source: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Get customer booking slots and tickets for the hospital with filtering options."""
    hospital_id = current_user.hospital_id
    if not hospital_id:
        h_res = await db.execute(select(Hospital))
        hosp = h_res.scalars().first()
        if not hosp:
            raise not_found("No hospital registered")
        hospital_id = hosp.id

    query = (
        select(Ticket)
        .options(
            selectinload(Ticket.department),
            selectinload(Ticket.doctor),
            selectinload(Ticket.service),
        )
        .where(Ticket.hospital_id == hospital_id)
    )

    if department_id:
        query = query.where(Ticket.department_id == department_id)

    if doctor_id:
        query = query.where(Ticket.doctor_id == doctor_id)

    if booking_date:
        try:
            parsed_date = date.fromisoformat(booking_date)
            query = query.where(
                or_(
                    Ticket.appointment_date == parsed_date,
                    and_(Ticket.appointment_date.is_(None), func.date(Ticket.created_at) == parsed_date),
                )
            )
        except ValueError:
            pass

    if source:
        s_upper = source.upper()
        if s_upper == "ONLINE":
            query = query.where(Ticket.ticket_source == TicketSource.ONLINE)
        elif s_upper in ("WALK_IN", "WALKIN"):
            query = query.where(Ticket.ticket_source == TicketSource.WALK_IN)

    if status_filter:
        stat_upper = status_filter.upper()
        if stat_upper in TicketStatus.__members__:
            query = query.where(Ticket.status == TicketStatus[stat_upper])

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Ticket.ticket_number.ilike(search_term),
                Ticket.patient_name.ilike(search_term),
                Ticket.patient_phone.ilike(search_term),
            )
        )

    query = query.order_by(
        nullslast(Ticket.appointment_date.desc()),
        nullslast(Ticket.appointment_time.asc()),
        Ticket.created_at.desc(),
    )

    result = await db.execute(query)
    tickets = result.scalars().all()

    total_bookings = len(tickets)
    online_bookings = 0
    walkin_bookings = 0
    waiting_count = 0
    serving_count = 0
    completed_count = 0

    booking_items: List[PartnerBookingItem] = []
    for t in tickets:
        if t.ticket_source == TicketSource.ONLINE:
            online_bookings += 1
        elif t.ticket_source == TicketSource.WALK_IN:
            walkin_bookings += 1

        if t.status in (TicketStatus.WAITING, TicketStatus.CALLED):
            waiting_count += 1
        elif t.status == TicketStatus.SERVING:
            serving_count += 1
        elif t.status == TicketStatus.COMPLETED:
            completed_count += 1

        booking_items.append(
            PartnerBookingItem(
                id=t.id,
                ticket_number=t.ticket_number,
                patient_name=t.patient_name,
                patient_phone=t.patient_phone,
                patient_id=t.patient_id,
                ticket_source=t.ticket_source.value if hasattr(t.ticket_source, "value") else str(t.ticket_source),
                status=t.status.value if hasattr(t.status, "value") else str(t.status),
                appointment_date=t.appointment_date,
                appointment_time=t.appointment_time,
                department_id=t.department_id,
                department_name=t.department.name if t.department else None,
                department_code=t.department.code if t.department else None,
                doctor_id=t.doctor_id,
                doctor_name=t.doctor.full_name if t.doctor else None,
                doctor_specialty=t.doctor.specialty if t.doctor else None,
                service_id=t.service_id,
                service_name=t.service.name if t.service else None,
                position=t.position,
                estimated_wait_minutes=t.estimated_wait_minutes,
                created_at=t.created_at,
                serving_started_at=t.serving_started_at,
                completed_at=t.completed_at,
            )
        )

    return PartnerBookingsResponse(
        bookings=booking_items,
        summary=PartnerBookingsSummary(
            total_bookings=total_bookings,
            online_bookings=online_bookings,
            walkin_bookings=walkin_bookings,
            waiting_count=waiting_count,
            serving_count=serving_count,
            completed_count=completed_count,
        ),
    )
