import uuid
import secrets
import string
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File
from sqlalchemy import select, and_, or_, func, delete, nullslast, nullsfirst
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hospital_staff
from app.core.security import get_password_hash
from app.services.azure_storage import azure_storage_service
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationChannel, NotificationType
from app.models import (
    Hospital,
    HospitalBranch,
    Department,
    Service,
    Doctor,
    DoctorSchedule,
    QueueSession,
    Ticket,
    TicketSource,
    User,
    UserRole,
    TicketStatus,
    QueueStatus,
)
from app.schemas.partner import (
    DepartmentCreateSchema,
    DepartmentUpdateSchema,
    DepartmentResponse,
    ServiceCreateSchema,
    ServiceUpdateSchema,
    ServiceResponse,
    DoctorCreateSchema,
    DoctorUpdateSchema,
    DoctorResponse,
    DoctorScheduleSchema,
    DoctorScheduleResponse,
    DoctorSchedulesBatchUpdateSchema,
    DepartmentQueueSummary,
    HourlyFlowItem,
    PartnerDashboardMetricsResponse,
    StaffCreateSchema,
    StaffUpdateSchema,
    StaffResponse,
    HospitalProfileResponse,
    HospitalProfileUpdateSchema,
    PartnerBookingItem,
    PartnerBookingsSummary,
    PartnerBookingsResponse,
    AssetUploadResponse,
    AssetMetadataResponse,
    AssetDeleteResponse,
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
    hospital = hosp_res.scalar_one_or_none()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # 2. Get real-time queue counts across all active tickets for this hospital
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

    # 3. Get operational ticket batch for today (or fallback to latest operational date)
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

    # 4. Resource counts (Departments, Staff & Doctors, Services)
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

    # 5. Get all departments & their active queue status
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

    # Hourly flow for hours 08:00 to 18:00
    hourly_flow: List[HourlyFlowItem] = []
    for h in range(8, 19):
        hour_label = f"{h:02d}:00"
        # Normalize timezone-aware datetimes to naive before reading .hour
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
        code=data.code.strip().upper() if data.code else (data.name.strip()[:4].upper()),
        description=data.description,
        floor_room=data.floor_room,
        avg_consultation_minutes=data.avg_consultation_minutes,
        is_active=True,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_partner_department(
    department_id: uuid.UUID,
    data: DepartmentUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Department).where(
            and_(
                Department.id == department_id,
                Department.hospital_id == hospital_id,
            )
        )
    )
    dept = res.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if data.name is not None:
        dept.name = data.name.strip()
    if data.code is not None:
        dept.code = data.code.strip().upper()
    if data.description is not None:
        dept.description = data.description
    if data.floor_room is not None:
        dept.floor_room = data.floor_room
    if data.avg_consultation_minutes is not None:
        dept.avg_consultation_minutes = data.avg_consultation_minutes
    if data.is_active is not None:
        dept.is_active = data.is_active

    await db.commit()
    await db.refresh(dept)
    return dept


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner_department(
    department_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Department).where(
            and_(
                Department.id == department_id,
                Department.hospital_id == hospital_id,
            )
        )
    )
    dept = res.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    await db.delete(dept)
    await db.commit()
    return None


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


@router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_partner_service(
    service_id: uuid.UUID,
    data: ServiceUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Service).where(
            and_(
                Service.id == service_id,
                Service.hospital_id == hospital_id,
            )
        )
    )
    srv = res.scalar_one_or_none()
    if not srv:
        raise HTTPException(status_code=404, detail="Service not found")

    if data.department_id is not None:
        srv.department_id = data.department_id
    if data.name is not None:
        srv.name = data.name.strip()
    if data.description is not None:
        srv.description = data.description
    if data.duration_minutes is not None:
        srv.duration_minutes = data.duration_minutes
    if data.price is not None:
        srv.price = data.price
    if data.is_active is not None:
        srv.is_active = data.is_active

    await db.commit()
    await db.refresh(srv)
    return srv


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner_service(
    service_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Service).where(
            and_(
                Service.id == service_id,
                Service.hospital_id == hospital_id,
            )
        )
    )
    srv = res.scalar_one_or_none()
    if not srv:
        raise HTTPException(status_code=404, detail="Service not found")

    await db.delete(srv)
    await db.commit()
    return None


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


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_partner_doctor(
    doctor_id: uuid.UUID,
    data: DoctorUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor)
        .where(and_(Doctor.id == doctor_id, Doctor.hospital_id == hospital_id))
        .options(selectinload(Doctor.schedules))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if data.department_id is not None:
        doc.department_id = data.department_id
    if data.full_name is not None:
        doc.full_name = data.full_name.strip()
    if data.specialty is not None:
        doc.specialty = data.specialty.strip()
    if data.license_number is not None:
        doc.license_number = data.license_number
    if data.bio is not None:
        doc.bio = data.bio
    if data.photo_url is not None:
        doc.photo_url = data.photo_url
    if data.room_number is not None:
        doc.room_number = data.room_number
    if data.avg_consultation_minutes is not None:
        doc.avg_consultation_minutes = data.avg_consultation_minutes
    if data.is_available is not None:
        doc.is_available = data.is_available
    if data.is_active is not None:
        doc.is_active = data.is_active

    await db.commit()
    await db.refresh(doc)
    return doc


