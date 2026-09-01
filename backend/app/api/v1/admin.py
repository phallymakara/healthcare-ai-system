import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles
from app.models import (
    Hospital,
    Department,
    Doctor,
    QueueSession,
    Ticket,
    TicketLog,
    User,
    UserRole,
    VerificationStatus,
    TicketStatus,
    QueueStatus,
)
from app.schemas.admin import (
    AdminDashboardSummaryResponse,
    AdminHospitalItemResponse,
    AdminUserItemResponse,
    AdminAuditLogItemResponse,
    HospitalVerificationRequest,
    UserStatusUpdateRequest,
)

router = APIRouter(
    prefix="/admin",
    tags=["Platform Administration (Super Admin)"],
    dependencies=[Depends(require_roles([UserRole.SUPER_ADMIN]))],
)


@router.get("/dashboard", response_model=AdminDashboardSummaryResponse)
async def get_admin_dashboard(db: AsyncSession = Depends(get_db)):
    """System-wide telemetry and platform health overview"""
    today = date.today()

    # 1. Total hospitals & pending approvals
    hosp_res = await db.execute(
        select(Hospital).options(
            selectinload(Hospital.departments),
        )
    )
    all_hospitals = hosp_res.scalars().all()
    total_hospitals = len(all_hospitals)
    pending_approvals = len([h for h in all_hospitals if h.verification_status == VerificationStatus.PENDING])

    # 2. Doctors & Patients count
    doc_count_res = await db.execute(select(func.count(Doctor.id)))
    total_doctors = doc_count_res.scalar() or 0

    pat_count_res = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.PATIENT)
    )
    total_patients = pat_count_res.scalar() or 0

    # 3. Tickets today across all hospitals
    tickets_res = await db.execute(
        select(Ticket).where(func.date(Ticket.created_at) == today)
    )
    today_tickets = tickets_res.scalars().all()
    total_tickets_today = len(today_tickets)
    total_completed_today = len([t for t in today_tickets if t.status == TicketStatus.COMPLETED])

    # 4. Active queue sessions today
    sess_res = await db.execute(
        select(func.count(QueueSession.id)).where(
            and_(
                QueueSession.session_date == today,
                QueueSession.status == QueueStatus.ACTIVE,
            )
        )
    )
    active_sessions = sess_res.scalar() or 0

    # 5. Format recent hospitals
    recent_hosp_items: List[AdminHospitalItemResponse] = []
    for h in all_hospitals[:10]:
        doc_c = await db.execute(
            select(func.count(Doctor.id)).where(Doctor.hospital_id == h.id)
        )
        doctors_count = doc_c.scalar() or 0

        recent_hosp_items.append(
            AdminHospitalItemResponse(
                id=h.id,
                name=h.name,
                slug=h.slug,
                phone=h.phone,
                email=h.email,
                address=h.address,
                is_active=h.is_active,
                is_verified=h.is_verified,
                verification_status=h.verification_status,
                departments_count=len(h.departments),
                doctors_count=doctors_count,
                created_at=h.created_at,
            )
        )

    return AdminDashboardSummaryResponse(
        total_hospitals=total_hospitals,
        pending_hospital_approvals=pending_approvals,
        total_doctors=total_doctors,
        total_patients=total_patients,
        total_tickets_issued_today=total_tickets_today,
        total_completed_today=total_completed_today,
        active_queue_sessions_today=active_sessions,
        recent_hospitals=recent_hosp_items,
    )


