"""
seed_test_data.py — Creates EXACTLY the data the test suite expects.
Run in CI after `alembic upgrade head`, before `pytest`.

Users created:
  admin@carequeue.ai              / admin123!   (SUPER_ADMIN)
  dr.sokha@royalcityhospital.com  / doctor123!  (HOSPITAL_ADMIN)
  patient.dararith@gmail.com      / patient123! (PATIENT, phone +85512999001, blood O+)

Hospital: Royal City General Hospital (slug: royal-city-general-hospital)
  Departments: Cardiology (CARDIO), General Medicine (GENERAL), Emergency (EMERGENCY)
Doctor:   Dr. Sokha Meas, MD — Cardiology — 5 schedules Mon-Fri
Queue:    1 active QueueSession with 3 tickets (1 SERVING with TicketLog, 2 WAITING)
"""
import sys
import uuid
import asyncio
import logging
from datetime import datetime, date, time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.enums import (
    UserRole,
    VerificationStatus,
    QueueStatus,
    TicketStatus,
    TicketSource,
)
from app.models.user import User, PatientProfile
from app.models.hospital import Hospital, Department
from app.models.doctor import Doctor, DoctorSchedule
from app.models.queue import QueueSession, Ticket, TicketLog


async def seed():
    print("Seeding CI test data...")

    async with AsyncSessionLocal() as session:
        # 1. Super Admin
        admin = await _get_or_create_user(
            session, "admin@carequeue.ai", None,
            "System Admin", UserRole.SUPER_ADMIN, "admin123!",
        )

        # 2. Hospital
        hospital = await _get_or_create_hospital(session)

        # 3. Doctor users (HOSPITAL_ADMIN & DOCTOR)
        doc_user = await _get_or_create_user(
            session, "dr.sokha@royalcityhospital.com", "+85512100001",
            "Dr. Sokha Meas, MD", UserRole.HOSPITAL_ADMIN, "doctor123!",
            hospital_id=hospital.id,
        )
        doc2_user = await _get_or_create_user(
            session, "dr.vanna@royalcityhospital.com", "+85512100002",
            "Dr. Vanna Sok, MD", UserRole.DOCTOR, "doctor123!",
            hospital_id=hospital.id,
        )

        # 4. Patient
        patient = await _get_or_create_user(
            session, "patient.dararith@gmail.com", "+85512999001",
            "Dararith Ken", UserRole.PATIENT, "patient123!",
        )

        # Patient profile — blood_type O+ required by test_patient_profile_relationship
        p_prof = (await session.execute(
            select(PatientProfile).where(PatientProfile.user_id == patient.id)
        )).scalar_one_or_none()
        if not p_prof:
            session.add(PatientProfile(
                id=uuid.uuid4(), user_id=patient.id,
                blood_type="O+", gender="Male",
                date_of_birth=date(1992, 5, 15),
            ))

        await session.flush()

        # 5. Departments (need >= 3; Cardiology must have code CARDIO)
        cardio = await _get_or_create_dept(session, hospital.id, "Cardiology",      "CARDIO",    20)
        general = await _get_or_create_dept(session, hospital.id, "General Medicine", "GENERAL",   15)
        await _get_or_create_dept(session, hospital.id, "Emergency",        "EMERGENCY", 10)
        await session.flush()

        # 6. Doctor models — Dr. Sokha Meas, MD (Cardiology) + Dr. Vanna Sok, MD (General)
        doctor = await _get_or_create_doctor(
            session, doc_user.id, hospital.id, cardio.id,
            full_name="Dr. Sokha Meas, MD",
            specialty="Senior Cardiologist",
            license_number="MD-KH-2019-0042",
            room_number="Room 201",
            avg_consultation_minutes=20,
            schedule_days=5,
        )
        await _get_or_create_doctor(
            session, doc2_user.id, hospital.id, general.id,
            full_name="Dr. Vanna Sok, MD",
            specialty="General Practitioner",
            license_number="MD-KH-2020-0055",
            room_number="Room 105",
            avg_consultation_minutes=15,
            schedule_days=5,
        )
        await session.flush()

        # 7. Queue Session with 3 tickets (1 SERVING + TicketLog, 2 WAITING)
        q = (await session.execute(
            select(QueueSession).where(
                QueueSession.hospital_id == hospital.id,
                QueueSession.department_id == cardio.id,
                QueueSession.session_date == date.today(),
            )
        )).scalar_one_or_none()

        if not q:
            q = QueueSession(
                id=uuid.uuid4(),
                hospital_id=hospital.id, department_id=cardio.id,
                doctor_id=doctor.id, session_date=date.today(),
                status=QueueStatus.ACTIVE,
                current_serving_number="CARDIO-001",
                total_issued_today=3,
            )
            session.add(q)
            await session.flush()

            # Ticket 1 — SERVING
            t1_id = uuid.uuid4()
            session.add(Ticket(
                id=t1_id, ticket_number="CARDIO-001",
                queue_session_id=q.id, hospital_id=hospital.id,
                department_id=cardio.id, doctor_id=doctor.id,
                patient_id=patient.id, patient_name=patient.full_name,
                patient_phone=patient.phone_number,
                ticket_source=TicketSource.ONLINE, status=TicketStatus.SERVING,
                position=1, estimated_wait_minutes=0,
                serving_started_at=datetime.utcnow(),
            ))
            q.current_serving_ticket_id = t1_id
            await session.flush()

            # TicketLog: WAITING → SERVING
            session.add(TicketLog(
                id=uuid.uuid4(), ticket_id=t1_id,
                from_status=TicketStatus.WAITING, to_status=TicketStatus.SERVING,
                actor_id=doc_user.id, note="Called by doctor",
                timestamp=datetime.utcnow(),
            ))

            # Ticket 2 — WAITING (walk-in)
            session.add(Ticket(
                id=uuid.uuid4(), ticket_number="CARDIO-002",
                queue_session_id=q.id, hospital_id=hospital.id,
                department_id=cardio.id, doctor_id=doctor.id,
                patient_name="Walk-In Patient A", patient_phone="+85512111001",
                ticket_source=TicketSource.WALK_IN, status=TicketStatus.WAITING,
                position=2, estimated_wait_minutes=20,
            ))

            # Ticket 3 — WAITING (walk-in)
            session.add(Ticket(
                id=uuid.uuid4(), ticket_number="CARDIO-003",
                queue_session_id=q.id, hospital_id=hospital.id,
                department_id=cardio.id, doctor_id=doctor.id,
                patient_name="Walk-In Patient B", patient_phone="+85512111002",
                ticket_source=TicketSource.WALK_IN, status=TicketStatus.WAITING,
                position=3, estimated_wait_minutes=40,
            ))

        await session.commit()
        print("CI test data seeded successfully.")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_or_create_user(
    session, email, phone_number, full_name, role, password, hospital_id=None
):
    user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user:
        user = User(
            id=uuid.uuid4(), email=email, phone_number=phone_number,
            full_name=full_name, role=role,
            hashed_password=get_password_hash(password),
            is_active=True, is_verified=True, hospital_id=hospital_id,
        )
        session.add(user)
        await session.flush()
        print(f"  + user: {email}")
    return user