@router.put("/doctors/{doctor_id}/schedules", response_model=List[DoctorScheduleResponse])
async def update_doctor_schedules(
    doctor_id: uuid.UUID,
    data: DoctorSchedulesBatchUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor).where(and_(Doctor.id == doctor_id, Doctor.hospital_id == hospital_id))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Clear existing schedules for this doctor
    await db.execute(delete(DoctorSchedule).where(DoctorSchedule.doctor_id == doctor_id))

    # Add new schedules
    new_schedules: List[DoctorSchedule] = []
    for s in data.schedules:
        sched = DoctorSchedule(
            id=uuid.uuid4(),
            doctor_id=doctor_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time,
            end_time=s.end_time,
            max_patients_per_slot=s.max_patients_per_slot,
            is_active=s.is_active,
        )
        db.add(sched)
        new_schedules.append(sched)

    await db.commit()
    return new_schedules


@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner_doctor(
    doctor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor).where(and_(Doctor.id == doctor_id, Doctor.hospital_id == hospital_id))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    await db.delete(doc)
    await db.commit()
    return None


# --- Doctor Photo CRUD (Azure Blob Storage) ---

@router.post("/doctors/{doctor_id}/photo", response_model=AssetUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_doctor_photo(
    doctor_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """CREATE / UPDATE: Upload or replace doctor photo in Azure Blob Storage."""
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor).where(and_(Doctor.id == doctor_id, Doctor.hospital_id == hospital_id))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found in this hospital")

    owner_prefix = azure_storage_service.doctor_photo_prefix(str(hospital_id), str(doctor_id))
    result = await azure_storage_service.replace_asset(
        file=file,
        owner_prefix=owner_prefix,
        subfolder="",
        old_blob_url=doc.photo_url,
    )

    doc.photo_url = result["url"]
    await db.commit()
    await db.refresh(doc)

    return AssetUploadResponse(
        url=result["url"],
        blob_name=result["blob_name"],
        content_type=result.get("content_type"),
        size=result.get("size"),
        is_mock=result.get("is_mock", False),
        message="Doctor photo uploaded successfully",
    )


@router.get("/doctors/{doctor_id}/photo", response_model=AssetMetadataResponse)
async def get_doctor_photo_metadata(
    doctor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """READ: Retrieve doctor photo URL and Azure Storage metadata."""
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor).where(and_(Doctor.id == doctor_id, Doctor.hospital_id == hospital_id))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if not doc.photo_url:
        return AssetMetadataResponse(url=None, exists=False)

    owner_prefix = azure_storage_service.doctor_photo_prefix(str(hospital_id), str(doctor_id))
    meta = await azure_storage_service.get_asset_metadata(doc.photo_url, required_prefix=owner_prefix)
    return AssetMetadataResponse(**meta)


@router.put("/doctors/{doctor_id}/photo", response_model=AssetUploadResponse)
async def replace_doctor_photo(
    doctor_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """UPDATE: Replace doctor photo with auto-cleanup of previous blob."""
    return await upload_doctor_photo(doctor_id=doctor_id, file=file, db=db, current_user=current_user)


@router.delete("/doctors/{doctor_id}/photo", response_model=AssetDeleteResponse)
async def delete_doctor_photo(
    doctor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """DELETE: Remove doctor photo from Azure Blob Storage and reset DB photo_url to null."""
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor).where(and_(Doctor.id == doctor_id, Doctor.hospital_id == hospital_id))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if doc.photo_url:
        owner_prefix = azure_storage_service.doctor_photo_prefix(str(hospital_id), str(doctor_id))
        await azure_storage_service.delete_asset(doc.photo_url, required_prefix=owner_prefix)
        doc.photo_url = None
        await db.commit()
        await db.refresh(doc)

    return AssetDeleteResponse(success=True, message="Doctor photo deleted successfully")


# --- Staff Management ---

@router.get("/staff", response_model=List[StaffResponse])
async def list_partner_staff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(User)
        .where(
            and_(
                User.hospital_id == hospital_id,
                User.role != UserRole.PATIENT,
            )
        )
        .order_by(User.created_at.desc())
    )
    return res.scalars().all()


def generate_random_staff_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits
    pwd = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
    ]
    pwd += [secrets.choice(chars) for _ in range(length - 3)]
    secrets.SystemRandom().shuffle(pwd)
    return "".join(pwd)


