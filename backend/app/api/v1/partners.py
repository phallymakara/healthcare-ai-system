import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hospital_staff
from app.core.security import get_password_hash
from app.models import (
    Hospital,
    HospitalBranch,
    Department,
    Service,
    Doctor,
    DoctorSchedule,
    QueueSession,
    Ticket,
    User,
    UserRole,
    TicketStatus,
    QueueStatus,
)
from app.schemas.partner import (
    DepartmentCreateSchema,
    DepartmentResponse,
    ServiceCreateSchema,
    ServiceResponse,
    DoctorCreateSchema,
    DoctorResponse,
    DoctorScheduleSchema,
    DoctorScheduleResponse,
    DepartmentQueueSummary,
    PartnerDashboardMetricsResponse,
)

router = APIRouter(prefix="/partners", tags=["Hospital & Clinic Partner Platform"])


@router.get("/dashboard", response_model=PartnerDashboardMetricsResponse)
async def get_partner_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Real-time operational dashboard for hospital staff & doctors"""
    # 1. Resolve Hospital ID (if super admin, use first seeded hospital or their assigned one)
    hospital_id = current_user.hospital_id
    if not hospital_id:
        h_res = await db.execute(select(Hospital))
        hosp = h_res.scalars().first()
        if not hosp:
            raise HTTPException(status_code=404, detail="No hospital registered")
        hospital_id = hosp.id

    hosp_res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hospital = hosp_res.scalar_one()

    # 2. Get today's tickets for this hospital
    today = date.today()
    tickets_res = await db.execute(
        select(Ticket).where(
            and_(
                Ticket.hospital_id == hospital_id,
                func.date(Ticket.created_at) == today,
            )
        )
    )
    today_tickets = tickets_res.scalars().all()

    total_tickets = len(today_tickets)
    waiting_count = len([t for t in today_tickets if t.status == TicketStatus.WAITING])
    serving_count = len([t for t in today_tickets if t.status in [TicketStatus.CALLED, TicketStatus.SERVING]])
    completed_count = len([t for t in today_tickets if t.status == TicketStatus.COMPLETED])
    skipped_no_show = len([t for t in today_tickets if t.status in [TicketStatus.SKIPPED, TicketStatus.NO_SHOW]])

    # 3. Get all departments & their active queue sessions
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
        # Find today's session
        today_session = next(
            (s for s in d.queue_sessions if s.session_date == today), None
        )
        d_tickets = [t for t in today_tickets if t.department_id == d.id]
        d_waiting = len([t for t in d_tickets if t.status == TicketStatus.WAITING])
        d_completed = len([t for t in d_tickets if t.status == TicketStatus.COMPLETED])
        d_serving_num = today_session.current_serving_number if today_session else None
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

    return PartnerDashboardMetricsResponse(
        hospital_id=hospital.id,
        hospital_name=hospital.name,
        total_tickets_today=total_tickets,
        currently_waiting=waiting_count,
        currently_serving=serving_count,
        completed_today=completed_count,
        skipped_no_show_today=skipped_no_show,
        average_wait_minutes=avg_wait,
        departments=dept_summaries,
    )


# --- Departments ---

@router.get("/departments", response_model=List[DepartmentResponse])
async def list_partner_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Department).where(Department.hospital_id == hospital_id).order_by(Department.name.asc())
    )
    return res.scalars().all()


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_partner_department(
    data: DepartmentCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    dept = Department(
        id=uuid.uuid4(),
        hospital_id=hospital_id,
        branch_id=data.branch_id,
        name=data.name.strip(),
        code=data.code.strip().upper(),
        description=data.description,
        floor_room=data.floor_room,
        avg_consultation_minutes=data.avg_consultation_minutes,
        is_active=True,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


# --- Services ---

@router.get("/services", response_model=List[ServiceResponse])
async def list_partner_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Service).where(Service.hospital_id == hospital_id).order_by(Service.name.asc())
    )
    return res.scalars().all()


@router.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_partner_service(
    data: ServiceCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    srv = Service(
        id=uuid.uuid4(),
        hospital_id=hospital_id,
        department_id=data.department_id,
        name=data.name.strip(),
        description=data.description,
        duration_minutes=data.duration_minutes,
        price=data.price,
        is_active=True,
    )
    db.add(srv)
    await db.commit()
    await db.refresh(srv)
    return srv


# --- Doctors & Schedules ---

@router.get("/doctors", response_model=List[DoctorResponse])
async def list_partner_doctors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor)
        .where(Doctor.hospital_id == hospital_id)
        .options(selectinload(Doctor.schedules))
        .order_by(Doctor.full_name.asc())
    )
    return res.scalars().all()


@router.post("/doctors", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_partner_doctor(
    data: DoctorCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()

    user_id = None
    if data.email and data.password:
        doc_user = User(
            id=uuid.uuid4(),
            email=data.email.strip().lower(),
            phone_number=data.phone,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name.strip(),
            role=UserRole.DOCTOR,
            hospital_id=hospital_id,
            branch_id=data.branch_id,
            is_active=True,
            is_verified=True,
        )
        db.add(doc_user)
        await db.flush()
        user_id = doc_user.id

    doc = Doctor(
        id=uuid.uuid4(),
        user_id=user_id,
        hospital_id=hospital_id,
        branch_id=data.branch_id,
        department_id=data.department_id,
        full_name=data.full_name.strip(),
        specialty=data.specialty.strip(),
        license_number=data.license_number,
        bio=data.bio,
        photo_url=data.photo_url,
        room_number=data.room_number,
        avg_consultation_minutes=data.avg_consultation_minutes,
        is_available=True,
        is_active=True,
    )
    db.add(doc)
    await db.commit()

    # Reload with schedules
    res = await db.execute(
        select(Doctor).where(Doctor.id == doc.id).options(selectinload(Doctor.schedules))
    )
    return res.scalar_one()


@router.post("/doctors/{doctor_id}/schedules", response_model=DoctorScheduleResponse, status_code=status.HTTP_201_CREATED)
async def add_doctor_schedule(
    doctor_id: uuid.UUID,
    data: DoctorScheduleSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    sched = DoctorSchedule(
        id=uuid.uuid4(),
        doctor_id=doctor_id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        max_patients_per_slot=data.max_patients_per_slot,
        is_active=data.is_active,
    )
    db.add(sched)
    await db.commit()
    await db.refresh(sched)
    return sched
