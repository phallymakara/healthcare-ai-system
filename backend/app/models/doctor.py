import uuid
from datetime import date, datetime, time
from typing import TYPE_CHECKING, Optional

from app.core.database import Base
from app.models.enums import OverrideType
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.hospital import Department
    from app.models.queue import QueueSession, Ticket
    from app.models.user import User


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        unique=True,
        nullable=True,
    )
    hospital_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hospitals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    branch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hospital_branches.id", ondelete="SET NULL"),
        nullable=True,
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    full_name_km: Mapped[str | None] = mapped_column(String(128), nullable=True)
    specialty: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    specialty_km: Mapped[str | None] = mapped_column(String(128), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    room_number: Mapped[str | None] = mapped_column(String(64), nullable=True)

    avg_consultation_minutes: Mapped[int] = mapped_column(
        Integer, default=15, nullable=False
    )
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="doctor_profile"
    )
    department: Mapped["Department"] = relationship(
        "Department", back_populates="doctors"
    )
    schedules: Mapped[list["DoctorSchedule"]] = relationship(
        "DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan"
    )
    overrides: Mapped[list["ScheduleOverride"]] = relationship(
        "ScheduleOverride", back_populates="doctor", cascade="all, delete-orphan"
    )
    queue_sessions: Mapped[list["QueueSession"]] = relationship(
        "QueueSession", back_populates="doctor"
    )
    tickets: Mapped[list["Ticket"]] = relationship("Ticket", back_populates="doctor")


class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day_of_week: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    max_patients_per_slot: Mapped[int] = mapped_column(
        Integer, default=30, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="schedules")


class ScheduleOverride(Base):
    __tablename__ = "schedule_overrides"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    specific_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    override_type: Mapped[OverrideType] = mapped_column(
        Enum(OverrideType, name="override_type_enum"),
        default=OverrideType.LEAVE,
        nullable=False,
    )
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="overrides")
