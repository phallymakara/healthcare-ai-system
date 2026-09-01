import asyncio
import sys
import uuid
from datetime import datetime, date, time, timedelta

sys.stdout.reconfigure(encoding="utf-8")
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, engine
from app.core.security import get_password_hash
from app.models import (
    User,
    PatientProfile,
    Hospital,
    HospitalBranch,
    Department,
    Service,
    Doctor,
    DoctorSchedule,
    ScheduleOverride,
    QueueSession,
    Ticket,
    TicketLog,
    UserRole,
    VerificationStatus,
    TicketStatus,
    TicketSource,
    QueueStatus,
)


async def seed_database():
    print("Starting database seeding...")

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select
        chk = await session.execute(select(Hospital).where(Hospital.slug == "royal-city-general-hospital"))
        if chk.scalar_one_or_none():
            print("Database already contains seed records. Skipping re-seeding.")
            return

        # Step 1: Hospital 1: Royal City General Hospital
        hosp1 = Hospital(
            id=uuid.uuid4(),
            name="Royal City General Hospital",
            slug="royal-city-general-hospital",
            description="Leading multi-specialty healthcare institution equipped with modern diagnostics, emergency care, and expert consultants.",
            logo_url="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200",
            cover_image_url="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1000",
            phone="+85523888999",
            email="info@royalcityhospital.com",
            website="https://royalcityhospital.com",
            address="Building 12, Monivong Blvd, Phnom Penh",
            latitude=11.5564,
            longitude=104.9282,
            is_active=True,
            is_verified=True,
            verification_status=VerificationStatus.APPROVED,
            emergency_service_available=True,
            rating=4.8,
            total_reviews=142,
        )
        session.add(hosp1)
        await session.flush()

        # Step 2: Branches
        branch1 = HospitalBranch(
            id=uuid.uuid4(),
            hospital_id=hosp1.id,
            name="Main Campus - Monivong",
            address="Building 12, Monivong Blvd, Phnom Penh",
            phone="+85523888999",
            latitude=11.5564,
            longitude=104.9282,
            is_main_branch=True,
            is_active=True,
            opening_hours="Mon-Sun: 24/7 Emergency, Outpatient: 07:30 - 18:00",
        )
        session.add(branch1)
        await session.flush()

        # Step 3: Departments
        dept_cardio = Department(
            id=uuid.uuid4(),
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            name="Cardiology",
            code="CARDIO",
            description="Comprehensive cardiac care, heart screening, and hypertension management.",
            floor_room="Building A, 2nd Floor, Room 204",
            avg_consultation_minutes=20,
            is_active=True,
        )
        dept_derm = Department(
            id=uuid.uuid4(),
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            name="Dermatology & Skin Care",
            code="DERM",
            description="Diagnosis and treatment of skin conditions, allergies, and clinical aesthetics.",
            floor_room="Building B, 1st Floor, Room 108",
            avg_consultation_minutes=15,
            is_active=True,
        )
        dept_peds = Department(
            id=uuid.uuid4(),
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            name="Pediatrics",
            code="PEDS",
            description="Child health wellness, growth tracking, vaccinations, and adolescent medicine.",
            floor_room="Building A, 1st Floor, Room 102",
            avg_consultation_minutes=15,
            is_active=True,
        )
        session.add_all([dept_cardio, dept_derm, dept_peds])
        await session.flush()

        # Step 4: Services
        srv_cardio_consult = Service(
            id=uuid.uuid4(),
            hospital_id=hosp1.id,
            department_id=dept_cardio.id,
            name="Specialist Cardiology Consultation",
            description="In-depth consultation with senior cardiologist including vitals assessment.",
            duration_minutes=20,
            price=35.0,
            is_active=True,
        )
        srv_ecg = Service(
            id=uuid.uuid4(),
            hospital_id=hosp1.id,
            department_id=dept_cardio.id,
            name="12-Lead Electrocardiogram (ECG)",
            description="Resting 12-lead heart rhythm screening.",
            duration_minutes=15,
            price=25.0,
            is_active=True,
        )
        srv_derm_consult = Service(
            id=uuid.uuid4(),
            hospital_id=hosp1.id,
            department_id=dept_derm.id,
            name="Dermatology Examination",
            description="Skin allergy, rash, and lesion diagnosis.",
            duration_minutes=15,
            price=30.0,
            is_active=True,
        )
        session.add_all([srv_cardio_consult, srv_ecg, srv_derm_consult])
        await session.flush()

        # Step 5: Users (Admin, Doctors, Patients)
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@carequeue.ai",
            phone_number="+85512000001",
            hashed_password=get_password_hash("admin123!"),
            full_name="Super Platform Admin",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
        )
        doc1_user = User(
            id=uuid.uuid4(),
            email="dr.sokha@royalcityhospital.com",
            phone_number="+85512000002",
            hashed_password=get_password_hash("doctor123!"),
            full_name="Dr. Sokha Meas",
            role=UserRole.DOCTOR,
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            is_active=True,
            is_verified=True,
        )
        doc2_user = User(
            id=uuid.uuid4(),
            email="dr.chann@royalcityhospital.com",
            phone_number="+85512000003",
            hashed_password=get_password_hash("doctor123!"),
            full_name="Dr. Chann Vatey",
            role=UserRole.DOCTOR,
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            is_active=True,
            is_verified=True,
        )
        patient1_user = User(
            id=uuid.uuid4(),
            email="patient.dararith@gmail.com",
            phone_number="+85512999001",
            hashed_password=get_password_hash("patient123!"),
            full_name="Dararith Ken",
            role=UserRole.PATIENT,
            is_active=True,
            is_verified=True,
        )
        patient2_user = User(
            id=uuid.uuid4(),
            email="patient.sophea@gmail.com",
            phone_number="+85512999003",
            hashed_password=get_password_hash("patient123!"),
            full_name="Sophea Rath",
            role=UserRole.PATIENT,
            is_active=True,
            is_verified=True,
        )
        session.add_all([admin_user, doc1_user, doc2_user, patient1_user, patient2_user])
        await session.flush()

        # Step 6: Patient Profiles
        patient1_profile = PatientProfile(
            id=uuid.uuid4(),
            user_id=patient1_user.id,
            date_of_birth=date(1992, 5, 14),
            gender="Male",
            blood_type="O+",
            emergency_contact_name="Bopha Ken",
            emergency_contact_phone="+85512999002",
        )
        session.add(patient1_profile)
        await session.flush()

        # Step 7: Doctors
        doc1 = Doctor(
            id=uuid.uuid4(),
            user_id=doc1_user.id,
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            department_id=dept_cardio.id,
            full_name="Dr. Sokha Meas, MD",
            specialty="Senior Cardiologist",
            license_number="MD-KH-2015-883",
            bio="15+ years experience in cardiovascular care, preventive cardiology, and echocardiography.",
            photo_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300",
            room_number="Room 204A",
            avg_consultation_minutes=20,
            is_available=True,
            is_active=True,
        )
        doc2 = Doctor(
            id=uuid.uuid4(),
            user_id=doc2_user.id,
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            department_id=dept_derm.id,
            full_name="Dr. Chann Vatey, MD",
            specialty="Consultant Dermatologist",
            license_number="MD-KH-2018-492",
            bio="Specialist in medical dermatology, pediatric skin health, and allergy management.",
            photo_url="https://images.unsplash.com/photo-1594824813590-482490b4d48c?w=300",
            room_number="Room 108B",
            avg_consultation_minutes=15,
            is_available=True,
            is_active=True,
        )
        session.add_all([doc1, doc2])
        await session.flush()

        # Step 8: Doctor Schedules
        for day in range(0, 5):  # Mon-Fri
            session.add(
                DoctorSchedule(
                    id=uuid.uuid4(),
                    doctor_id=doc1.id,
                    day_of_week=day,
                    start_time=time(8, 0),
                    end_time=time(16, 0),
                    max_patients_per_slot=24,
                    is_active=True,
                )
            )

        for day in range(0, 6):  # Mon-Sat
            session.add(
                DoctorSchedule(
                    id=uuid.uuid4(),
                    doctor_id=doc2.id,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    max_patients_per_slot=30,
                    is_active=True,
                )
            )
        await session.flush()

        # Step 9: Active Queue Session
        today = date.today()
        queue_cardio = QueueSession(
            id=uuid.uuid4(),
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            department_id=dept_cardio.id,
            doctor_id=doc1.id,
            session_date=today,
            status=QueueStatus.ACTIVE,
            current_serving_number="CARD-001",
            total_issued_today=3,
        )
        session.add(queue_cardio)
        await session.flush()

        # Step 10: Tickets
        t1 = Ticket(
            id=uuid.uuid4(),
            ticket_number="CARD-001",
            queue_session_id=queue_cardio.id,
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            department_id=dept_cardio.id,
            doctor_id=doc1.id,
            service_id=srv_cardio_consult.id,
            patient_id=patient1_user.id,
            patient_name=patient1_user.full_name,
            patient_phone=patient1_user.phone_number,
            ticket_source=TicketSource.ONLINE,
            status=TicketStatus.SERVING,
            position=1,
            estimated_wait_minutes=0,
            called_at=datetime.utcnow() - timedelta(minutes=10),
            serving_started_at=datetime.utcnow() - timedelta(minutes=8),
        )
        queue_cardio.current_serving_ticket_id = t1.id
        session.add(t1)
        await session.flush()

        # Ticket Logs
        log1_created = TicketLog(
            id=uuid.uuid4(),
            ticket_id=t1.id,
            from_status=None,
            to_status=TicketStatus.WAITING,
            actor_id=patient1_user.id,
            note="Ticket booked online via Patient Mobile App",
            timestamp=datetime.utcnow() - timedelta(minutes=45),
        )
        log1_serving = TicketLog(
            id=uuid.uuid4(),
            ticket_id=t1.id,
            from_status=TicketStatus.WAITING,
            to_status=TicketStatus.SERVING,
            actor_id=doc1_user.id,
            note="Consultation started in Room 204A",
            timestamp=datetime.utcnow() - timedelta(minutes=8),
        )
        session.add_all([log1_created, log1_serving])

        t2 = Ticket(
            id=uuid.uuid4(),
            ticket_number="CARD-002",
            queue_session_id=queue_cardio.id,
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            department_id=dept_cardio.id,
            doctor_id=doc1.id,
            service_id=srv_ecg.id,
            patient_id=patient2_user.id,
            patient_name=patient2_user.full_name,
            patient_phone=patient2_user.phone_number,
            ticket_source=TicketSource.ONLINE,
            status=TicketStatus.WAITING,
            position=2,
            estimated_wait_minutes=12,
            created_at=datetime.utcnow() - timedelta(minutes=30),
        )
        t3 = Ticket(
            id=uuid.uuid4(),
            ticket_number="CARD-003",
            queue_session_id=queue_cardio.id,
            hospital_id=hosp1.id,
            branch_id=branch1.id,
            department_id=dept_cardio.id,
            doctor_id=doc1.id,
            service_id=srv_cardio_consult.id,
            patient_id=None,
            patient_name="Sarith Pich (Walk-In)",
            patient_phone="+85598777123",
            ticket_source=TicketSource.WALK_IN,
            status=TicketStatus.WAITING,
            position=3,
            estimated_wait_minutes=32,
            created_at=datetime.utcnow() - timedelta(minutes=15),
        )
        session.add_all([t2, t3])

        await session.commit()
        print("✅ Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
