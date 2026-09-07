import uuid
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, Date, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.models.enums import TicketStatus, TicketSource, QueueStatus

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.hospital import Department, Service
    from app.models.doctor import Doctor


class QueueSession(Base):
    __tablename__ = "queue_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    hospital_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    branch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hospital_branches.id", ondelete="SET NULL"), nullable=True
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True
    )
    
    session_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False, index=True)
    status: Mapped[QueueStatus] = mapped_column(
        Enum(QueueStatus, name="queue_status_enum"), default=QueueStatus.ACTIVE, nullable=False, index=True
    )
    
    current_serving_ticket_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    current_serving_number: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    total_issued_today: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    department: Mapped["Department"] = relationship("Department", back_populates="queue_sessions")
    doctor: Mapped[Optional["Doctor"]] = relationship("Doctor", back_populates="queue_sessions")
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", back_populates="queue_session", cascade="all, delete-orphan", order_by="Ticket.position"
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    ticket_number: Mapped[str] = mapped_column(String(32), nullable=False, index=True) # e.g. "CARD-001"
    queue_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("queue_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    hospital_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    branch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hospital_branches.id", ondelete="SET NULL"), nullable=True
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True
    )
    service_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("services.id", ondelete="SET NULL"), nullable=True
    )
    
    # Patient links (registered user or walk-in patient)
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    patient_name: Mapped[str] = mapped_column(String(128), nullable=False)
    patient_phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    
    ticket_source: Mapped[TicketSource] = mapped_column(
        Enum(TicketSource, name="ticket_source_enum"), default=TicketSource.ONLINE, nullable=False
    )
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="ticket_status_enum"), default=TicketStatus.WAITING, nullable=False, index=True
    )
    
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    estimated_wait_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timestamps for operational analytics & wait-time ML tracking
    appointment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    appointment_time: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    called_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    serving_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    hospital: Mapped["Hospital"] = relationship("Hospital")
    department: Mapped["Department"] = relationship("Department")
    queue_session: Mapped["QueueSession"] = relationship("QueueSession", back_populates="tickets")
    patient: Mapped[Optional["User"]] = relationship("User", back_populates="tickets")
    doctor: Mapped[Optional["Doctor"]] = relationship("Doctor", back_populates="tickets")
    service: Mapped[Optional["Service"]] = relationship("Service", back_populates="tickets")
    logs: Mapped[List["TicketLog"]] = relationship(
        "TicketLog", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketLog.timestamp"
    )


class TicketLog(Base):
    __tablename__ = "ticket_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_status: Mapped[Optional[TicketStatus]] = mapped_column(
        Enum(TicketStatus, name="ticket_status_enum", create_type=False), nullable=True
    )
    to_status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="ticket_status_enum", create_type=False), nullable=False
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="logs")
    actor: Mapped[Optional["User"]] = relationship("User")