@router.post("/staff", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_partner_staff(
    data: StaffCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()

    email_clean = data.email.strip().lower() if data.email else None
    phone_clean = data.phone_number.strip() if data.phone_number else None

    if not email_clean and not phone_clean:
        raise HTTPException(status_code=400, detail="Either email or phone number must be provided")

    # Check if email already exists
    if email_clean:
        existing = await db.execute(select(User).where(User.email == email_clean))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="A user with this email address already exists")

    # Check if phone number already exists
    if phone_clean:
        existing_phone = await db.execute(select(User).where(User.phone_number == phone_clean))
        if existing_phone.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="A user with this phone number already exists")

    raw_password = (
        data.password.strip()
        if (data.password and len(data.password.strip()) >= 6)
        else generate_random_staff_password(10)
    )

    new_staff = User(
        id=uuid.uuid4(),
        hospital_id=hospital_id,
        full_name=data.full_name.strip(),
        email=email_clean,
        phone_number=phone_clean,
        role=data.role,
        hashed_password=get_password_hash(raw_password),
        is_active=True,
        is_verified=True,
    )
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)

    # Dispatch notification / log simulated credentials dispatch to user
    contact_target = new_staff.phone_number or new_staff.email
    await NotificationService.dispatch(
        title="Staff Account Credentials",
        message=f"Welcome {new_staff.full_name}! Your login account is {contact_target} and your temporary password is: {raw_password}",
        notification_type=NotificationType.GENERAL,
        user_id=new_staff.id,
        phone_number=new_staff.phone_number,
        channel=NotificationChannel.SMS if new_staff.phone_number else NotificationChannel.IN_APP,
    )

    res_data = StaffResponse.model_validate(new_staff)
    res_data.temp_password = raw_password
    return res_data


@router.put("/staff/{user_id}", response_model=StaffResponse)
async def update_partner_staff(
    user_id: uuid.UUID,
    data: StaffUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(User).where(and_(User.id == user_id, User.hospital_id == hospital_id))
    )
    staff = res.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if data.full_name is not None:
        staff.full_name = data.full_name.strip()
    if data.email is not None:
        email_clean = data.email.strip().lower() if data.email else None
        if email_clean != staff.email:
            if email_clean:
                existing = await db.execute(select(User).where(and_(User.email == email_clean, User.id != user_id)))
                if existing.scalar_one_or_none():
                    raise HTTPException(status_code=400, detail="This email address is already in use")
            staff.email = email_clean
    if data.phone_number is not None:
        phone_clean = data.phone_number.strip() if data.phone_number else None
        if phone_clean != staff.phone_number:
            if phone_clean:
                existing_p = await db.execute(select(User).where(and_(User.phone_number == phone_clean, User.id != user_id)))
                if existing_p.scalar_one_or_none():
                    raise HTTPException(status_code=400, detail="This phone number is already in use")
            staff.phone_number = phone_clean
    if data.role is not None:
        staff.role = data.role
    if data.is_active is not None:
        staff.is_active = data.is_active
    if data.password:
        staff.hashed_password = get_password_hash(data.password)

    await db.commit()
    await db.refresh(staff)
    return staff


@router.delete("/staff/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner_staff(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active account")

    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(User).where(and_(User.id == user_id, User.hospital_id == hospital_id))
    )
    staff = res.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    await db.delete(staff)
    await db.commit()
    return None


# --- Hospital Profile ---

@router.get("/profile", response_model=HospitalProfileResponse)
async def get_partner_hospital_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return HospitalProfileResponse(
        id=hosp.id,
        name=hosp.name,
        description=hosp.description,
        address=hosp.address,
        city=None,
        contact_phone=hosp.phone,
        contact_email=hosp.email,
        emergency_phone=hosp.phone,
        logo_url=hosp.logo_url,
        website=hosp.website,
        emergency_service_available=hosp.emergency_service_available,
        latitude=hosp.latitude,
        longitude=hosp.longitude,
        is_active=hosp.is_active,
        is_verified=hosp.is_verified,
    )


