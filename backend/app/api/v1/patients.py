import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import (
    Hospital,
    HospitalBranch,
    Department,
    Doctor,
    QueueSession,
    Ticket,
    User,
    PatientProfile,
    TicketStatus,
    QueueStatus,
)
from app.schemas.queue import TicketDetailResponse, TicketResponse
from app.services.wait_time_calculator import WaitTimeCalculator

router = APIRouter(prefix="/patients", tags=["Patient Platform"])


# --- Schemas ---

class DepartmentDiscoveryItem(BaseModel):
    id: uuid.UUID
    name: str
    code: Optional[str] = None
    floor_room: Optional[str] = None
    avg_consultation_minutes: int
    waiting_count: int
    estimated_wait_minutes: int


class HospitalDiscoveryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    departments: List[DepartmentDiscoveryItem] = []

    model_config = {"from_attributes": True}


class DoctorDiscoveryResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    specialty: str
    hospital_name: str
    department_name: str
    room_number: Optional[str] = None
    avg_consultation_minutes: int
    is_available: bool

    model_config = {"from_attributes": True}


class PatientProfileUpdateRequest(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class PatientProfileResponse(BaseModel):
    user_id: uuid.UUID
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


# --- Discovery Endpoints ---

@router.get("/discovery/hospitals", response_model=List[HospitalDiscoveryResponse])
async def search_hospitals(
    q: Optional[str] = Query(None, description="Search query for hospital name, city, or specialty"),
    db: AsyncSession = Depends(get_db),
):
    """Public search and discovery of verified hospitals, branches, and live department queues"""
    query = (
        select(Hospital)
        .where(Hospital.is_active == True)
        .options(
            selectinload(Hospital.departments).selectinload(Department.queue_sessions),
        )
    )

    if q:
        search_term = f"%{q.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Hospital.name).like(search_term),
                func.lower(Hospital.address).like(search_term),
            )
        )

    res = await db.execute(query)
    hospitals = res.scalars().all()

    result = []
    for h in hospitals:
        dept_items = []
        for d in h.departments:
            if not d.is_active:
                continue
            # Find active session if any
            active_session = next((s for s in d.queue_sessions if s.status == QueueStatus.ACTIVE), None)
            waiting_count = 0
            if active_session:
                t_res = await db.execute(
                    select(func.count(Ticket.id)).where(
                        and_(
                            Ticket.queue_session_id == active_session.id,
                            Ticket.status.in_([TicketStatus.WAITING, TicketStatus.CALLED]),
                        )
                    )
                )
                waiting_count = t_res.scalar() or 0

            est_wait = WaitTimeCalculator.calculate_wait_time(
                position_ahead=waiting_count,
                avg_consultation_minutes=d.avg_consultation_minutes,
                is_serving_in_progress=True,
            )

            dept_items.append(
                DepartmentDiscoveryItem(
                    id=d.id,
                    name=d.name,
                    code=d.code,
                    floor_room=d.floor_room,
                    avg_consultation_minutes=d.avg_consultation_minutes,
                    waiting_count=waiting_count,
                    estimated_wait_minutes=est_wait,
                )
            )

        result.append(
            HospitalDiscoveryResponse(
                id=h.id,
                name=h.name,
                slug=h.slug,
                address=h.address,
                city=None,
                phone=h.phone,
                departments=dept_items,
            )
        )

    return result


@router.get("/discovery/doctors", response_model=List[DoctorDiscoveryResponse])
async def search_doctors(
    department_id: Optional[uuid.UUID] = None,
    specialty: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Search doctors by department or medical specialty"""
    query = (
        select(Doctor)
        .where(Doctor.is_active == True)
        .options(
            selectinload(Doctor.department).selectinload(Department.hospital),
        )
    )

    if department_id:
        query = query.where(Doctor.department_id == department_id)
    if specialty:
        query = query.where(func.lower(Doctor.specialty).like(f"%{specialty.strip().lower()}%"))

    res = await db.execute(query)
    doctors = res.scalars().all()

    return [
        DoctorDiscoveryResponse(
            id=d.id,
            full_name=d.full_name,
            specialty=d.specialty,
            hospital_name=d.department.hospital.name if (d.department and d.department.hospital) else "General Hospital",
            department_name=d.department.name if d.department else "General Medicine",
            room_number=d.room_number,
            avg_consultation_minutes=d.avg_consultation_minutes,
            is_available=d.is_available,
        )
        for d in doctors
    ]


# --- Patient Personal Tickets & Profile ---

@router.get("/my-tickets", response_model=List[TicketDetailResponse])
async def get_my_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all active and completed queue tickets for the logged-in patient"""
    query = (
        select(Ticket)
        .where(
            or_(
                Ticket.patient_id == current_user.id,
                Ticket.patient_phone == current_user.phone_number,
            )
        )
        .options(selectinload(Ticket.logs))
        .order_by(Ticket.created_at.desc())
    )
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/my-profile", response_model=PatientProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve the patient's medical and demographic profile"""
    res = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    )
    profile = res.scalar_one_or_none()

    return PatientProfileResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        email=current_user.email,
        date_of_birth=profile.date_of_birth.isoformat() if (profile and profile.date_of_birth) else None,
        gender=profile.gender if profile else None,
        blood_type=profile.blood_type if profile else None,
        emergency_contact_name=profile.emergency_contact_name if profile else None,
        emergency_contact_phone=profile.emergency_contact_phone if profile else None,
    )


@router.put("/my-profile", response_model=PatientProfileResponse)
async def update_my_profile(
    data: PatientProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update medical history, blood type, and emergency contacts"""
    res = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    )
    profile = res.scalar_one_or_none()

    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    if data.gender:
        profile.gender = data.gender
    if data.blood_type:
        profile.blood_type = data.blood_type
    if data.emergency_contact_name is not None:
        profile.emergency_contact_name = data.emergency_contact_name
    if data.emergency_contact_phone is not None:
        profile.emergency_contact_phone = data.emergency_contact_phone

    await db.commit()

    return PatientProfileResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        email=current_user.email,
        date_of_birth=profile.date_of_birth.isoformat() if profile.date_of_birth else None,
        gender=profile.gender,
        blood_type=profile.blood_type,
        emergency_contact_name=profile.emergency_contact_name,
        emergency_contact_phone=profile.emergency_contact_phone,
    )
