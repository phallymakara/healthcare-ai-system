import uuid
from datetime import time, date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

from app.models.enums import OverrideType, QueueStatus


# --- Department Schemas ---

class DepartmentCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    code: str = Field(..., min_length=2, max_length=16)  # e.g., "CARDIO", "DERM"
    description: Optional[str] = None
    floor_room: Optional[str] = None
    avg_consultation_minutes: int = Field(default=15, ge=5, le=120)
    branch_id: Optional[uuid.UUID] = None


class DepartmentResponse(BaseModel):
    id: uuid.UUID
    hospital_id: uuid.UUID
    branch_id: Optional[uuid.UUID] = None
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    floor_room: Optional[str] = None
    avg_consultation_minutes: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Service Schemas ---

class ServiceCreateSchema(BaseModel):
    department_id: uuid.UUID
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    duration_minutes: int = Field(default=20, ge=5, le=180)
    price: float = Field(default=0.0, ge=0.0)


class ServiceResponse(BaseModel):
    id: uuid.UUID
    hospital_id: uuid.UUID
    department_id: uuid.UUID
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: float
    is_active: bool

    model_config = {"from_attributes": True}


# --- Doctor Schemas ---

class DoctorScheduleSchema(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time
    max_patients_per_slot: int = Field(default=25, ge=1)
    is_active: bool = True


class DoctorScheduleResponse(BaseModel):
    id: uuid.UUID
    doctor_id: uuid.UUID
    day_of_week: int
    start_time: time
    end_time: time
    max_patients_per_slot: int
    is_active: bool

    model_config = {"from_attributes": True}


class DoctorCreateSchema(BaseModel):
    department_id: uuid.UUID
    branch_id: Optional[uuid.UUID] = None
    full_name: str = Field(..., min_length=2, max_length=128)
    specialty: str = Field(..., min_length=2, max_length=128)
    license_number: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    room_number: Optional[str] = None
    avg_consultation_minutes: int = Field(default=15, ge=5, le=120)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None  # If creating a doctor login account


class DoctorResponse(BaseModel):
    id: uuid.UUID
    hospital_id: uuid.UUID
    branch_id: Optional[uuid.UUID] = None
    department_id: uuid.UUID
    full_name: str
    specialty: str
    license_number: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    room_number: Optional[str] = None
    avg_consultation_minutes: int
    is_available: bool
    is_active: bool
    schedules: List[DoctorScheduleResponse] = []

    model_config = {"from_attributes": True}


# --- Dashboard Metrics ---

class DepartmentQueueSummary(BaseModel):
    department_id: uuid.UUID
    department_name: str
    code: Optional[str] = None
    session_id: Optional[uuid.UUID] = None
    queue_status: QueueStatus
    current_serving_number: Optional[str] = None
    waiting_count: int
    completed_today: int
    avg_wait_minutes: int


class PartnerDashboardMetricsResponse(BaseModel):
    hospital_id: uuid.UUID
    hospital_name: str
    total_tickets_today: int
    currently_waiting: int
    currently_serving: int
    completed_today: int
    skipped_no_show_today: int
    average_wait_minutes: int
    departments: List[DepartmentQueueSummary]
