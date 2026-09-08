from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import (
    LoginRequest,
    PatientRegisterRequest,
    PartnerRegisterRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.partner import (
    AssetUploadResponse,
    AssetMetadataResponse,
    AssetDeleteResponse,
)
from app.services.auth_service import AuthService
from app.services.azure_storage import azure_storage_service

router = APIRouter(prefix="/auth", tags=["Authentication & Accounts"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Unified login for Patients, Hospital Staff, and Admins using email or phone"""
    return await AuthService.authenticate_user(db, data)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_patient(data: PatientRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Patient self-registration with profile creation"""
    return await AuthService.register_patient(db, data)


@router.post("/partner-register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_partner(data: PartnerRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Hospital / Clinic partner onboarding with organization profile and admin user"""
    return await AuthService.register_partner(db, data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a fresh access & refresh token pair"""
    return await AuthService.refresh_token(db, data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile and permissions"""
    return UserResponse.model_validate(current_user)


# --- User Profile Avatar CRUD (Azure Blob Storage) ---

@router.post("/me/avatar", response_model=AssetUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_my_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CREATE / UPDATE: Upload or replace personal profile avatar in Azure Blob Storage."""
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
        message="Profile avatar uploaded successfully",
    )


@router.get("/me/avatar", response_model=AssetMetadataResponse)
async def get_my_avatar_metadata(
    current_user: User = Depends(get_current_user),
):
    """READ: Retrieve current user avatar URL and Azure Storage metadata."""
    if not current_user.profile_photo_url:
        return AssetMetadataResponse(url=None, exists=False)

    owner_prefix = azure_storage_service.user_avatar_prefix(str(current_user.id))
    meta = await azure_storage_service.get_asset_metadata(
        current_user.profile_photo_url,
        required_prefix=owner_prefix
    )
    return AssetMetadataResponse(**meta)


@router.put("/me/avatar", response_model=AssetUploadResponse)
async def replace_my_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """UPDATE: Explicitly replace personal profile avatar with automatic cleanup of old blob."""
    return await upload_my_avatar(file=file, db=db, current_user=current_user)


@router.delete("/me/avatar", response_model=AssetDeleteResponse)
async def delete_my_avatar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """DELETE: Remove personal profile avatar from Azure Blob Storage and reset DB field to null."""
    if current_user.profile_photo_url:
        owner_prefix = azure_storage_service.user_avatar_prefix(str(current_user.id))
        await azure_storage_service.delete_asset(
            current_user.profile_photo_url,
            required_prefix=owner_prefix
        )
        current_user.profile_photo_url = None
        await db.commit()
        await db.refresh(current_user)

    return AssetDeleteResponse(success=True, message="Profile avatar deleted successfully")


@router.get("/admin/ping")
async def admin_only_endpoint(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
):
    """Protected endpoint strictly requiring SUPER_ADMIN role"""
    return {
        "status": "authorized",
        "message": f"Welcome Super Admin {current_user.full_name}",
    }

