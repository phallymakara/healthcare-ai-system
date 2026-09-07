import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole, VerificationStatus


# --- Request Schemas ---

class LoginRequest(BaseModel):
    account: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    password: str = ""

    @property
    def identifier(self) -> str:
        return (self.account or self.email or self.username or "").strip()



class PatientRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=128)
    contact_identifier: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    password: str = Field(..., min_length=6)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class PartnerRegisterRequest(BaseModel):
    # Organization
    hospital_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    logo_url: Optional[str] = None
    emergency_service_available: Optional[bool] = False
    
    # Unified Official Contact (Email or Phone)
    contact_identifier: Optional[str] = None
    hospital_phone: Optional[str] = None
    hospital_email: Optional[EmailStr] = None
    website: Optional[str] = None
    
    # Primary Admin User / Credentials
    admin_full_name: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    admin_phone: Optional[str] = None
    password: Optional[str] = None
    admin_password: Optional[str] = None

    # Initial Department Setup (Optional during onboarding)
    initial_department_name: Optional[str] = None
    initial_department_room: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# --- Response Schemas ---

class PatientProfileResponse(BaseModel):
    id: uuid.UUID
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: uuid.UUID
    email: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    profile_photo_url: Optional[str] = None
    hospital_id: Optional[uuid.UUID] = None
    branch_id: Optional[uuid.UUID] = None
    patient_profile: Optional[PatientProfileResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