@router.get("/partners", response_model=List[AdminHospitalItemResponse])
async def list_admin_partners(
    status_filter: Optional[VerificationStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all registered hospitals with verification status"""
    query = (
        select(Hospital)
        .options(selectinload(Hospital.departments))
        .order_by(Hospital.created_at.desc())
    )
    if status_filter:
        query = query.where(Hospital.verification_status == status_filter)

    res = await db.execute(query)
    hospitals = res.scalars().all()

    result: List[AdminHospitalItemResponse] = []
    for h in hospitals:
        doc_c = await db.execute(
            select(func.count(Doctor.id)).where(Doctor.hospital_id == h.id)
        )
        result.append(
            AdminHospitalItemResponse(
                id=h.id,
                name=h.name,
                slug=h.slug,
                phone=h.phone,
                email=h.email,
                address=h.address,
                is_active=h.is_active,
                is_verified=h.is_verified,
                verification_status=h.verification_status,
                departments_count=len(h.departments),
                doctors_count=doc_c.scalar() or 0,
                created_at=h.created_at,
            )
        )
    return result


@router.post("/partners/{hospital_id}/verify", response_model=AdminHospitalItemResponse)
async def verify_partner_hospital(
    hospital_id: uuid.UUID,
    data: HospitalVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a partner hospital organization"""
    res = await db.execute(
        select(Hospital)
        .where(Hospital.id == hospital_id)
        .options(selectinload(Hospital.departments))
    )
    hospital = res.scalar_one_or_none()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    hospital.verification_status = data.status
    hospital.is_verified = data.status == VerificationStatus.APPROVED
    hospital.is_active = data.status == VerificationStatus.APPROVED

    await db.commit()
    await db.refresh(hospital)

    doc_c = await db.execute(
        select(func.count(Doctor.id)).where(Doctor.hospital_id == hospital.id)
    )

    return AdminHospitalItemResponse(
        id=hospital.id,
        name=hospital.name,
        slug=hospital.slug,
        phone=hospital.phone,
        email=hospital.email,
        address=hospital.address,
        is_active=hospital.is_active,
        is_verified=hospital.is_verified,
        verification_status=hospital.verification_status,
        departments_count=len(hospital.departments),
        doctors_count=doc_c.scalar() or 0,
        created_at=hospital.created_at,
    )


@router.get("/users", response_model=List[AdminUserItemResponse])
async def list_admin_users(
    role: Optional[UserRole] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Directory of all users across the platform"""
    query = select(User).order_by(User.created_at.desc()).limit(100)

    if role:
        query = query.where(User.role == role)
    if q:
        search_term = f"%{q.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(User.full_name).like(search_term),
                func.lower(User.email).like(search_term),
                User.phone_number.like(search_term),
            )
        )

    res = await db.execute(query)
    users = res.scalars().all()

    result: List[AdminUserItemResponse] = []
    for u in users:
        hosp_name = None
        if u.hospital_id:
            h_res = await db.execute(select(Hospital.name).where(Hospital.id == u.hospital_id))
            hosp_name = h_res.scalar_one_or_none()

        result.append(
            AdminUserItemResponse(
                id=u.id,
                email=u.email,
                phone_number=u.phone_number,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                is_verified=u.is_verified,
                hospital_name=hosp_name,
                created_at=u.created_at,
            )
        )
    return result


@router.put("/users/{user_id}/status", response_model=AdminUserItemResponse)
async def update_user_status(
    user_id: uuid.UUID,
    data: UserStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate a user account"""
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = data.is_active
    await db.commit()
    await db.refresh(user)

    hosp_name = None
    if user.hospital_id:
        h_res = await db.execute(select(Hospital.name).where(Hospital.id == user.hospital_id))
        hosp_name = h_res.scalar_one_or_none()

    return AdminUserItemResponse(
        id=user.id,
        email=user.email,
        phone_number=user.phone_number,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        hospital_name=hosp_name,
        created_at=user.created_at,
    )


@router.get("/audit-logs", response_model=List[AdminAuditLogItemResponse])
async def list_admin_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """System-wide audit logs and ticket state transition events"""
    query = (
        select(TicketLog)
        .options(
            selectinload(TicketLog.ticket).selectinload(Ticket.hospital),
            selectinload(TicketLog.ticket).selectinload(Ticket.department),
            selectinload(TicketLog.actor),
        )
        .order_by(TicketLog.timestamp.desc())
        .limit(limit)
    )
    res = await db.execute(query)
    logs = res.scalars().all()

    result: List[AdminAuditLogItemResponse] = []
    for l in logs:
        t = l.ticket
        hosp_name = t.hospital.name if (t and t.hospital) else "Hospital"
        dept_name = t.department.name if (t and t.department) else "General"
        actor_name = l.actor.full_name if l.actor else "System"

        result.append(
            AdminAuditLogItemResponse(
                id=l.id,
                ticket_id=l.ticket_id,
                ticket_number=t.ticket_number if t else "N/A",
                hospital_name=hosp_name,
                department_name=dept_name,
                from_status=l.from_status,
                to_status=l.to_status,
                actor_name=actor_name,
                note=l.note,
                timestamp=l.timestamp,
            )
        )
    return result
