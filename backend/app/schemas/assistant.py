import uuid
import enum
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class UrgencyLevel(str, enum.Enum):
    EMERGENCY = "EMERGENCY"
    URGENT = "URGENT"
    STANDARD = "STANDARD"


class TriageRequest(BaseModel):
    symptoms: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    existing_conditions: Optional[str] = None


class TriageHospitalMatch(BaseModel):
    hospital_id: uuid.UUID
    hospital_name: str
    department_id: uuid.UUID
    department_name: str
    department_code: Optional[str] = None
    waiting_patients: int
    estimated_wait_minutes: int
    address: Optional[str] = None
    distance_km: Optional[float] = None


class TriageResponse(BaseModel):
    urgency_level: UrgencyLevel
    recommended_specialty: str
    clinical_summary: str
    advice: str
    matching_hospitals: List[TriageHospitalMatch] = []


from datetime import datetime


class ChatHistoryItem(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AssistantChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatHistoryItem]] = []
    language: Optional[str] = "en"
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None
    conversation_id: Optional[uuid.UUID] = None
    image_url: Optional[str] = None


class AssistantChatResponse(BaseModel):
    reply: str
    urgency_level: Optional[UrgencyLevel] = None
    recommended_specialty: Optional[str] = None
    matching_hospitals: List[TriageHospitalMatch] = []
    booked_ticket: Optional[dict] = None
    suggested_actions: List[str] = []
    detected_language: Optional[str] = None
    conversation_id: Optional[uuid.UUID] = None
    requires_disclaimer: bool = False


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    image_url: Optional[str] = None
    triage_data: Optional[dict] = None
    booked_ticket: Optional[dict] = None
    suggested_actions: Optional[List[str]] = None
    created_at: datetime


class ConversationSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message: Optional[str] = None


class ConversationDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []


class CreateConversationRequest(BaseModel):
    title: Optional[str] = None


class UpdateConversationRequest(BaseModel):
    title: str


