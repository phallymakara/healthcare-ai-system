import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles, get_current_user
from app.core.websocket import manager
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
from app.models.guest_rate_limit import GuestRateLimit
from app.schemas.admin import (
    AdminDashboardSummaryResponse,
    AdminHospitalItemResponse,
    AdminUserItemResponse,
    AdminAuditLogItemResponse,
    ActivityAuditLogItem,
    HospitalVerificationRequest,
    UserStatusUpdateRequest,
)
from app.services.audit_service import AuditService

router = APIRouter(
    prefix="/admin",
    tags=["Platform Administration (Super Admin)"],
    dependencies=[Depends(require_roles([UserRole.SUPER_ADMIN]))],
)


@router.get("/dashboard", response_model=AdminDashboardSummaryResponse)
async def get_admin_dashboard(db: AsyncSession = Depends(get_db)):
    """System-wide telemetry and platform health overview"""
    today = date.today()

    # 1. Total hospitals & pending approvals via fast SQL aggregation
    tot_hosp_res = await db.execute(select(func.count(Hospital.id)))
    total_hospitals = tot_hosp_res.scalar() or 0

    pending_res = await db.execute(
        select(func.count(Hospital.id)).where(Hospital.verification_status == VerificationStatus.PENDING)
    )
    pending_approvals = pending_res.scalar() or 0

    # 2. Doctors & Patients count
    doc_count_res = await db.execute(select(func.count(Doctor.id)))
    total_doctors = doc_count_res.scalar() or 0

    pat_count_res = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.PATIENT)
    )
    total_patients = pat_count_res.scalar() or 0

    # Distinct guest devices/users who used AI triage in guest mode
    guest_pat_res = await db.execute(
        select(func.count(func.distinct(GuestRateLimit.identifier)))
    )
    guest_patients = guest_pat_res.scalar() or 0

    # 3. Tickets today across all hospitals via SQL counts
    tot_tick_res = await db.execute(
        select(func.count(Ticket.id)).where(func.date(Ticket.created_at) == today)
    )
    total_tickets_today = tot_tick_res.scalar() or 0

    comp_tick_res = await db.execute(
        select(func.count(Ticket.id)).where(
            and_(
                func.date(Ticket.created_at) == today,
                Ticket.status == TicketStatus.COMPLETED,
            )
        )
    )
    total_completed_today = comp_tick_res.scalar() or 0

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

    # 5. Governance Telemetry: Facility status breakdown
    hosp_status_res = await db.execute(
        select(Hospital.verification_status, func.count(Hospital.id)).group_by(Hospital.verification_status)
    )
    facility_status_breakdown = {
        str(row[0].value if hasattr(row[0], "value") else row[0]): int(row[1])
        for row in hosp_status_res.all()
    }

    # 6. Governance Telemetry: User role distribution & account status
    user_role_res = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    user_role_distribution = {
        str(row[0].value if hasattr(row[0], "value") else row[0]): int(row[1])
        for row in user_role_res.all()
    }

    tot_user_res = await db.execute(select(func.count(User.id)))
    total_users = tot_user_res.scalar() or 0

    active_user_res = await db.execute(
        select(func.count(User.id)).where(User.is_active.is_(True))
    )
    active_users = active_user_res.scalar() or 0

    # 7. Governance Telemetry: Audit activity categories
    audit_category_breakdown = {}
    for l in AuditService.get_logs(limit=500):
        audit_category_breakdown[l.event_type] = audit_category_breakdown.get(l.event_type, 0) + 1

    # 8. Format recent hospitals (load only recent 10, batch doctor count)
    recent_res = await db.execute(
        select(Hospital)
        .options(selectinload(Hospital.departments))
        .order_by(Hospital.created_at.desc())
        .limit(10)
    )
    recent_hospitals = recent_res.scalars().all()
    recent_ids = [h.id for h in recent_hospitals]
    doc_counts = {}
    if recent_ids:
        doc_c = await db.execute(
            select(Doctor.hospital_id, func.count(Doctor.id))
            .where(Doctor.hospital_id.in_(recent_ids))
            .group_by(Doctor.hospital_id)
        )
        doc_counts = dict(doc_c.all())

    recent_hosp_items: List[AdminHospitalItemResponse] = [
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
            doctors_count=doc_counts.get(h.id, 0),
            created_at=h.created_at,
        )
        for h in recent_hospitals
    ]

    return AdminDashboardSummaryResponse(
        total_hospitals=total_hospitals,
        pending_hospital_approvals=pending_approvals,
        total_doctors=total_doctors,
        total_patients=total_patients,
        total_tickets_issued_today=total_tickets_today,
        total_completed_today=total_completed_today,
        active_queue_sessions_today=active_sessions,
        total_users=total_users,
        active_users=active_users,
        facility_status_breakdown=facility_status_breakdown,
        user_role_distribution=user_role_distribution,
        audit_category_breakdown=audit_category_breakdown,
        guest_patients_count=guest_patients,
        registered_patients_count=total_patients,
        recent_hospitals=recent_hosp_items,
    )