async def _get_or_create_hospital(session):
    h = (await session.execute(
        select(Hospital).where(Hospital.slug == "royal-city-general-hospital")
    )).scalar_one_or_none()
    if not h:
        h = Hospital(
            id=uuid.uuid4(),
            name="Royal City General Hospital",
            slug="royal-city-general-hospital",
            description="A leading multi-specialty hospital in Phnom Penh.",
            phone="+85523000001", email="info@royalcityhospital.com",
            address="No. 100, Norodom Blvd, Phnom Penh",
            latitude=11.5700, longitude=104.9200,
            is_active=True, is_verified=True,
            verification_status=VerificationStatus.APPROVED,
            emergency_service_available=True,
            rating=4.7, total_reviews=850,
        )
        session.add(h)
        await session.flush()
        print(f"  + hospital: {h.name}")
    return h


async def _get_or_create_dept(session, hospital_id, name, code, avg_minutes):
    d = (await session.execute(
        select(Department).where(
            Department.hospital_id == hospital_id, Department.code == code
        )
    )).scalar_one_or_none()
    if not d:
        d = Department(
            id=uuid.uuid4(), hospital_id=hospital_id,
            name=name, code=code,
            avg_consultation_minutes=avg_minutes, is_active=True,
        )
        session.add(d)
        await session.flush()
        print(f"  + dept: {name}")
    return d


async def _get_or_create_doctor(
    session, user_id, hospital_id, department_id,
    full_name="Dr. Sokha Meas, MD",
    specialty="Senior Cardiologist",
    license_number="MD-KH-2019-0042",
    room_number="Room 201",
    avg_consultation_minutes=20,
    schedule_days=5,
):
    doc = (await session.execute(
        select(Doctor).where(Doctor.user_id == user_id)
    )).scalar_one_or_none()
    if not doc:
        doc = Doctor(
            id=uuid.uuid4(), user_id=user_id,
            hospital_id=hospital_id, department_id=department_id,
            full_name=full_name,
            specialty=specialty,
            license_number=license_number,
            room_number=room_number,
            avg_consultation_minutes=avg_consultation_minutes,
            is_available=True, is_active=True,
        )
        session.add(doc)
        await session.flush()

        # Mon-Fri schedules (0=Mon, 4=Fri)
        for day in range(schedule_days):
            session.add(DoctorSchedule(
                id=uuid.uuid4(), doctor_id=doc.id,
                day_of_week=day,
                start_time=time(8, 0), end_time=time(16, 0),
                max_patients_per_slot=20, is_active=True,
            ))
        print(f"  + doctor: {full_name} ({schedule_days} schedules)")
    return doc


if __name__ == "__main__":
    asyncio.run(seed())
