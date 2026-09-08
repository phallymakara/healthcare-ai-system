import logging
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
    Department,
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

logger = logging.getLogger("healthcare_ai.auth")


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
        # Resolve email or phone
        raw_contact = (data.contact_identifier or "").strip()
        is_email = "@" in raw_contact

        resolved_email = data.email or (raw_contact.lower() if is_email and raw_contact else None)
        resolved_phone = data.phone_number or (raw_contact if not is_email and raw_contact else None)

        if not resolved_email and not resolved_phone:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Please enter your phone number or email.",
            )

        filters = []
        if resolved_phone:
            filters.append(User.phone_number == str(resolved_phone).strip())
        if resolved_email:
            filters.append(User.email == str(resolved_email).strip().lower())

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
            email=str(resolved_email).strip().lower() if resolved_email else None,
            phone_number=str(resolved_phone).strip() if resolved_phone else None,
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
        # Resolve contact identifier (email or phone)
        raw_contact = (data.contact_identifier or "").strip()
        is_email = "@" in raw_contact

        resolved_email = (
            data.admin_email
            or data.hospital_email
            or (raw_contact.lower() if is_email and raw_contact else None)
        )
        resolved_phone = (
            data.admin_phone
            or data.hospital_phone
            or (raw_contact if not is_email and raw_contact else None)
        )
        password = data.password or data.admin_password
        if not password or len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password must be at least 6 characters.",
            )

        if not resolved_email and not resolved_phone:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Please provide an official hospital or clinic email or phone number.",
            )

        # Check existing user conflict
        where_clauses = []
        if resolved_email:
            where_clauses.append(User.email == str(resolved_email).strip().lower())
        if resolved_phone:
            where_clauses.append(User.phone_number == str(resolved_phone).strip())

        existing_user = None
        if where_clauses:
            exist_query = select(User).where(or_(*where_clauses))
            exist_res = await session.execute(exist_query)
            existing_user = exist_res.scalar_one_or_none()

        if existing_user and existing_user.role not in (UserRole.PATIENT, UserRole.HOSPITAL_ADMIN):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email or phone is already registered as staff.",
            )

        # 1. Create Hospital Organization
        h_name = (data.hospital_name or "").strip()
        if not h_name:
            if resolved_email:
                prefix = str(resolved_email).split('@')[0].replace('.', ' ').replace('_', ' ').title()
                h_name = f"{prefix} Clinic"
            elif resolved_phone:
                h_name = f"Partner Clinic ({str(resolved_phone)[-4:]})"
            else:
                h_name = "Healthcare Partner Clinic"

        logger.info("Initiating hospital partner registration for contact: %s", resolved_email or resolved_phone)
        safe_logo = data.logo_url if data.logo_url and len(data.logo_url) <= 512 else None
        hospital = Hospital(
            id=uuid.uuid4(),
            name=h_name,
            slug=generate_slug(h_name),
            description=data.description,
            logo_url=safe_logo,
            address=data.address or "",
            phone=str(resolved_phone).strip() if resolved_phone else None,
            email=str(resolved_email).strip().lower() if resolved_email else None,
            website=data.website,
            is_active=True,
            is_verified=False,
            emergency_service_available=bool(data.emergency_service_available),
            verification_status=VerificationStatus.PENDING,
        )
        session.add(hospital)
        await session.flush()

        # 2. Create Main Branch
        branch = HospitalBranch(
            id=uuid.uuid4(),
            hospital_id=hospital.id,
            name=f"{h_name} - Main Branch",
            address=data.address or "",
            phone=str(resolved_phone).strip() if resolved_phone else None,
            is_main_branch=True,
            is_active=True,
        )
        session.add(branch)
        await session.flush()

        # 3. Create Initial Department if specified in onboarding
        initial_dept_name = (data.initial_department_name or "").strip()
        if initial_dept_name:
            initial_dept = Department(
                id=uuid.uuid4(),
                hospital_id=hospital.id,
                branch_id=branch.id,
                name=initial_dept_name,
                floor_room=(data.initial_department_room or "").strip() or "Room 101",
                avg_consultation_minutes=15,
                is_active=True,
            )
            session.add(initial_dept)
            await session.flush()
            logger.debug("Created initial department '%s' for hospital '%s'", initial_dept_name, hospital.name)

        # 4. Create or Upgrade Hospital Admin User
        admin_name = (data.admin_full_name or "").strip() or f"{h_name} Admin"
        if existing_user:
            admin_user = existing_user
            if not admin_user.full_name or admin_user.full_name == "Patient":
                admin_user.full_name = admin_name
            admin_user.role = UserRole.HOSPITAL_ADMIN
            admin_user.hospital_id = hospital.id
            admin_user.branch_id = branch.id
            admin_user.hashed_password = get_password_hash(password)
            admin_user.is_verified = True
            admin_user.is_active = True
        else:
            admin_user = User(
                id=uuid.uuid4(),
                email=str(resolved_email).strip().lower() if resolved_email else None,
                phone_number=str(resolved_phone).strip() if resolved_phone else None,
                hashed_password=get_password_hash(password),
                full_name=admin_name,
                role=UserRole.HOSPITAL_ADMIN,
                hospital_id=hospital.id,
                branch_id=branch.id,
                is_active=True,
                is_verified=True,
            )
            session.add(admin_user)
        await session.commit()

        logger.info(
            "Successfully registered hospital '%s' (ID: %s) with admin '%s'",
            hospital.name,
            hospital.id,
            admin_user.email or admin_user.phone_number,
        )

        admin_loaded = await AuthService.get_user_by_id(session, admin_user.id)

        access_token = create_access_token(
            subject=admin_user.id,
            role=UserRole.HOSPITAL_ADMIN.value,
            extra_data={"hospital_id": str(hospital.id)},
        )
        refresh_token = create_refresh_token(subject=admin_user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(admin_loaded),
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