@router.get("/partners", response_model=List[AdminHospitalItemResponse])
async def list_admin_partners(
    status_filter: Optional[VerificationStatus] = None,
    limit: Optional[int] = Query(None, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List registered hospitals with batched counts and verification status"""
    query = (
        select(Hospital)
        .options(selectinload(Hospital.departments))
        .order_by(Hospital.created_at.desc())
    )
    if status_filter:
        query = query.where(Hospital.verification_status == status_filter)
    if isinstance(limit, int):
        query = query.limit(limit)
    if isinstance(offset, int) and offset > 0:
        query = query.offset(offset)

    res = await db.execute(query)
    hospitals = res.scalars().all()

    # Batch doctor counts in ONE query instead of 1,350 roundtrips
    hosp_ids = [h.id for h in hospitals]
    doc_counts = {}
    if hosp_ids:
        doc_c = await db.execute(
            select(Doctor.hospital_id, func.count(Doctor.id))
            .where(Doctor.hospital_id.in_(hosp_ids))
            .group_by(Doctor.hospital_id)
        )
        doc_counts = dict(doc_c.all())

    return [
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
            doctors_count=doc_counts.get(h.id, 0),
            created_at=h.created_at,
        )
        for h in hospitals
    ]


@router.post("/partners/{hospital_id}/verify", response_model=AdminHospitalItemResponse)
async def verify_partner_hospital(
    hospital_id: uuid.UUID,
    data: HospitalVerificationRequest,
    current_admin: User = Depends(get_current_user),
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

    # Real-time WebSocket broadcast to all connected admin clients
    try:
        status_val = str(hospital.verification_status.value if hasattr(hospital.verification_status, "value") else hospital.verification_status)
        await manager.broadcast_to_channel("global", {
            "event": "partner_verification_updated",
            "hospital_id": str(hospital.id),
            "status": status_val,
        })
        await AuditService.record_log(
            event_type="HOSPITAL_VERIFICATION",
            action=f"Partner Verification: {status_val}",
            actor_name=current_admin.full_name,
            actor_role=str(current_admin.role.value if hasattr(current_admin.role, "value") else current_admin.role),
            actor_email=current_admin.email,
            target_entity=hospital.name,
            details=f"Verification status set to {status_val}" + (f" (Reason: {data.rejection_reason})" if data.rejection_reason else ""),
            status="SUCCESS" if data.status == VerificationStatus.APPROVED else "WARNING",
        )
    except Exception:
        pass

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
    limit: Optional[int] = Query(100, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Directory of all users across the platform with batched hospital resolution"""
    query = select(User).order_by(User.created_at.desc())

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

    if isinstance(limit, int):
        query = query.limit(limit)
    if isinstance(offset, int) and offset > 0:
        query = query.offset(offset)

    res = await db.execute(query)
    users = res.scalars().all()

    # Batch hospital lookups in ONE query
    hosp_ids = list({u.hospital_id for u in users if u.hospital_id})
    hosp_names = {}
    if hosp_ids:
        h_res = await db.execute(select(Hospital.id, Hospital.name).where(Hospital.id.in_(hosp_ids)))
        hosp_names = dict(h_res.all())

    return [
        AdminUserItemResponse(
            id=u.id,
            email=u.email,
            phone_number=u.phone_number,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            is_verified=u.is_verified,
            hospital_name=hosp_names.get(u.hospital_id) if u.hospital_id else None,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.put("/users/{user_id}/status", response_model=AdminUserItemResponse)
async def update_user_status(
    user_id: uuid.UUID,
    data: UserStatusUpdateRequest,
    current_admin: User = Depends(get_current_user),
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

    # Real-time WebSocket broadcast to all connected admin clients
    try:
        await manager.broadcast_to_channel("global", {
            "event": "user_status_updated",
            "user_id": str(user.id),
            "is_active": user.is_active,
        })
        user_role_str = str(user.role.value if hasattr(user.role, "value") else user.role)
        status_text = "Enabled" if data.is_active else "Disabled"
        await AuditService.record_log(
            event_type="USER_PERMISSION",
            action=f"Account Permission {status_text}",
            actor_name=current_admin.full_name,
            actor_role=str(current_admin.role.value if hasattr(current_admin.role, "value") else current_admin.role),
            actor_email=current_admin.email,
            target_entity=f"{user.full_name} ({user_role_str})",
            details=f"Account active state changed to {data.is_active}",
            status="SUCCESS" if data.is_active else "WARNING",
        )
    except Exception:
        pass

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


@router.get("/activity-logs", response_model=List[ActivityAuditLogItem])
async def list_activity_audit_logs(
    event_type: Optional[str] = Query(None, description="Event type filter: LOGIN, LOGOUT, HOSPITAL_VERIFICATION, USER_PERMISSION, SECURITY_ALERT, AUTH"),
    actor_role: Optional[str] = Query(None, description="Actor role filter"),
    search: Optional[str] = Query(None, description="Search query across actor, target, details, IP"),
    limit: int = Query(100, ge=1, le=500),
):
    """Platform-wide audit and activity logs tracking partner logins/logouts and superadmin permission actions."""
    return AuditService.get_logs(
        event_type=event_type,
        actor_role=actor_role,
        search=search,
        limit=limit,
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


@router.get("/ai-telemetry")
async def get_ai_telemetry(db: AsyncSession = Depends(get_db)):
    """AI Foundry telemetry, rate limit tracking, and guardrail health"""
    stmt = select(GuestRateLimit).order_by(GuestRateLimit.updated_at.desc()).limit(50)
    res = await db.execute(stmt)
    records = res.scalars().all()

    limits_data = [
        {
            "id": str(r.id),
            "identifier": r.identifier[:16] + "..." if len(r.identifier) > 20 else r.identifier,
            "identifier_type": r.identifier_type,
            "message_count": r.message_count,
            "max_allowed": 7 if r.identifier_type == "fingerprint" else 20,
            "window_start": r.window_start.isoformat() if r.window_start else None,
            "window_expires_at": r.window_expires_at.isoformat() if r.window_expires_at else None,
            "is_rate_limited": r.message_count >= (7 if r.identifier_type == "fingerprint" else 20),
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in records
    ]

    total_tracked = len(records)
    rate_limited_count = sum(1 for item in limits_data if item["is_rate_limited"])

    return {
        "status": "OPERATIONAL",
        "model_name": "Azure OpenAI (GPT-4o)",
        "guardrail_status": "ACTIVE_ENFORCED",
        "vision_engine": "ACTIVE",
        "max_guest_limit_per_hour": 7,
        "max_ip_limit_per_hour": 20,
        "total_guests_tracked": total_tracked,
        "active_rate_limited_guests": rate_limited_count,
        "recent_limits": limits_data,
    }


@router.post("/guest-limits/{limit_id}/reset")
async def reset_guest_limit(
    limit_id: uuid.UUID,
    current_admin: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reset a guest rate limit quota back to 0"""
    res = await db.execute(select(GuestRateLimit).where(GuestRateLimit.id == limit_id))
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Guest limit record not found")

    old_count = record.message_count
    record.message_count = 0
    await db.commit()
    await db.refresh(record)

    try:
        await AuditService.record_log(
            event_type="SECURITY_ALERT",
            action="Guest Rate Limit Reset",
            actor_name=current_admin.full_name,
            actor_role="SUPER_ADMIN",
            actor_email=current_admin.email,
            target_entity=record.identifier[:16] + "...",
            details=f"Message count reset from {old_count} to 0",
            status="SUCCESS",
        )
    except Exception:
        pass

    return {
        "id": str(record.id),
        "message_count": 0,
        "status": "RESET_SUCCESSFUL",
    }
