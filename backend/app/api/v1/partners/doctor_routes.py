import uuid
from typing import List
from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy import select, and_, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_hospital_staff
from app.core.security import get_password_hash
from app.exceptions import not_found
from app.models import Hospital, Doctor, DoctorSchedule, User, UserRole
from app.schemas.partner import (
    DoctorCreateSchema,
    DoctorUpdateSchema,
    DoctorResponse,
    DoctorScheduleSchema,
    DoctorScheduleResponse,
    DoctorSchedulesBatchUpdateSchema,
    AssetUploadResponse,
    AssetMetadataResponse,
    AssetDeleteResponse,
)
from app.services.azure_storage import azure_storage_service

router = APIRouter()


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
        raise not_found("Doctor")

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
        raise not_found("Doctor")

    await db.execute(delete(DoctorSchedule).where(DoctorSchedule.doctor_id == doctor_id))

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
        raise not_found("Doctor")

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
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor).where(and_(Doctor.id == doctor_id, Doctor.hospital_id == hospital_id))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise not_found("Doctor not found in this hospital")

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
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Doctor).where(and_(Doctor.id == doctor_id, Doctor.hospital_id == hospital_id))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise not_found("Doctor")

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
    return await upload_doctor_photo(doctor_id=doctor_id, file=file, db=db, current_user=current_user)


@router.delete("/doctors/{doctor_id}/photo", response_model=AssetDeleteResponse)
async def delete_doctor_photo(
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
        raise not_found("Doctor")

    if doc.photo_url:
        owner_prefix = azure_storage_service.doctor_photo_prefix(str(hospital_id), str(doctor_id))
        await azure_storage_service.delete_asset(doc.photo_url, required_prefix=owner_prefix)
        doc.photo_url = None
        await db.commit()
        await db.refresh(doc)

    return AssetDeleteResponse(success=True, message="Doctor photo deleted successfully")
