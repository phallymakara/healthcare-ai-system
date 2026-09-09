import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.enums import TicketStatus, TicketSource, QueueStatus


# --- Request Schemas ---

class OpenQueueSessionRequest(BaseModel):
    hospital_id: uuid.UUID
    department_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    branch_id: Optional[uuid.UUID] = None


class BookTicketRequest(BaseModel):
    hospital_id: uuid.UUID
    department_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    # Patient details (optional if authenticated user)
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None


class WalkInTicketRequest(BaseModel):
    hospital_id: uuid.UUID
    department_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    patient_name: str = Field(..., min_length=2)
    patient_phone: Optional[str] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None


class TicketActionRequest(BaseModel):
    note: Optional[str] = None


class TransferTicketRequest(BaseModel):
    target_department_id: uuid.UUID
    target_doctor_id: Optional[uuid.UUID] = None
    reason: Optional[str] = None


# --- Response Schemas ---

class TicketLogResponse(BaseModel):
    id: uuid.UUID
    from_status: Optional[TicketStatus] = None
    to_status: TicketStatus
    actor_id: Optional[uuid.UUID] = None
    note: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class TicketResponse(BaseModel):
    id: uuid.UUID
    ticket_number: str
    queue_session_id: uuid.UUID
    hospital_id: uuid.UUID
    department_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    patient_id: Optional[uuid.UUID] = None
    patient_name: str
    patient_phone: Optional[str] = None
    ticket_source: TicketSource
    status: TicketStatus
    position: int
    estimated_wait_minutes: int
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    called_at: Optional[datetime] = None
    serving_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Enriched Facility, Doctor & Service Context
    hospital_name: Optional[str] = None
    hospital_logo_url: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_phone: Optional[str] = None
    hospital_latitude: Optional[float] = None
    hospital_longitude: Optional[float] = None
    department_name: Optional[str] = None
    department_floor_room: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None
    doctor_photo_url: Optional[str] = None
    room_number: Optional[str] = None
    service_name: Optional[str] = None

    model_config = {"from_attributes": True}


class TicketDetailResponse(TicketResponse):
    logs: List[TicketLogResponse] = []

    model_config = {"from_attributes": True}


class LiveQueueStatusResponse(BaseModel):
    session_id: uuid.UUID
    department_id: uuid.UUID
    department_name: str
    doctor_id: Optional[uuid.UUID] = None
    doctor_name: Optional[str] = None
    status: QueueStatus
    current_serving_number: Optional[str] = None
    current_serving_ticket_id: Optional[uuid.UUID] = None
    total_waiting: int
    total_completed_today: int
    estimated_wait_minutes_for_new: int
    active_tickets: List[TicketResponse]
    skipped_tickets: List[TicketResponse] = []


class QueueSessionResponse(BaseModel):
    id: uuid.UUID
    hospital_id: uuid.UUID
    branch_id: Optional[uuid.UUID] = None
    department_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    session_date: date
    status: QueueStatus
    current_serving_number: Optional[str] = None
    current_serving_ticket_id: Optional[uuid.UUID] = None
    total_issued_today: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Slot Availability Schemas ---

class SlotAvailabilityItem(BaseModel):
    slot: str
    is_booked: bool
    booked_count: int
    max_capacity: int = 1
    available_spots: int


class SlotsAvailabilityResponse(BaseModel):
    date: str
    hospital_id: uuid.UUID
    department_id: Optional[uuid.UUID] = None
    doctor_id: Optional[uuid.UUID] = None
    total_slots: int
    available_slots: int
    booked_slots: int
    slots: List[SlotAvailabilityItem]

