from fastapi import APIRouter, Depends, status
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
from app.services.auth_service import AuthService

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


@router.get("/admin/ping")
async def admin_only_endpoint(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
):
    """Protected endpoint strictly requiring SUPER_ADMIN role"""
    return {
        "status": "authorized",
        "message": f"Welcome Super Admin {current_user.full_name}",
    }
