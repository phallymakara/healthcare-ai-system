import uuid
import enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationChannel(str, enum.Enum):
    IN_APP = "IN_APP"
    SMS = "SMS"
    TELEGRAM = "TELEGRAM"


class NotificationType(str, enum.Enum):
    TICKET_BOOKED = "TICKET_BOOKED"
    TURN_APPROACHING = "TURN_APPROACHING"
    PATIENT_CALLED = "PATIENT_CALLED"
    VISIT_COMPLETED = "VISIT_COMPLETED"
    GENERAL = "GENERAL"


class SendNotificationRequest(BaseModel):
    user_id: Optional[uuid.UUID] = None
    phone_number: Optional[str] = None
    ticket_id: Optional[uuid.UUID] = None
    notification_type: NotificationType
    channel: NotificationChannel = NotificationChannel.IN_APP
    title: str
    message: str


class NotificationItemResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    ticket_id: Optional[uuid.UUID] = None
    notification_type: NotificationType
    channel: NotificationChannel
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
