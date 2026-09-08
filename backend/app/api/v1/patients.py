import uuid
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query, UploadFile, File
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services.azure_storage import azure_storage_service
from app.schemas.partner import (
    AssetUploadResponse,
    AssetMetadataResponse,
    AssetDeleteResponse,
)
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

class ServiceDiscoveryItem(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    is_active: bool = True

    model_config = {"from_attributes": True}


class DoctorDiscoveryItem(BaseModel):
    id: uuid.UUID
    full_name: str
    specialty: str
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    room_number: Optional[str] = None
    is_available: bool = True

    model_config = {"from_attributes": True}


class DepartmentDiscoveryItem(BaseModel):
    id: uuid.UUID
    name: str
    code: Optional[str] = None
    floor_room: Optional[str] = None
    avg_consultation_minutes: int
    waiting_count: int
    estimated_wait_minutes: int
    doctors: List[DoctorDiscoveryItem] = []


class HospitalDiscoveryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    category: str = "General Hospital"
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    emergency_service_available: bool = True
    departments: List[DepartmentDiscoveryItem] = []
    services: List[ServiceDiscoveryItem] = []

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
    profile_photo_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


# --- Discovery Endpoints ---

@router.get("/discovery/hospitals", response_model=List[HospitalDiscoveryResponse])
async def search_hospitals(
    q: Optional[str] = Query(None, description="Search query for hospital name, city, or specialty"),
    category: Optional[str] = Query(None, description="Category filter (e.g. Hospital, Clinic, Animal)"),
    db: AsyncSession = Depends(get_db),
):
    """Public search and discovery of verified hospitals, branches, and live department queues"""
    query = (
        select(Hospital)
        .where(Hospital.is_active == True)
        .options(
            selectinload(Hospital.departments).selectinload(Department.queue_sessions),
            selectinload(Hospital.departments).selectinload(Department.doctors),
            selectinload(Hospital.services),
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
        # Determine facility category
        name_lower = h.name.lower()
        desc_lower = (h.description or "").lower()
        full_text = f"{name_lower} {desc_lower}"

        # 1. Animal / Veterinary Clinic
        if "សត្វ" in full_text or re.search(r"\b(animal|animals|vet|veterinary|vets|pet|pets|dog|dogs|canine|feline)\b", full_text):
            cat = "Animal Clinic"
        # 2. General Hospital (explicit general hospital or hospital in title, not dental/clinic/eye)
        elif "hospital" in name_lower and not any(w in name_lower for w in ["dental", "clinic", "eye", "maternity", "polyclinic"]):
            cat = "General Hospital"
        # 3. Medical / Specialty Clinic
        elif any(w in full_text for w in ["clinic", "specialty", "dental", "dermatology", "eye", "skin", "maternity", "polyclinic", "institute", "គ្លីនិក", "វិទ្យាស្ថាន"]):
            cat = "Medical Clinic"
        else:
            cat = "General Hospital"

        if category and category.lower() not in "all":
            if category.lower() not in cat.lower():
                continue

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

            doc_items = [
                DoctorDiscoveryItem(
                    id=doc.id,
                    full_name=doc.full_name,
                    specialty=doc.specialty,
                    bio=doc.bio,
                    photo_url=doc.photo_url,
                    room_number=doc.room_number,
                    is_available=doc.is_available,
                )
                for doc in getattr(d, "doctors", [])
                if getattr(doc, "is_active", True)
            ]

            dept_items.append(
                DepartmentDiscoveryItem(
                    id=d.id,
                    name=d.name,
                    code=d.code,
                    floor_room=d.floor_room,
                    avg_consultation_minutes=d.avg_consultation_minutes,
                    waiting_count=waiting_count,
                    estimated_wait_minutes=est_wait,
                    doctors=doc_items,
                )
            )

        service_items = [
            ServiceDiscoveryItem(
                id=s.id,
                name=s.name,
                description=s.description,
                price=float(s.price),
                duration_minutes=s.duration_minutes,
                is_active=s.is_active,
            )
            for s in getattr(h, "services", [])
            if s.is_active
        ]

        result.append(
            HospitalDiscoveryResponse(
                id=h.id,
                name=h.name,
                slug=h.slug,
                category=cat,
                address=h.address,
                city=None,
                phone=h.phone,
                emergency_service_available=h.emergency_service_available,
                departments=dept_items,
                services=service_items,
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
        profile_photo_url=current_user.profile_photo_url,
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
        profile_photo_url=current_user.profile_photo_url,
        date_of_birth=profile.date_of_birth.isoformat() if profile.date_of_birth else None,
        gender=profile.gender,
        blood_type=profile.blood_type,
        emergency_contact_name=profile.emergency_contact_name,
        emergency_contact_phone=profile.emergency_contact_phone,
    )


# --- Patient Profile Avatar CRUD (Azure Blob Storage) ---

@router.post("/profile/photo", response_model=AssetUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_patient_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CREATE / UPDATE: Upload or replace patient profile photo in Azure Blob Storage."""
    owner_prefix = azure_storage_service.user_avatar_prefix(str(current_user.id))
    result = await azure_storage_service.replace_asset(
        file=file,
        owner_prefix=owner_prefix,
        subfolder="avatar",
        old_blob_url=current_user.profile_photo_url,
    )

    current_user.profile_photo_url = result["url"]
    await db.commit()
    await db.refresh(current_user)

    return AssetUploadResponse(
        url=result["url"],
        blob_name=result["blob_name"],
        content_type=result.get("content_type"),
        size=result.get("size"),
        is_mock=result.get("is_mock", False),
        message="Patient avatar uploaded successfully",
    )


@router.get("/profile/photo", response_model=AssetMetadataResponse)
async def get_patient_photo_metadata(
    current_user: User = Depends(get_current_user),
):
    """READ: Retrieve patient profile photo URL and Azure Storage metadata."""
    if not current_user.profile_photo_url:
        return AssetMetadataResponse(url=None, exists=False)

    owner_prefix = azure_storage_service.user_avatar_prefix(str(current_user.id))
    meta = await azure_storage_service.get_asset_metadata(
        current_user.profile_photo_url,
        required_prefix=owner_prefix
    )
    return AssetMetadataResponse(**meta)


@router.put("/profile/photo", response_model=AssetUploadResponse)
async def replace_patient_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """UPDATE: Explicitly replace patient avatar with automatic cleanup of old blob."""
    return await upload_patient_photo(file=file, db=db, current_user=current_user)


@router.delete("/profile/photo", response_model=AssetDeleteResponse)
async def delete_patient_photo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """DELETE: Remove patient avatar from Azure Blob Storage and reset DB field to null."""
    if current_user.profile_photo_url:
        owner_prefix = azure_storage_service.user_avatar_prefix(str(current_user.id))
        await azure_storage_service.delete_asset(
            current_user.profile_photo_url,
            required_prefix=owner_prefix
        )
        current_user.profile_photo_url = None
        await db.commit()
        await db.refresh(current_user)

    return AssetDeleteResponse(success=True, message="Patient avatar deleted successfully")

