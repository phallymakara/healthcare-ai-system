import base64
import logging
from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_hospital_staff
from app.exceptions import not_found
from app.models import Hospital, User
from app.schemas.partner import (
    HospitalProfileResponse,
    HospitalProfileUpdateSchema,
    AssetUploadResponse,
    AssetMetadataResponse,
    AssetDeleteResponse,
)
from app.services.azure_storage import azure_storage_service

logger = logging.getLogger("partners.hospital")
router = APIRouter()


@router.get("/profile", response_model=HospitalProfileResponse)
async def get_partner_hospital_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise not_found("Hospital")

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
        raise not_found("Hospital")

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
                logger.error(f"Failed to auto-upload base64 logo: {e}")
        elif len(data.logo_url) <= 512:
            hosp.logo_url = data.logo_url
        else:
            logger.warning("Ignored oversized logo_url string (>512 chars)")
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
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise not_found("Hospital")

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
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise not_found("Hospital")

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
    return await upload_hospital_logo(file=file, db=db, current_user=current_user)


@router.delete("/profile/logo", response_model=AssetDeleteResponse)
async def delete_hospital_logo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise not_found("Hospital")

    if hosp.logo_url:
        owner_prefix = azure_storage_service.hospital_logo_prefix(str(hospital_id))
        await azure_storage_service.delete_asset(hosp.logo_url, required_prefix=owner_prefix)
        hosp.logo_url = None
        await db.commit()
        await db.refresh(hosp)

    return AssetDeleteResponse(success=True, message="Hospital logo deleted successfully")
