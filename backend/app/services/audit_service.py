import logging
import uuid
from collections import deque
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

from app.core.websocket import manager
from app.schemas.admin import ActivityAuditLogItem

logger = logging.getLogger("healthcare_ai.audit")

# In-memory fast ring buffer for audit logs (capped to last 1000 items)
_MEMORY_AUDIT_LOGS: deque = deque(maxlen=1000)
_INITIALIZED_SEEDS = False


class AuditService:
    @classmethod
    async def record_log(
        cls,
        event_type: str,
        action: str,
        actor_name: str,
        actor_role: str,
        actor_email: Optional[str] = None,
        target_entity: Optional[str] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
        status: str = "SUCCESS",
        timestamp: Optional[datetime] = None,
    ) -> ActivityAuditLogItem:
        """
        Record a system or security audit event, store it, and broadcast to active Super Admin clients.
        """
        item = ActivityAuditLogItem(
            id=str(uuid.uuid4()),
            event_type=event_type,
            action=action,
            actor_name=actor_name,
            actor_role=actor_role,
            actor_email=actor_email,
            target_entity=target_entity,
            details=details,
            ip_address=ip_address or "127.0.0.1",
            status=status,
            timestamp=timestamp or datetime.utcnow(),
        )

        _MEMORY_AUDIT_LOGS.appendleft(item)

        # Broadcast in real-time over WebSocket to superadmins
        try:
            await manager.broadcast_to_channel(
                "global",
                {
                    "event": "audit_log_created",
                    "log": item.model_dump(mode="json"),
                },
            )
        except Exception as e:
            logger.debug("Failed to broadcast audit log event: %s", e)

        return item

    @classmethod
    def get_logs(
        cls,
        event_type: Optional[str] = None,
        actor_role: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
    ) -> List[ActivityAuditLogItem]:
        """
        Retrieve filtered audit logs.
        """
        cls._ensure_seed_data()

        logs = list(_MEMORY_AUDIT_LOGS)

        # 1. Filter by event_type
        if event_type and event_type.upper() != "ALL":
            ev = event_type.upper()
            if ev == "AUTH":
                logs = [l for l in logs if l.event_type in ("LOGIN", "LOGOUT")]
            else:
                logs = [l for l in logs if l.event_type == ev]

        # 2. Filter by actor_role
        if actor_role and actor_role.upper() != "ALL":
            logs = [l for l in logs if l.actor_role.upper() == actor_role.upper()]

        # 3. Search query across actor, email, action, target_entity, details, and IP
        if search and search.strip():
            q = search.strip().lower()
            logs = [
                l for l in logs
                if (
                    q in l.actor_name.lower()
                    or (l.actor_email and q in l.actor_email.lower())
                    or q in l.action.lower()
                    or (l.target_entity and q in l.target_entity.lower())
                    or (l.details and q in l.details.lower())
                    or (l.ip_address and q in l.ip_address.lower())
                    or q in l.actor_role.lower()
                )
            ]

        return logs[:limit]

    @classmethod
    def _ensure_seed_data(cls):
        """Pre-populate baseline activity logs if the buffer is empty."""
        global _INITIALIZED_SEEDS
        if _INITIALIZED_SEEDS or len(_MEMORY_AUDIT_LOGS) > 0:
            return

        now = datetime.utcnow()
        sample_entries = [
            ActivityAuditLogItem(
                id=str(uuid.uuid4()),
                event_type="LOGIN",
                action="Super Admin Authentication",
                actor_name="Platform Super Admin",
                actor_role="SUPER_ADMIN",
                actor_email="admin@carequeue.ai",
                target_entity="Security Console",
                details="Authenticated successfully from local subnet",
                ip_address="192.168.1.12",
                status="SUCCESS",
                timestamp=now - timedelta(minutes=4),
            ),
            ActivityAuditLogItem(
                id=str(uuid.uuid4()),
                event_type="HOSPITAL_VERIFICATION",
                action="Partner Facility Verified",
                actor_name="Platform Super Admin",
                actor_role="SUPER_ADMIN",
                actor_email="admin@carequeue.ai",
                target_entity="Calmette National Hospital",
                details="Verification status updated to APPROVED. Licensed operations active.",
                ip_address="192.168.1.12",
                status="SUCCESS",
                timestamp=now - timedelta(minutes=18),
            ),
            ActivityAuditLogItem(
                id=str(uuid.uuid4()),
                event_type="LOGIN",
                action="Partner Doctor Login",
                actor_name="Dr. Sokha Chen",
                actor_role="DOCTOR",
                actor_email="sokha.chen@calmette.gov.kh",
                target_entity="Calmette National Hospital",
                details="Started OPD shift in Cardiology Consultation Room 3",
                ip_address="203.189.144.10",
                status="SUCCESS",
                timestamp=now - timedelta(minutes=35),
            ),
            ActivityAuditLogItem(
                id=str(uuid.uuid4()),
                event_type="USER_PERMISSION",
                action="Account Permission Updated",
                actor_name="Platform Super Admin",
                actor_role="SUPER_ADMIN",
                actor_email="admin@carequeue.ai",
                target_entity="Dr. Chan Vanna (DOCTOR)",
                details="Account enabled with active clinic triage clearance",
                ip_address="192.168.1.12",
                status="SUCCESS",
                timestamp=now - timedelta(hours=1, minutes=10),
            ),
            ActivityAuditLogItem(
                id=str(uuid.uuid4()),
                event_type="LOGIN",
                action="Clinic Admin Login",
                actor_name="Preah Ket Mealea Admin",
                actor_role="HOSPITAL_ADMIN",
                actor_email="admin@pkm-hospital.gov.kh",
                target_entity="Preah Ket Mealea Hospital",
                details="Logged in to manage hospital staff roster and counter queue",
                ip_address="203.189.144.52",
                status="SUCCESS",
                timestamp=now - timedelta(hours=2, minutes=5),
            ),
            ActivityAuditLogItem(
                id=str(uuid.uuid4()),
                event_type="LOGOUT",
                action="Partner Staff Logout",
                actor_name="Nurse Bopha Rath",
                actor_role="RECEPTIONIST",
                actor_email="bopha.rath@calmette.gov.kh",
                target_entity="Calmette National Hospital",
                details="Shift concluded. Session closed normally.",
                ip_address="203.189.144.15",
                status="INFO",
                timestamp=now - timedelta(hours=3, minutes=20),
            ),
            ActivityAuditLogItem(
                id=str(uuid.uuid4()),
                event_type="SECURITY_ALERT",
                action="Access Policy Check",
                actor_name="Security Guardrail",
                actor_role="SYSTEM",
                actor_email="security@carequeue.ai",
                target_entity="Global API Gateway",
                details="Routine token validation check passed. Zero unauthorized escalations.",
                ip_address="127.0.0.1",
                status="SUCCESS",
                timestamp=now - timedelta(hours=5),
            ),
        ]

        for entry in sample_entries:
            _MEMORY_AUDIT_LOGS.append(entry)

        _INITIALIZED_SEEDS = True
