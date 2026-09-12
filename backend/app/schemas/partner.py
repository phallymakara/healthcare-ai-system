import uuid
from datetime import time, date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, field_validator

from app.models.enums import OverrideType, QueueStatus, UserRole


# --- Department Schemas ---

class DepartmentCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    code: Optional[str] = Field(None, max_length=16)  # e.g., "CARDIO", "DERM"
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


class DepartmentUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=128)
    code: Optional[str] = Field(None, min_length=2, max_length=16)
    description: Optional[str] = None
    floor_room: Optional[str] = None
    avg_consultation_minutes: Optional[int] = Field(None, ge=5, le=120)
    is_active: Optional[bool] = None


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


class ServiceUpdateSchema(BaseModel):
    department_id: Optional[uuid.UUID] = None
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=180)
    price: Optional[float] = Field(None, ge=0.0)
    is_active: Optional[bool] = None


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
    full_name: str = Field(..., min_length=1, max_length=128)
    specialty: str = Field(..., min_length=1, max_length=128)
    license_number: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    room_number: Optional[str] = None
    avg_consultation_minutes: int = Field(default=15, ge=1, le=240)
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None  # If creating a doctor login account

    @field_validator("email", "phone", "password", "license_number", "bio", "photo_url", "room_number", mode="before")
    @classmethod
    def clean_empty_strings(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("branch_id", mode="before")
    @classmethod
    def clean_empty_uuid(cls, v):
        if not v or (isinstance(v, str) and not v.strip()):
            return None
        return v


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


class DoctorUpdateSchema(BaseModel):
    department_id: Optional[uuid.UUID] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=128)
    specialty: Optional[str] = Field(None, min_length=1, max_length=128)
    license_number: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    room_number: Optional[str] = None
    avg_consultation_minutes: Optional[int] = Field(None, ge=1, le=240)
    is_available: Optional[bool] = None
    is_active: Optional[bool] = None

    @field_validator("license_number", "bio", "photo_url", "room_number", mode="before")
    @classmethod
    def clean_empty_strings_update(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class DoctorScheduleItem(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time = Field(default=time(8, 0))
    end_time: time = Field(default=time(17, 0))
    max_patients_per_slot: int = Field(default=30, ge=1, le=100)
    is_active: bool = True


class DoctorSchedulesBatchUpdateSchema(BaseModel):
    schedules: List[DoctorScheduleItem]


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
    total_patients: int = 0


class HourlyFlowItem(BaseModel):
    hour: str
    count: int


class PartnerDashboardMetricsResponse(BaseModel):
    hospital_id: uuid.UUID
    hospital_name: str
    total_tickets_today: int
    currently_waiting: int
    currently_serving: int
    completed_today: int
    skipped_no_show_today: int
    average_wait_minutes: int
    online_bookings_today: int = 0
    walkin_tickets_today: int = 0
    hourly_flow: List[HourlyFlowItem] = []
    departments: List[DepartmentQueueSummary]
    total_departments: int = 0
    total_staff: int = 0
    total_services: int = 0
    clearance_rate: int = 0


# --- Staff Schemas ---

class StaffCreateSchema(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=128)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role: UserRole = UserRole.RECEPTIONIST
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class StaffUpdateSchema(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=128)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class StaffResponse(BaseModel):
    id: uuid.UUID
    hospital_id: Optional[uuid.UUID] = None
    full_name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    temp_password: Optional[str] = None

    model_config = {"from_attributes": True}


# --- Hospital Profile Schemas ---

class HospitalProfileResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    emergency_phone: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    emergency_service_available: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}


class HospitalProfileUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    emergency_phone: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    emergency_service_available: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# --- Partner Customer Booking Slots Schemas ---

class PartnerBookingItem(BaseModel):
    id: uuid.UUID
    ticket_number: str
    patient_name: str
    patient_phone: Optional[str] = None
    patient_id: Optional[uuid.UUID] = None
    ticket_source: str
    status: str
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    department_id: uuid.UUID
    department_name: Optional[str] = None
    department_code: Optional[str] = None
    doctor_id: Optional[uuid.UUID] = None
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None
    service_id: Optional[uuid.UUID] = None
    service_name: Optional[str] = None
    position: int = 1
    estimated_wait_minutes: int = 0
    created_at: datetime
    serving_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PartnerBookingsSummary(BaseModel):
    total_bookings: int = 0
    online_bookings: int = 0
    walkin_bookings: int = 0
    waiting_count: int = 0
    serving_count: int = 0
    completed_count: int = 0


class PartnerBookingsResponse(BaseModel):
    bookings: List[PartnerBookingItem] = []
    summary: PartnerBookingsSummary = Field(default_factory=PartnerBookingsSummary)


# --- Asset Storage CRUD Schemas ---

class AssetUploadResponse(BaseModel):
    url: str
    blob_name: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    is_mock: bool = False
    message: str = "Asset uploaded successfully"


class AssetMetadataResponse(BaseModel):
    url: Optional[str] = None
    blob_name: Optional[str] = None
    exists: bool = False
    size: Optional[int] = None
    content_type: Optional[str] = None
    last_modified: Optional[str] = None


class AssetDeleteResponse(BaseModel):
    success: bool
    message: str
