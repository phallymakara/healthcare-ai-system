import uuid
import enum
from typing import Optional, List
from pydantic import BaseModel


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


class TriageResponse(BaseModel):
    urgency_level: UrgencyLevel
    recommended_specialty: str
    clinical_summary: str
    advice: str
    matching_hospitals: List[TriageHospitalMatch] = []


class AssistantChatRequest(BaseModel):
    message: str


class AssistantChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
