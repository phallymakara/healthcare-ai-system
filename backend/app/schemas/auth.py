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
    email: Optional[EmailStr] = None
    phone_number: str = Field(..., min_length=8, max_length=32)
    password: str = Field(..., min_length=6)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class PartnerRegisterRequest(BaseModel):
    # Organization
    hospital_name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    address: str = Field(..., min_length=5)
    hospital_phone: str
    hospital_email: EmailStr
    website: Optional[str] = None
    
    # Primary Admin User
    admin_full_name: str = Field(..., min_length=2)
    admin_email: EmailStr
    admin_phone: str
    admin_password: str = Field(..., min_length=6)


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
