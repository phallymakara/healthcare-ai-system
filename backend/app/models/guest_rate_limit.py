import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class GuestRateLimit(Base):
    __tablename__ = "guest_rate_limits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    # identifier: SHA-256 digest of (device_id + ip + user_agent) OR "ip:<client_ip>"
    identifier: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    identifier_type: Mapped[str] = mapped_column(String(16), nullable=False, default="fingerprint")  # "fingerprint" or "ip"
    message_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    window_start: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    window_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        Index("ix_guest_rate_limits_ident_expires", "identifier", "window_expires_at"),
    )
