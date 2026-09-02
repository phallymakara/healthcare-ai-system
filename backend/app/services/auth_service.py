import uuid
import re
from typing import Optional
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import (
    User,
    PatientProfile,
    Hospital,
    HospitalBranch,
    UserRole,
    VerificationStatus,
)
from app.core.security import get_password_hash, verify_password
from app.core.jwt import create_access_token, create_refresh_token, decode_token
from app.schemas.auth import (
    LoginRequest,
    PatientRegisterRequest,
    PartnerRegisterRequest,
    TokenResponse,
    UserResponse,
)


def generate_slug(name: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", name.lower())
    slug = re.sub(r"[-\s]+", "-", slug).strip("-")
    return f"{slug}-{uuid.uuid4().hex[:6]}"


class AuthService:
    @staticmethod
    async def authenticate_user(session: AsyncSession, data: LoginRequest) -> TokenResponse:
        account_clean = data.identifier
        
        if not account_clean or not data.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/phone or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Query user by email or phone number
        query = (
            select(User)
            .where(or_(User.email == account_clean, User.phone_number == account_clean))
            .options(selectinload(User.patient_profile))
        )
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/phone or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Please contact support.",
            )

        # Generate JWT tokens
        access_token = create_access_token(
            subject=user.id,
            role=user.role.value,
            extra_data={"hospital_id": str(user.hospital_id) if user.hospital_id else None},
        )
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    async def register_patient(session: AsyncSession, data: PatientRegisterRequest) -> TokenResponse:
        # Check uniqueness of phone number and email
        filters = [User.phone_number == data.phone_number.strip()]
        if data.email:
            filters.append(User.email == data.email.strip().lower())
            
        exist_query = select(User).where(or_(*filters))
        exist_res = await session.execute(exist_query)
        if exist_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this phone number or email already exists.",
            )

        # Create user
        new_user = User(
            id=uuid.uuid4(),
            email=data.email.strip().lower() if data.email else None,
            phone_number=data.phone_number.strip(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name.strip(),
            role=UserRole.PATIENT,
            is_active=True,
            is_verified=True,
        )
        session.add(new_user)
        await session.flush()

        # Create patient demographic profile
        profile = PatientProfile(
            id=uuid.uuid4(),
            user_id=new_user.id,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            blood_type=data.blood_type,
            emergency_contact_name=data.emergency_contact_name,
            emergency_contact_phone=data.emergency_contact_phone,
        )
        session.add(profile)
        await session.commit()

        # Load relations
        user_loaded = await AuthService.get_user_by_id(session, new_user.id)

        access_token = create_access_token(subject=new_user.id, role=UserRole.PATIENT.value)
        refresh_token = create_refresh_token(subject=new_user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user_loaded),
        )

    @staticmethod
    async def register_partner(session: AsyncSession, data: PartnerRegisterRequest) -> TokenResponse:
        # Check admin credentials conflict
        exist_query = select(User).where(
            or_(User.email == data.admin_email.strip().lower(), User.phone_number == data.admin_phone.strip())
        )
        exist_res = await session.execute(exist_query)
        if exist_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An admin account with this email or phone already exists.",
            )

        # 1. Create Hospital Organization
        hospital = Hospital(
            id=uuid.uuid4(),
            name=data.hospital_name.strip(),
            slug=generate_slug(data.hospital_name),
            description=data.description,
            address=data.address,
            phone=data.hospital_phone,
            email=data.hospital_email,
            website=data.website,
            is_active=True,
            is_verified=False,
            verification_status=VerificationStatus.PENDING,
        )
        session.add(hospital)
        await session.flush()

        # 2. Create Main Branch
        branch = HospitalBranch(
            id=uuid.uuid4(),
            hospital_id=hospital.id,
            name=f"{data.hospital_name} - Main Branch",
            address=data.address,
            phone=data.hospital_phone,
            is_main_branch=True,
            is_active=True,
        )
        session.add(branch)
        await session.flush()

        # 3. Create Hospital Admin User
        admin_user = User(
            id=uuid.uuid4(),
            email=data.admin_email.strip().lower(),
            phone_number=data.admin_phone.strip(),
            hashed_password=get_password_hash(data.admin_password),
            full_name=data.admin_full_name.strip(),
            role=UserRole.HOSPITAL_ADMIN,
            hospital_id=hospital.id,
            branch_id=branch.id,
            is_active=True,
            is_verified=True,
        )
        session.add(admin_user)
        await session.commit()

        access_token = create_access_token(
            subject=admin_user.id,
            role=UserRole.HOSPITAL_ADMIN.value,
            extra_data={"hospital_id": str(hospital.id)},
        )
        refresh_token = create_refresh_token(subject=admin_user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(admin_user),
        )

    @staticmethod
    async def refresh_token(session: AsyncSession, refresh_token_str: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token_str)
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type"
                )
            user_id = uuid.UUID(payload.get("sub"))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token"
            )

        user = await AuthService.get_user_by_id(session, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found"
            )

        new_access_token = create_access_token(
            subject=user.id,
            role=user.role.value,
            extra_data={"hospital_id": str(user.hospital_id) if user.hospital_id else None},
        )
        new_refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        query = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.patient_profile))
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()
