import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User
from app.schemas.notification import (
    NotificationItemResponse,
    SendNotificationRequest,
    NotificationType,
    NotificationChannel,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notification Engine"])


@router.get("/my-notifications", response_model=List[NotificationItemResponse])
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
):
    """Retrieve in-app notifications for the logged-in patient or staff member"""
    return NotificationService.get_user_notifications(
        user_id=current_user.id,
        phone_number=current_user.phone_number,
    )


@router.post("/test-dispatch", response_model=NotificationItemResponse)
async def test_dispatch_notification(
    data: SendNotificationRequest,
    current_user: User = Depends(get_current_user),
):
    """Trigger a test multi-channel notification"""
    return await NotificationService.dispatch(
        title=data.title,
        message=data.message,
        notification_type=data.notification_type,
        user_id=data.user_id or current_user.id,
        phone_number=data.phone_number or current_user.phone_number,
        ticket_id=data.ticket_id,
        channel=data.channel,
    )
