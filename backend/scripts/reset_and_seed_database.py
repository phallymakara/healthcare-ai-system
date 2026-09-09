import sys
import logging
import asyncio
import uuid
from datetime import date, datetime, time, timedelta
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

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
from app.models.hospital import Hospital, HospitalBranch, Department, Service
from app.models.doctor import Doctor, DoctorSchedule
from app.models.queue import QueueSession, Ticket, TicketLog

# Import authentic Cambodia healthcare data
from scripts.seed_cambodia_data import CAMBODIA_HOSPITALS


DEFAULT_PASSWORD = "Password123!"
DEFAULT_HASH = get_password_hash(DEFAULT_PASSWORD)


async def reset_and_seed_database():
    print("==================================================================")
    print("🚀 Starting Complete Database Wipe & Authentic Cambodia Healthcare Seed")
    print("==================================================================")

    async with AsyncSessionLocal() as session:
        # 1. Truncate all tables cleanly in cascade
        print("\n[1/5] Truncating all existing tables to guarantee a clean slate...")
        await session.execute(
            text(
                """
                TRUNCATE TABLE 
                    ticket_logs, 
                    tickets, 
                    queue_sessions, 
                    schedule_overrides, 
                    doctor_schedules, 
                    doctors, 
                    services, 
                    departments, 
                    hospital_branches, 
                    patient_profiles, 
                    users, 
                    hospitals 
                CASCADE;
                """
            )
        )
        await session.commit()
        print("      ✅ All existing data wiped successfully!")

        # 2. Seed System Users (Super Admin, Hospital Admins, Receptionists, Patients)
        print("\n[2/5] Seeding fully-profiled System Users across all roles...")

        # A. Super Admin
        super_admin = User(
            id=uuid.uuid4(),
            email="admin@healthcare.gov.kh",
            phone_number="+85512000001",
            full_name="H.E. Dr. Chheang Ra",
            role=UserRole.SUPER_ADMIN,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200",
        )
        session.add(super_admin)

        # B. Primary Test Patient (For user testing)
        test_patient = User(
            id=uuid.uuid4(),
            email="patient@example.com",
            phone_number="012345678",
            full_name="Makara Phally",
            role=UserRole.PATIENT,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
        )
        session.add(test_patient)
        await session.flush()

        # Patient Profile
        patient_profile = PatientProfile(
            user_id=test_patient.id,
            date_of_birth=date(1995, 5, 14),
            gender="MALE",
            blood_type="O+",
            emergency_contact_name="Sopheap Phally",
            emergency_contact_phone="012999888",
        )
        session.add(patient_profile)

        # C. Second Test Patient
        test_patient_2 = User(
            id=uuid.uuid4(),
            email="chanthou@gmail.com",
            phone_number="098765432",
            full_name="Chanthou Keo",
            role=UserRole.PATIENT,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        )
        session.add(test_patient_2)
        await session.flush()

        patient_profile_2 = PatientProfile(
            user_id=test_patient_2.id,
            date_of_birth=date(1998, 11, 20),
            gender="FEMALE",
            blood_type="A+",
            emergency_contact_name="Vannak Keo",
            emergency_contact_phone="012345671",
        )
        session.add(patient_profile_2)

        # Staff accounts (Hospital Admins, Receptionists, Doctors)
        calmette_admin = User(
            id=uuid.uuid4(),
            email="admin@calmette.gov.kh",
            phone_number="+85512000002",
            full_name="Dr. Meas Sokha (Hospital Director)",
            role=UserRole.HOSPITAL_ADMIN,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200",
        )
        session.add(calmette_admin)

        calmette_receptionist = User(
            id=uuid.uuid4(),
            email="receptionist@calmette.gov.kh",
            phone_number="+85512000004",
            full_name="Sreypov Kim (Reception Desk)",
            role=UserRole.RECEPTIONIST,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200",
        )
        session.add(calmette_receptionist)

        doctor_meas_user = User(
            id=uuid.uuid4(),
            email="doctor.meas@calmette.gov.kh",
            phone_number="+85512000003",
            full_name="Dr. Sokha Meas",
            role=UserRole.DOCTOR,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200",
        )
        session.add(doctor_meas_user)

        kantha_admin = User(
            id=uuid.uuid4(),
            email="admin@kanthabopha.gov.kh",
            phone_number="+85512000005",
            full_name="Dr. Denis Laurent (Director)",
            role=UserRole.HOSPITAL_ADMIN,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200",
        )
        session.add(kantha_admin)

        kantha_receptionist = User(
            id=uuid.uuid4(),
            email="receptionist@kanthabopha.gov.kh",
            phone_number="+85512000006",
            full_name="Sreymom Heng (Reception Desk)",
            role=UserRole.RECEPTIONIST,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
        )
        session.add(kantha_receptionist)

        doctor_moly_user = User(
            id=uuid.uuid4(),
            email="doctor.moly@kanthabopha.gov.kh",
            phone_number="+85512000007",
            full_name="Dr. Chan Moly",
            role=UserRole.DOCTOR,
            hashed_password=DEFAULT_HASH,
            is_active=True,
            is_verified=True,
            profile_photo_url="https://images.unsplash.com/photo-1594824813686-29177a641151?w=200",
        )
        session.add(doctor_moly_user)

        await session.flush()
        print(f"      ✅ Seeded Super Admin, Hospital Admins, Doctors, Receptionists, and Patients.")

        # 3. Seed Authentic Cambodia Hospitals
        print("\n[3/5] Seeding Hospitals, Departments, Services, Doctors, and Schedules...")
        created_hospitals = {}
        created_departments = {}
        created_doctors = {}
        created_services = {}

        # Distinct authentic logo badges for Cambodia hospitals
        HOSPITAL_LOGOS = {
            "calmette-hospital-phnom-penh": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200",
            "kantha-bopha-hospital-phnom-penh": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200",
            "khmer-soviet-friendship-hospital": "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=200",
            "cho-ray-phnom-penh-hospital": "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=200",
            "sunrise-japan-hospital-phnom-penh": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200",
            "siem-reap-provincial-referral-hospital": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=200",
            "battambang-provincial-referral-hospital": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200",
            "pasteur-institute-cambodia": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=200",
            "royal-phnom-penh-hospital": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200",
        }

        for hosp_data in CAMBODIA_HOSPITALS:
            logo_url = HOSPITAL_LOGOS.get(
                hosp_data["slug"], "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200"
            )
            hospital = Hospital(
                name=hosp_data["name"],
                slug=hosp_data["slug"],
                description=hosp_data.get("description"),
                logo_url=logo_url,
                phone=hosp_data.get("phone"),
                email=hosp_data.get("email"),
                website=hosp_data.get("website"),
                address=hosp_data.get("address"),
                latitude=hosp_data.get("latitude"),
                longitude=hosp_data.get("longitude"),
                is_active=True,
                is_verified=True,
                verification_status=VerificationStatus.APPROVED,
                emergency_service_available=hosp_data.get("emergency_service_available", True),
                rating=hosp_data.get("rating", 4.8),
                total_reviews=hosp_data.get("total_reviews", 1000),
            )
            session.add(hospital)
            await session.flush()
            created_hospitals[hospital.slug] = hospital

            # Link staff hospital associations
            if hospital.slug == "calmette-hospital-phnom-penh":
                calmette_admin.hospital_id = hospital.id
                calmette_receptionist.hospital_id = hospital.id
                doctor_meas_user.hospital_id = hospital.id
            elif hospital.slug == "kantha-bopha-hospital-phnom-penh":
                kantha_admin.hospital_id = hospital.id
                kantha_receptionist.hospital_id = hospital.id
                doctor_moly_user.hospital_id = hospital.id

            # Departments
            for dept_data in hosp_data.get("departments", []):
                dept = Department(
                    hospital_id=hospital.id,
                    name=dept_data["name"],
                    code=dept_data.get("code"),
                    floor_room=dept_data.get("floor_room"),
                    avg_consultation_minutes=dept_data.get("avg_consultation_minutes", 15),
                    is_active=True,
                )
                session.add(dept)
                await session.flush()
                created_departments[f"{hospital.slug}_{dept.code or dept.name}"] = dept

                # Doctors
                for doc_data in dept_data.get("doctors", []):
                    user_link_id = None
                    if "Sokha Meas" in doc_data["full_name"]:
                        user_link_id = doctor_meas_user.id
                    elif "Chan Moly" in doc_data["full_name"]:
                        user_link_id = doctor_moly_user.id

                    doc = Doctor(
                        user_id=user_link_id,
                        hospital_id=hospital.id,
                        department_id=dept.id,
                        full_name=doc_data["full_name"],
                        specialty=doc_data["specialty"],
                        bio=doc_data.get("bio"),
                        room_number=doc_data.get("room_number"),
                        avg_consultation_minutes=doc_data.get("avg_consultation_minutes", 15),
                        is_available=doc_data.get("is_available", True),
                        is_active=True,
                        license_number=f"CAM-MD-{uuid.uuid4().hex[:6].upper()}",
                        photo_url=doc_data.get(
                            "photo_url", "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200"
                        ),
                    )
                    session.add(doc)
                    await session.flush()
                    created_doctors[doc.full_name] = doc

                    # Add weekly schedules (Monday through Saturday, 08:00 - 17:00)
                    for day_idx in range(6):  # 0 to 5
                        sched = DoctorSchedule(
                            doctor_id=doc.id,
                            day_of_week=day_idx,
                            start_time=time(8, 0),
                            end_time=time(17, 0),
                            max_patients_per_slot=25,
                            is_active=True,
                        )
                        session.add(sched)

                # Services
                for s_data in dept_data.get("services", []):
                    svc = Service(
                        hospital_id=hospital.id,
                        department_id=dept.id,
                        name=s_data["name"],
                        duration_minutes=s_data["duration_minutes"],
                        price=s_data["price"],
                        is_active=True,
                    )
                    session.add(svc)
                    await session.flush()
                    created_services[f"{hospital.slug}_{svc.name}"] = svc

                # Queue Sessions & Tickets for Today
                q_info = dept_data.get("queue")
                if q_info:
                    q_sess = QueueSession(
                        hospital_id=hospital.id,
                        department_id=dept.id,
                        doctor_id=created_doctors.get(dept_data["doctors"][0]["full_name"]).id if dept_data.get("doctors") else None,
                        session_date=date.today(),
                        status=QueueStatus.ACTIVE,
                        current_serving_number=q_info["serving_num"],
                        total_issued_today=len(q_info["patients"]) + 6,
                    )
                    session.add(q_sess)
                    await session.flush()

                    prefix = q_info["prefix"]

                    # 1 Ticket currently SERVING
                    serving_doc = created_doctors.get(dept_data["doctors"][0]["full_name"]) if dept_data.get("doctors") else None
                    serving_tk = Ticket(
                        ticket_number=q_info["serving_num"],
                        queue_session_id=q_sess.id,
                        hospital_id=hospital.id,
                        department_id=dept.id,
                        doctor_id=serving_doc.id if serving_doc else None,
                        patient_name="Sokheng Phan",
                        patient_phone="012443322",
                        ticket_source=TicketSource.WALK_IN,
                        status=TicketStatus.SERVING,
                        position=0,
                        estimated_wait_minutes=0,
                        serving_started_at=datetime.utcnow() - timedelta(minutes=10),
                    )
                    session.add(serving_tk)
                    await session.flush()
                    q_sess.current_serving_ticket_id = serving_tk.id

                    # Waiting patients in queue
                    for idx, (p_name, p_phone) in enumerate(q_info["patients"], 1):
                        t_num = f"{prefix}-{idx:03d}"
                        t_wait = idx * dept.avg_consultation_minutes
                        ticket = Ticket(
                            ticket_number=t_num,
                            queue_session_id=q_sess.id,
                            hospital_id=hospital.id,
                            department_id=dept.id,
                            doctor_id=serving_doc.id if serving_doc else None,
                            patient_name=p_name,
                            patient_phone=p_phone,
                            ticket_source=TicketSource.ONLINE if idx % 2 == 0 else TicketSource.WALK_IN,
                            status=TicketStatus.WAITING,
                            position=idx,
                            estimated_wait_minutes=t_wait,
                        )
                        session.add(ticket)

        await session.commit()
        print(f"      ✅ Seeded {len(created_hospitals)} authentic Cambodia hospitals with full departments, doctors, services, and queues.")

        # 4. Seed Specific Rich Tickets & Appointments for our Test Patient
        print("\n[4/5] Seeding active appointments and completed medical history for Makara Phally (patient@example.com)...")
        calmette = created_hospitals.get("calmette-hospital-phnom-penh")
        kantha = created_hospitals.get("kantha-bopha-hospital-phnom-penh")
        khmer_soviet = created_hospitals.get("khmer-soviet-friendship-hospital")

        cardio_dept = created_departments.get("calmette-hospital-phnom-penh_CARDIO")
        cardio_doc = created_doctors.get("Sokha Meas, MD")

        # Find or create active queue session for Cardiology today
        q_res = await session.execute(
            select(QueueSession).where(
                QueueSession.department_id == cardio_dept.id,
                QueueSession.session_date == date.today(),
            )
        )
        cardio_session = q_res.scalars().first()

        # Ticket A: UPCOMING / ACTIVE APPOINTMENT (WAITING)
        # Shows in "My Appointments" & "Live Ticket Tracker"
        active_appointment = Ticket(
            ticket_number="CARDIO-014",
            queue_session_id=cardio_session.id,
            hospital_id=calmette.id,
            department_id=cardio_dept.id,
            doctor_id=cardio_doc.id,
            patient_id=test_patient.id,
            patient_name=test_patient.full_name,
            patient_phone=test_patient.phone_number,
            ticket_source=TicketSource.ONLINE,
            status=TicketStatus.WAITING,
            position=2,
            estimated_wait_minutes=20,
            appointment_date=date.today(),
            appointment_time="09:30 AM",
            created_at=datetime.utcnow() - timedelta(hours=1),
        )
        session.add(active_appointment)
        await session.flush()

        log1 = TicketLog(
            ticket_id=active_appointment.id,
            from_status=None,
            to_status=TicketStatus.WAITING,
            actor_id=test_patient.id,
            note="Appointment booked online via Mobile Portal",
            timestamp=datetime.utcnow() - timedelta(hours=1),
        )
        session.add(log1)

        # Ticket B: COMPLETED MEDICAL RECORD (14 days ago)
        # Shows in "Visit History & Medical Records"
        past_date_1 = date.today() - timedelta(days=14)
        completed_ticket_1 = Ticket(
            ticket_number="CARDIO-002",
            queue_session_id=cardio_session.id,
            hospital_id=calmette.id,
            department_id=cardio_dept.id,
            doctor_id=cardio_doc.id,
            patient_id=test_patient.id,
            patient_name=test_patient.full_name,
            patient_phone=test_patient.phone_number,
            ticket_source=TicketSource.ONLINE,
            status=TicketStatus.COMPLETED,
            position=0,
            estimated_wait_minutes=0,
            appointment_date=past_date_1,
            appointment_time="09:15 AM",
            called_at=datetime.combine(past_date_1, time(9, 10)),
            serving_started_at=datetime.combine(past_date_1, time(9, 15)),
            completed_at=datetime.combine(past_date_1, time(9, 40)),
            created_at=datetime.combine(past_date_1, time(8, 30)),
        )
        session.add(completed_ticket_1)

        # Ticket C: COMPLETED MEDICAL RECORD (35 days ago - Pediatrics/General Checkup)
        pedi_dept = created_departments.get("kantha-bopha-hospital-phnom-penh_PEDIATRIC")
        pedi_doc = created_doctors.get("Chan Moly, MD")
        q_pedi_res = await session.execute(
            select(QueueSession).where(
                QueueSession.department_id == pedi_dept.id,
                QueueSession.session_date == date.today(),
            )
        )
        pedi_session = q_pedi_res.scalars().first()

        past_date_2 = date.today() - timedelta(days=35)
        completed_ticket_2 = Ticket(
            ticket_number="PEDI-008",
            queue_session_id=pedi_session.id,
            hospital_id=kantha.id,
            department_id=pedi_dept.id,
            doctor_id=pedi_doc.id if pedi_doc else None,
            patient_id=test_patient.id,
            patient_name=test_patient.full_name,
            patient_phone=test_patient.phone_number,
            ticket_source=TicketSource.ONLINE,
            status=TicketStatus.COMPLETED,
            position=0,
            estimated_wait_minutes=0,
            appointment_date=past_date_2,
            appointment_time="10:00 AM",
            called_at=datetime.combine(past_date_2, time(9, 58)),
            serving_started_at=datetime.combine(past_date_2, time(10, 0)),
            completed_at=datetime.combine(past_date_2, time(10, 20)),
            created_at=datetime.combine(past_date_2, time(9, 0)),
        )
        session.add(completed_ticket_2)

        # Ticket D: CANCELLED APPOINTMENT (45 days ago)
        # Shows in "Visit History & Medical Records" under Cancelled tab
        pulmo_dept = created_departments.get("khmer-soviet-friendship-hospital_PULMO")
        q_pulmo_res = await session.execute(
            select(QueueSession).where(
                QueueSession.department_id == pulmo_dept.id,
                QueueSession.session_date == date.today(),
            )
        )
        pulmo_session = q_pulmo_res.scalars().first()

        past_date_3 = date.today() - timedelta(days=45)
        cancelled_ticket = Ticket(
            ticket_number="PULMO-019",
            queue_session_id=pulmo_session.id,
            hospital_id=khmer_soviet.id,
            department_id=pulmo_dept.id,
            patient_id=test_patient.id,
            patient_name=test_patient.full_name,
            patient_phone=test_patient.phone_number,
            ticket_source=TicketSource.ONLINE,
            status=TicketStatus.CANCELLED,
            position=0,
            estimated_wait_minutes=0,
            appointment_date=past_date_3,
            appointment_time="02:30 PM",
            created_at=datetime.combine(past_date_3, time(13, 0)),
        )
        session.add(cancelled_ticket)

        await session.commit()
        print("      ✅ Seeded 1 Active Upcoming Appointment, 2 Completed Consultations, and 1 Cancelled Ticket.")

        # 5. Summary & Verification
        print("\n[5/5] Finalizing seed verification...")
        h_cnt = (await session.execute(text("SELECT COUNT(*) FROM hospitals;"))).scalar()
        u_cnt = (await session.execute(text("SELECT COUNT(*) FROM users;"))).scalar()
        d_cnt = (await session.execute(text("SELECT COUNT(*) FROM doctors;"))).scalar()
        t_cnt = (await session.execute(text("SELECT COUNT(*) FROM tickets;"))).scalar()

        print("==================================================================")
        print("🎉 Database Reset & Seed Completed Successfully!")
        print("==================================================================")
        print(f"📊 Totals in Database:")
        print(f"   • Hospitals : {h_cnt}")
        print(f"   • Users     : {u_cnt}")
        print(f"   • Doctors   : {d_cnt}")
        print(f"   • Tickets   : {t_cnt}")
        print("\n🔑 Official Testing Credentials:")
        print("   ┌─────────────────────────────────────────────────────────────┐")
        print("   │ 1. TEST PATIENT (My Appointments & History)                 │")
        print("   │    Email   : patient@example.com (or phone: 012345678)      │")
        print("   │    Password: Password123!                                   │")
        print("   │    Name    : Makara Phally (Blood O+, Verified)             │")
        print("   ├─────────────────────────────────────────────────────────────┤")
        print("   │ 2. DOCTOR COUNTER (Call & Serve Patients)                   │")
        print("   │    Email   : doctor.meas@calmette.gov.kh                    │")
        print("   │    Password: Password123!                                   │")
        print("   │    Hospital: Calmette Hospital (Cardiology & Heart Center)  │")
        print("   ├─────────────────────────────────────────────────────────────┤")
        print("   │ 3. HOSPITAL ADMIN (Partner Dashboard)                       │")
        print("   │    Email   : admin@calmette.gov.kh                          │")
        print("   │    Password: Password123!                                   │")
        print("   │    Hospital: Calmette Hospital                              │")
        print("   ├─────────────────────────────────────────────────────────────┤")
        print("   │ 4. RECEPTIONIST DESK (On-site Walk-In Counter)              │")
        print("   │    Email   : receptionist@calmette.gov.kh                   │")
        print("   │    Password: Password123!                                   │")
        print("   ├─────────────────────────────────────────────────────────────┤")
        print("   │ 5. PLATFORM SUPER ADMIN (Admin Center)                      │")
        print("   │    Email   : admin@healthcare.gov.kh                        │")
        print("   │    Password: Password123!                                   │")
        print("   └─────────────────────────────────────────────────────────────┘")


if __name__ == "__main__":
    asyncio.run(reset_and_seed_database())
