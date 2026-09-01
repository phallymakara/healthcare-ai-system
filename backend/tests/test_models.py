import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Hospital,
    Doctor,
    User,
    QueueSession,
    Ticket,
    TicketStatus,
    UserRole,
)


@pytest.mark.asyncio
async def test_query_hospitals_and_departments(db_session: AsyncSession):
    result = await db_session.execute(
        select(Hospital)
        .options(selectinload(Hospital.departments), selectinload(Hospital.branches))
    )
    hospitals = result.scalars().all()
    assert len(hospitals) >= 1
    hosp = hospitals[0]
    assert hosp.slug == "royal-city-general-hospital"
    assert len(hosp.departments) >= 3
    assert any(d.code == "CARDIO" for d in hosp.departments)


@pytest.mark.asyncio
async def test_query_doctor_and_schedules(db_session: AsyncSession):
    result = await db_session.execute(
        select(Doctor)
        .options(
            selectinload(Doctor.department),
            selectinload(Doctor.schedules),
            selectinload(Doctor.user),
        )
    )
    doctors = result.scalars().all()
    assert len(doctors) >= 2
    cardiologist = next(d for d in doctors if "Cardiologist" in d.specialty)
    assert cardiologist.full_name == "Dr. Sokha Meas, MD"
    assert cardiologist.department.name == "Cardiology"
    assert len(cardiologist.schedules) == 5  # Mon-Fri


@pytest.mark.asyncio
async def test_query_queue_and_ticket_lifecycle(db_session: AsyncSession):
    result = await db_session.execute(
        select(QueueSession)
        .options(
            selectinload(QueueSession.tickets).selectinload(Ticket.logs),
            selectinload(QueueSession.department),
            selectinload(QueueSession.doctor),
        )
    )
    queues = result.scalars().all()
    assert len(queues) >= 1
    cardio_queue = queues[0]
    assert cardio_queue.current_serving_number is not None
    assert len(cardio_queue.tickets) >= 3

    serving_or_first_ticket = cardio_queue.tickets[0]
    assert serving_or_first_ticket.ticket_number is not None
    assert len(serving_or_first_ticket.logs) >= 1


@pytest.mark.asyncio
async def test_patient_profile_relationship(db_session: AsyncSession):
    result = await db_session.execute(
        select(User)
        .where(User.email == "patient.dararith@gmail.com")
        .options(selectinload(User.patient_profile))
    )
    patient = result.scalar_one_or_none()
    assert patient is not None
    assert patient.role == UserRole.PATIENT
    assert patient.patient_profile is not None
    assert patient.patient_profile.blood_type == "O+"
