import uuid
import secrets
import string
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_hospital_staff
from app.core.security import get_password_hash
from app.exceptions import not_found, bad_request
from app.models import Hospital, User, UserRole
from app.schemas.partner import StaffCreateSchema, StaffUpdateSchema, StaffResponse
from app.schemas.notification import NotificationChannel, NotificationType
from app.services.notification_service import NotificationService

router = APIRouter()


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
        raise bad_request("Either email or phone number must be provided")

    if email_clean:
        existing = await db.execute(select(User).where(User.email == email_clean))
        if existing.scalar_one_or_none():
            raise bad_request("A user with this email address already exists")

    if phone_clean:
        existing_phone = await db.execute(select(User).where(User.phone_number == phone_clean))
        if existing_phone.scalar_one_or_none():
            raise bad_request("A user with this phone number already exists")

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
        raise not_found("Staff member")

    if data.full_name is not None:
        staff.full_name = data.full_name.strip()
    if data.email is not None:
        email_clean = data.email.strip().lower() if data.email else None
        if email_clean != staff.email:
            if email_clean:
                existing = await db.execute(select(User).where(and_(User.email == email_clean, User.id != user_id)))
                if existing.scalar_one_or_none():
                    raise bad_request("This email address is already in use")
            staff.email = email_clean
    if data.phone_number is not None:
        phone_clean = data.phone_number.strip() if data.phone_number else None
        if phone_clean != staff.phone_number:
            if phone_clean:
                existing_p = await db.execute(select(User).where(and_(User.phone_number == phone_clean, User.id != user_id)))
                if existing_p.scalar_one_or_none():
                    raise bad_request("This phone number is already in use")
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
        raise bad_request("Cannot delete your own active account")

    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(User).where(and_(User.id == user_id, User.hospital_id == hospital_id))
    )
    staff = res.scalar_one_or_none()
    if not staff:
        raise not_found("Staff member")

    await db.delete(staff)
    await db.commit()
    return None