@router.put("/profile", response_model=HospitalProfileResponse)
async def update_partner_hospital_profile(
    data: HospitalProfileUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if data.name is not None:
        hosp.name = data.name.strip()
    if data.description is not None:
        hosp.description = data.description
    if data.address is not None:
        hosp.address = data.address
    if data.contact_phone is not None:
        hosp.phone = data.contact_phone
    if data.contact_email is not None:
        hosp.email = str(data.contact_email)
    if data.logo_url is not None:
        if not data.logo_url.strip():
            hosp.logo_url = None
        elif data.logo_url.startswith("data:image/"):
            try:
                import base64
                header, encoded = data.logo_url.split(",", 1)
                mime = header.split(";")[0].replace("data:", "")
                file_bytes = base64.b64decode(encoded)
                owner_prefix = azure_storage_service.hospital_logo_prefix(str(hospital_id))
                ext = "png"
                if "jpeg" in mime or "jpg" in mime:
                    ext = "jpg"
                elif "webp" in mime:
                    ext = "webp"
                upload_res = await azure_storage_service.upload_raw_bytes(
                    file_bytes=file_bytes,
                    content_type=mime,
                    owner_prefix=owner_prefix,
                    subfolder="logo",
                    ext=ext,
                )
                hosp.logo_url = upload_res["url"]
            except Exception as e:
                import logging
                logging.getLogger("partners").error(f"Failed to auto-upload base64 logo: {e}")
        elif len(data.logo_url) <= 512:
            hosp.logo_url = data.logo_url
        else:
            import logging
            logging.getLogger("partners").warning("Ignored oversized logo_url string (>512 chars)")
    if data.website is not None:
        hosp.website = data.website
    if data.emergency_service_available is not None:
        hosp.emergency_service_available = data.emergency_service_available
    if data.latitude is not None:
        hosp.latitude = data.latitude
    if data.longitude is not None:
        hosp.longitude = data.longitude

    await db.commit()
    await db.refresh(hosp)
    return HospitalProfileResponse(
        id=hosp.id,
        name=hosp.name,
        description=hosp.description,
        address=hosp.address,
        city=None,
        contact_phone=hosp.phone,
        contact_email=hosp.email,
        emergency_phone=hosp.phone,
        logo_url=hosp.logo_url,
        website=hosp.website,
        emergency_service_available=hosp.emergency_service_available,
        latitude=hosp.latitude,
        longitude=hosp.longitude,
        is_active=hosp.is_active,
        is_verified=hosp.is_verified,
    )


# --- Hospital Logo CRUD (Azure Blob Storage) ---

@router.post("/profile/logo", response_model=AssetUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_hospital_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """CREATE / UPDATE: Upload or replace hospital logo in Azure Blob Storage."""
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    owner_prefix = azure_storage_service.hospital_logo_prefix(str(hospital_id))
    result = await azure_storage_service.replace_asset(
        file=file,
        owner_prefix=owner_prefix,
        subfolder="logo",
        old_blob_url=hosp.logo_url,
    )

    hosp.logo_url = result["url"]
    await db.commit()
    await db.refresh(hosp)

    return AssetUploadResponse(
        url=result["url"],
        blob_name=result["blob_name"],
        content_type=result.get("content_type"),
        size=result.get("size"),
        is_mock=result.get("is_mock", False),
        message="Hospital logo uploaded successfully",
    )


@router.get("/profile/logo", response_model=AssetMetadataResponse)
async def get_hospital_logo_metadata(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """READ: Retrieve hospital logo URL and storage metadata."""
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if not hosp.logo_url:
        return AssetMetadataResponse(url=None, exists=False)

    owner_prefix = azure_storage_service.hospital_logo_prefix(str(hospital_id))
    meta = await azure_storage_service.get_asset_metadata(hosp.logo_url, required_prefix=owner_prefix)
    return AssetMetadataResponse(**meta)


@router.put("/profile/logo", response_model=AssetUploadResponse)
async def replace_hospital_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """UPDATE: Explicitly replace hospital logo with automatic cleanup of old blob."""
    return await upload_hospital_logo(file=file, db=db, current_user=current_user)


@router.delete("/profile/logo", response_model=AssetDeleteResponse)
async def delete_hospital_logo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """DELETE: Remove hospital logo from Azure Blob Storage and reset DB logo_url to null."""
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if hosp.logo_url:
        owner_prefix = azure_storage_service.hospital_logo_prefix(str(hospital_id))
        await azure_storage_service.delete_asset(hosp.logo_url, required_prefix=owner_prefix)
        hosp.logo_url = None
        await db.commit()
        await db.refresh(hosp)

    return AssetDeleteResponse(success=True, message="Hospital logo deleted successfully")


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
    """
    Get customer booking slots and tickets for the hospital with filtering options.
    Enables viewing online appointment bookings, walk-ins, time slots, assigned doctors, and statuses.
    """
    hospital_id = current_user.hospital_id
    if not hospital_id:
        h_res = await db.execute(select(Hospital))
        hosp = h_res.scalars().first()
        if not hosp:
            raise HTTPException(status_code=404, detail="No hospital registered")
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

    # Order by appointment_date, appointment_time, position, created_at
    # Use standalone nullslast()/nullsfirst() functions — method chaining is unreliable across SQLAlchemy versions
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




