import base64
import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_hospital_staff
from app.exceptions import not_found, bad_request
from app.models import Hospital, HospitalDocument, User, EnrollmentDocumentType
from app.schemas.partner import (
    HospitalDocumentResponse,
    HospitalProfileResponse,
    HospitalProfileUpdateSchema,
    AssetUploadResponse,
    AssetMetadataResponse,
    AssetDeleteResponse,
)
from app.services.audit_service import AuditService
from app.services.azure_storage import azure_storage_service, sanitize_document_filename

logger = logging.getLogger("partners.hospital")
router = APIRouter()


def _build_profile_response(hosp: Hospital) -> HospitalProfileResponse:
    docs = sorted(getattr(hosp, "documents", []) or [], key=lambda d: d.created_at, reverse=True)
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
        verification_status=hosp.verification_status,
        rejection_reason=hosp.rejection_reason,
        documents_count=len(docs),
        documents=[HospitalDocumentResponse.model_validate(d) for d in docs],
    )


async def _resolve_partner_hospital(db: AsyncSession, current_user: User) -> Hospital:
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Hospital)
        .where(Hospital.id == hospital_id)
        .options(selectinload(Hospital.documents))
    )
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise not_found("Hospital")
    return hosp


@router.get("/profile", response_model=HospitalProfileResponse)
async def get_partner_hospital_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hosp = await _resolve_partner_hospital(db, current_user)
    return _build_profile_response(hosp)


@router.put("/profile", response_model=HospitalProfileResponse)
async def update_partner_hospital_profile(
    data: HospitalProfileUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hosp = await _resolve_partner_hospital(db, current_user)
    hospital_id = hosp.id

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
    hosp = await _resolve_partner_hospital(db, current_user)
    return _build_profile_response(hosp)


# --- Private Enrollment Supporting Documents CRUD (Authenticated Only) ---

@router.get("/profile/documents", response_model=List[HospitalDocumentResponse])
async def list_partner_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """List private supporting documents uploaded for the authenticated partner hospital."""
    hosp = await _resolve_partner_hospital(db, current_user)
    docs = sorted(hosp.documents or [], key=lambda d: d.created_at, reverse=True)
    return [HospitalDocumentResponse.model_validate(d) for d in docs]


@router.post("/profile/documents", response_model=HospitalDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_partner_document(
    file: UploadFile = File(...),
    document_type: EnrollmentDocumentType = Form(EnrollmentDocumentType.MOH_LICENSE),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Upload a private supporting document (PDF/image) for hospital enrollment or verification."""
    hosp = await _resolve_partner_hospital(db, current_user)
    owner_prefix = azure_storage_service.hospital_document_prefix(str(hosp.id))

    stored = await azure_storage_service.upload_private_document(
        file=file,
        owner_prefix=owner_prefix,
    )

    doc = HospitalDocument(
        id=uuid.uuid4(),
        hospital_id=hosp.id,
        uploaded_by_user_id=current_user.id,
        document_type=document_type,
        original_filename=stored["original_filename"],
        blob_name=stored["blob_name"],
        content_type=stored["content_type"],
        file_size=stored["size"],
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    try:
        role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        await AuditService.record_log(
            event_type="PARTNER_DOCUMENT",
            action="Supporting Document Uploaded",
            actor_name=current_user.full_name,
            actor_role=role_str,
            actor_email=current_user.email or current_user.phone_number,
            target_entity=hosp.name,
            details=f"Uploaded {document_type.value}: {doc.original_filename}",
            status="SUCCESS",
        )
    except Exception:
        pass

    return HospitalDocumentResponse.model_validate(doc)


@router.get("/profile/documents/{document_id}/download")
async def download_partner_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Stream a private supporting document strictly for authorized owning hospital staff."""
    hosp = await _resolve_partner_hospital(db, current_user)
    res = await db.execute(
        select(HospitalDocument).where(
            HospitalDocument.id == document_id,
            HospitalDocument.hospital_id == hosp.id,
        )
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise not_found("Document")

    owner_prefix = azure_storage_service.hospital_document_prefix(str(hosp.id))
    content = await azure_storage_service.read_private_document(
        blob_name=doc.blob_name,
        required_prefix=owner_prefix,
    )
    safe_name = sanitize_document_filename(doc.original_filename)
    return Response(
        content=content,
        media_type=doc.content_type,
        headers={
            "Content-Disposition": f'inline; filename="{safe_name}"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.delete("/profile/documents/{document_id}", response_model=AssetDeleteResponse)
async def delete_partner_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    """Delete a supporting document while ensuring at least one document remains on file."""
    hosp = await _resolve_partner_hospital(db, current_user)
    docs = hosp.documents or []
    target = next((d for d in docs if d.id == document_id), None)
    if not target:
        raise not_found("Document")

    if len(docs) <= 1:
        raise bad_request("At least one supporting document is required. Upload a replacement before deleting this document.")

    owner_prefix = azure_storage_service.hospital_document_prefix(str(hosp.id))
    await azure_storage_service.delete_private_document(
        blob_name=target.blob_name,
        required_prefix=owner_prefix,
    )
    await db.delete(target)
    await db.commit()

    return AssetDeleteResponse(success=True, message="Supporting document deleted successfully")


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
