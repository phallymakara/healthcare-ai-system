import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict
from app.schemas.notification import (
    NotificationChannel,
    NotificationType,
    NotificationItemResponse,
)
from app.core.websocket import manager


class NotificationService:
    """Multi-channel notification dispatcher for Queue events"""

    # In-memory storage for user in-app notifications (persistent cache layer)
    _notifications_db: Dict[str, List[NotificationItemResponse]] = {}

    @classmethod
    async def dispatch(
        cls,
        title: str,
        message: str,
        notification_type: NotificationType,
        user_id: Optional[uuid.UUID] = None,
        phone_number: Optional[str] = None,
        ticket_id: Optional[uuid.UUID] = None,
        channel: NotificationChannel = NotificationChannel.IN_APP,
    ) -> NotificationItemResponse:
        item = NotificationItemResponse(
            id=uuid.uuid4(),
            user_id=user_id,
            ticket_id=ticket_id,
            notification_type=notification_type,
            channel=channel,
            title=title,
            message=message,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )

        # 1. Store in user's notification list
        user_key = str(user_id) if user_id else (phone_number or "global")
        if user_key not in cls._notifications_db:
            cls._notifications_db[user_key] = []
        cls._notifications_db[user_key].insert(0, item)

        # 2. Dispatch via WebSocket for In-App Live Alert
        payload = {
            "type": "NOTIFICATION",
            "data": {
                "id": str(item.id),
                "title": item.title,
                "message": item.message,
                "notification_type": item.notification_type.value,
                "ticket_id": str(ticket_id) if ticket_id else None,
                "created_at": item.created_at.isoformat(),
            },
        }

        if ticket_id:
            await manager.broadcast_to_channel(f"ticket:{ticket_id}", payload)
        if user_id:
            await manager.broadcast_to_channel(f"user:{user_id}", payload)

        await manager.broadcast_to_channel("global", payload)

        # 3. Simulate SMS / Telegram Gateway
        if channel == NotificationChannel.SMS or phone_number:
            cls._send_sms_gateway_log(phone_number, title, message)

        return item

    @classmethod
    def get_user_notifications(cls, user_id: Optional[uuid.UUID], phone_number: Optional[str] = None) -> List[NotificationItemResponse]:
        user_key = str(user_id) if user_id else (phone_number or "global")
        return cls._notifications_db.get(user_key, [])

    @classmethod
    def _send_sms_gateway_log(cls, phone: Optional[str], title: str, message: str):
        """SMS Gateway connector (Twilio / Plasgate interface)"""
        print(f"[SMS Gateway Dispatch] To: {phone or 'Patient'} | {title}: {message}")
