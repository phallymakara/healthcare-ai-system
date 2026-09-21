import hashlib
import logging
from datetime import datetime, timedelta
from typing import Tuple, Optional
from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.guest_rate_limit import GuestRateLimit

logger = logging.getLogger(__name__)


class GuestLimitService:
    MAX_GUEST_MESSAGES_PER_HOUR = 7
    MAX_IP_MESSAGES_PER_HOUR = 20
    WINDOW_DURATION_HOURS = 1

    @classmethod
    def get_client_ip(cls, request: Request) -> str:
        """Extract client real IP address, prioritizing forwarded headers if available."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Client IP is the first entry in comma-separated chain
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        if request.client and request.client.host:
            return request.client.host.strip()
        return "127.0.0.1"

    @classmethod
    def get_client_device_id(cls, request: Request) -> str:
        """Extract client device UUID from X-Device-Id header or cookie."""
        header_device_id = request.headers.get("X-Device-Id")
        if header_device_id and len(header_device_id.strip()) > 8:
            return header_device_id.strip()
        cookie_device_id = request.cookies.get("carequeue_device_id")
        if cookie_device_id and len(cookie_device_id.strip()) > 8:
            return cookie_device_id.strip()
        return "anon_device"

    @classmethod
    def generate_fingerprint(cls, device_id: str, ip: str, user_agent: str) -> str:
        """Generate a deterministic SHA-256 fingerprint from device ID, IP, and User-Agent."""
        raw = f"{device_id.strip()}:{ip.strip()}:{user_agent.strip()}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @classmethod
    async def check_and_increment(
        cls,
        request: Request,
        db: AsyncSession,
        custom_device_id: Optional[str] = None,
    ) -> Tuple[bool, int, int]:
        """Validates guest message quota and increments usage atomically.

        Returns:
            Tuple[is_allowed, current_count, minutes_remaining]
        """
        now = datetime.utcnow()
        ip = cls.get_client_ip(request)
        device_id = custom_device_id or cls.get_client_device_id(request)
        user_agent = request.headers.get("User-Agent", "unknown_client")

        fp_identifier = cls.generate_fingerprint(device_id, ip, user_agent)
        ip_identifier = f"ip:{ip}"

        # 1. Query active (non-expired) rate limit records
        stmt = select(GuestRateLimit).where(
            GuestRateLimit.identifier.in_([fp_identifier, ip_identifier]),
            GuestRateLimit.window_expires_at > now,
        )
        result = await db.execute(stmt)
        records = result.scalars().all()

        fp_record: Optional[GuestRateLimit] = None
        ip_record: Optional[GuestRateLimit] = None

        for r in records:
            if r.identifier == fp_identifier:
                fp_record = r
            elif r.identifier == ip_identifier:
                ip_record = r

        # 2. Check IP Ceiling Throttling (Anti-Bot / Device-ID Rotation Protection)
        if ip_record and ip_record.message_count >= cls.MAX_IP_MESSAGES_PER_HOUR:
            remaining_seconds = max(0.0, (ip_record.window_expires_at - now).total_seconds())
            mins_left = max(1, int(remaining_seconds / 60))
            logger.warning(
                f"Guest IP rate limit ceiling reached: ip={ip} count={ip_record.message_count}/{cls.MAX_IP_MESSAGES_PER_HOUR}"
            )
            return False, ip_record.message_count, mins_left

        # 3. Check Device Fingerprint Quota (7 messages/hour)
        if fp_record and fp_record.message_count >= cls.MAX_GUEST_MESSAGES_PER_HOUR:
            remaining_seconds = max(0.0, (fp_record.window_expires_at - now).total_seconds())
            mins_left = max(1, int(remaining_seconds / 60))
            logger.info(
                f"Guest device rate limit reached: device={device_id[:12]}... ip={ip} count={fp_record.message_count}/{cls.MAX_GUEST_MESSAGES_PER_HOUR}"
            )
            return False, fp_record.message_count, mins_left

        # 4. Increment or Initialize Records
        window_expiry = now + timedelta(hours=cls.WINDOW_DURATION_HOURS)

        # Update or create Device Fingerprint record
        if fp_record:
            fp_record.message_count += 1
            fp_record.updated_at = now
            current_fp_count = fp_record.message_count
        else:
            fp_record = GuestRateLimit(
                identifier=fp_identifier,
                identifier_type="fingerprint",
                message_count=1,
                window_start=now,
                window_expires_at=window_expiry,
                created_at=now,
                updated_at=now,
            )
            db.add(fp_record)
            current_fp_count = 1

        # Update or create IP ceiling record
        if ip_record:
            ip_record.message_count += 1
            ip_record.updated_at = now
        else:
            ip_record = GuestRateLimit(
                identifier=ip_identifier,
                identifier_type="ip",
                message_count=1,
                window_start=now,
                window_expires_at=window_expiry,
                created_at=now,
                updated_at=now,
            )
            db.add(ip_record)

        await db.commit()
        return True, current_fp_count, 0
