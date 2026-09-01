import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole, VerificationStatus, TicketStatus


# --- Request Schemas ---

class HospitalVerificationRequest(BaseModel):
    status: VerificationStatus
    rejection_reason: Optional[str] = None


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


# --- Response Schemas ---

class AdminHospitalItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    is_verified: bool
    verification_status: VerificationStatus
    departments_count: int
    doctors_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserItemResponse(BaseModel):
    id: uuid.UUID
    email: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    hospital_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminAuditLogItemResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    ticket_number: str
    hospital_name: str
    department_name: str
    from_status: Optional[TicketStatus] = None
    to_status: TicketStatus
    actor_name: Optional[str] = None
    note: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class AdminDashboardSummaryResponse(BaseModel):
    total_hospitals: int
    pending_hospital_approvals: int
    total_doctors: int
    total_patients: int
    total_tickets_issued_today: int
    total_completed_today: int
    active_queue_sessions_today: int
    recent_hospitals: List[AdminHospitalItemResponse]
