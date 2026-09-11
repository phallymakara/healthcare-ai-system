import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_hospital_staff
from app.exceptions import not_found
from app.models import Hospital, Department, Service, User
from app.schemas.partner import (
    DepartmentCreateSchema,
    DepartmentUpdateSchema,
    DepartmentResponse,
    ServiceCreateSchema,
    ServiceUpdateSchema,
    ServiceResponse,
)

router = APIRouter()


# --- Departments ---

@router.get("/departments", response_model=List[DepartmentResponse])
async def list_partner_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Department).where(Department.hospital_id == hospital_id).order_by(Department.name.asc())
    )
    return res.scalars().all()


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_partner_department(
    data: DepartmentCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    dept = Department(
        id=uuid.uuid4(),
        hospital_id=hospital_id,
        branch_id=data.branch_id,
        name=data.name.strip(),
        code=data.code.strip().upper() if data.code else (data.name.strip()[:4].upper()),
        description=data.description,
        floor_room=data.floor_room,
        avg_consultation_minutes=data.avg_consultation_minutes,
        is_active=True,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_partner_department(
    department_id: uuid.UUID,
    data: DepartmentUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Department).where(
            and_(
                Department.id == department_id,
                Department.hospital_id == hospital_id,
            )
        )
    )
    dept = res.scalar_one_or_none()
    if not dept:
        raise not_found("Department")

    if data.name is not None:
        dept.name = data.name.strip()
    if data.code is not None:
        dept.code = data.code.strip().upper()
    if data.description is not None:
        dept.description = data.description
    if data.floor_room is not None:
        dept.floor_room = data.floor_room
    if data.avg_consultation_minutes is not None:
        dept.avg_consultation_minutes = data.avg_consultation_minutes
    if data.is_active is not None:
        dept.is_active = data.is_active

    await db.commit()
    await db.refresh(dept)
    return dept


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner_department(
    department_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Department).where(
            and_(
                Department.id == department_id,
                Department.hospital_id == hospital_id,
            )
        )
    )
    dept = res.scalar_one_or_none()
    if not dept:
        raise not_found("Department")

    await db.delete(dept)
    await db.commit()
    return None


# --- Services ---

@router.get("/services", response_model=List[ServiceResponse])
async def list_partner_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Service).where(Service.hospital_id == hospital_id).order_by(Service.name.asc())
    )
    return res.scalars().all()


@router.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_partner_service(
    data: ServiceCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    srv = Service(
        id=uuid.uuid4(),
        hospital_id=hospital_id,
        department_id=data.department_id,
        name=data.name.strip(),
        description=data.description,
        duration_minutes=data.duration_minutes,
        price=data.price,
        is_active=True,
    )
    db.add(srv)
    await db.commit()
    await db.refresh(srv)
    return srv


@router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_partner_service(
    service_id: uuid.UUID,
    data: ServiceUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Service).where(
            and_(
                Service.id == service_id,
                Service.hospital_id == hospital_id,
            )
        )
    )
    srv = res.scalar_one_or_none()
    if not srv:
        raise not_found("Service")

    if data.department_id is not None:
        srv.department_id = data.department_id
    if data.name is not None:
        srv.name = data.name.strip()
    if data.description is not None:
        srv.description = data.description
    if data.duration_minutes is not None:
        srv.duration_minutes = data.duration_minutes
    if data.price is not None:
        srv.price = data.price
    if data.is_active is not None:
        srv.is_active = data.is_active

    await db.commit()
    await db.refresh(srv)
    return srv


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner_service(
    service_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hospital_staff),
):
    hospital_id = current_user.hospital_id or (await db.execute(select(Hospital.id))).scalar()
    res = await db.execute(
        select(Service).where(
            and_(
                Service.id == service_id,
                Service.hospital_id == hospital_id,
            )
        )
    )
    srv = res.scalar_one_or_none()
    if not srv:
        raise not_found("Service")

    await db.delete(srv)
    await db.commit()
    return None
