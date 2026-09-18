import os
import sys
import logging

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

import asyncio
import uuid
from datetime import date, datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.config import settings
from app.models.enums import (
    VerificationStatus,
    QueueStatus,
    TicketStatus,
    TicketSource,
)
from app.models.hospital import Hospital, Department, Service
from app.models.doctor import Doctor
from app.models.queue import QueueSession, Ticket

CAMBODIA_PEDIATRIC_FACILITIES = [
    {
        "name": "Kantha Bopha Children's Hospital IV & V (មន្ទីរពេទ្យគន្ធបុប្ផា ភ្នំពេញ)",
        "slug": "kantha-bopha-children-hospital-phnom-penh",
        "description": "Cambodia's premier humanitarian pediatric institution delivering 100% free, world-class medical, surgical, and neonatal intensive care to children and pregnant mothers.",
        "phone": "+85523428009",
        "email": "contact@beat-richner.ch",
        "website": "https://www.beat-richner.ch",
        "address": "Street 90 corner Street 47, Sangkat Wat Phnom, Khan Daun Penh, Phnom Penh, Cambodia",
        "latitude": 11.5786,
        "longitude": 104.9228,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 5.0,
        "total_reviews": 4200,
        "departments": [
            {
                "name": "24/7 Pediatric Emergency & Dengue Triage (សង្គ្រោះបន្ទាន់កុមារ និងគ្រុនឈាម)",
                "code": "KB-ER",
                "floor_room": "Ground Floor, Emergency Pavilion ER-1",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Denis Laurent, MD",
                        "specialty": "Pediatric Critical Care & Infectious Disease",
                        "bio": "Over 25 years with Kantha Bopha leading emergency dengue shock resuscitation and severe child encephalitis management.",
                        "room_number": "ER-1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Free Emergency Pediatric Triage & Resuscitation", "duration_minutes": 15, "price": 0.0},
                    {"name": "Dengue Fever NS1 Rapid Screening & Blood Platelet Monitor", "duration_minutes": 20, "price": 0.0},
                    {"name": "Pediatric Intensive Oxygen & IV Fluid Resuscitation", "duration_minutes": 30, "price": 0.0},
                ],
                "queue": {
                    "prefix": "KB-ER",
                    "serving_num": "KB-ER-018",
                    "patients": [
                        ("Baby Seyha (4 mo - High Fever)", "012330011"),
                        ("Child Sokha (3 yr - Dengue Warning)", "098445566"),
                        ("Child Vathanak (5 yr - Breathing Distress)", "015887799"),
                    ],
                },
            },
            {
                "name": "Neonatal Intensive Care Unit - NICU (ផ្នែកទារកកើតមិនគ្រប់ខែ)",
                "code": "KB-NICU",
                "floor_room": "Building B, Floor 2, Room N-201",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Chea Sovannara, MD",
                        "specialty": "Chief Neonatologist",
                        "bio": "Senior newborn specialist managing pre-term incubators, neonatal jaundice, and congenital breathing disorders.",
                        "room_number": "NICU-1",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Comprehensive Pre-term Newborn Evaluation", "duration_minutes": 20, "price": 0.0},
                    {"name": "Neonatal Phototherapy & Jaundice Bilirubin Monitoring", "duration_minutes": 30, "price": 0.0},
                    {"name": "Newborn Congenital Cardiac Screening (Echo)", "duration_minutes": 25, "price": 0.0},
                ],
                "queue": {
                    "prefix": "KB-NICU",
                    "serving_num": "KB-NICU-006",
                    "patients": [
                        ("Infant of Srey Mom (Jaundice)", "077889900"),
                        ("Infant of Chantha (Low Birthweight)", "092113355"),
                    ],
                },
            },
        ],
    },
    {
        "name": "National Pediatric Hospital - NPH (មន្ទីរពេទ្យកុមារជាតិ)",
        "slug": "national-pediatric-hospital-phnom-penh",
        "description": "The Ministry of Health's leading public tertiary referral teaching hospital for children, offering specialized pediatric surgery, malnutrition rehabilitation, and neurology.",
        "phone": "+85523884137",
        "email": "info@nph.gov.kh",
        "website": "http://moh.gov.kh",
        "address": "#100, Russian Federation Blvd, Sangkat Toeuk Laak 1, Khan Toul Kork, Phnom Penh, Cambodia",
        "latitude": 11.5695,
        "longitude": 104.8968,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.7,
        "total_reviews": 1650,
        "departments": [
            {
                "name": "Pediatric General Outpatient & Vaccinations (ពិនិត្យកុមារទូទៅ និងចាក់វ៉ាក់សាំង)",
                "code": "NPH-OPD",
                "floor_room": "Pavilion A, Ground Floor, Room 104",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Bunly Touch, MD",
                        "specialty": "Senior Pediatric Consultant",
                        "bio": "20+ years of public pediatric care focusing on acute respiratory illness, childhood diarrhea, and developmental milestones.",
                        "room_number": "Room 104",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Routine Pediatric Clinical Consultation", "duration_minutes": 15, "price": 5.0},
                    {"name": "National Expanded Immunization Booster (NIP)", "duration_minutes": 10, "price": 0.0},
                    {"name": "Child Growth & Nutrition Assessment", "duration_minutes": 15, "price": 3.0},
                ],
                "queue": {
                    "prefix": "NPH-OPD",
                    "serving_num": "NPH-OPD-014",
                    "patients": [
                        ("Panha Keo (18 mo - Booster Shot)", "011224466"),
                        ("Channary Som (2 yr - Chronic Cough)", "093556677"),
                        ("Kimly Heng (9 mo - Measles Vaccine)", "016889900"),
                    ],
                },
            },
            {
                "name": "Pediatric Surgery & Trauma (ផ្នែកវះកាត់កុមារ)",
                "code": "NPH-SURG",
                "floor_room": "Surgical Wing, Floor 2, Room 205",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Samnang Chea, MD",
                        "specialty": "Chief Pediatric Surgeon",
                        "bio": "Specialized in congenital anomalies, hernia repair, pediatric trauma, and appendicitis.",
                        "room_number": "Room 205",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Pre-Surgical Pediatric Evaluation", "duration_minutes": 20, "price": 10.0},
                    {"name": "Pediatric Soft-Tissue / Hernia Surgical Consultation", "duration_minutes": 25, "price": 15.0},
                ],
                "queue": {
                    "prefix": "NPH-SURG",
                    "serving_num": "NPH-SURG-005",
                    "patients": [
                        ("Visal Ung (6 yr - Pre-Op Exam)", "097441122"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Jayavarman VII Hospital - Kantha Bopha III (មន្ទីរពេទ្យជ័យវរ្ម័នទី៧ គន្ធបុប្ផាទី៣ សៀមរាប)",
        "slug": "jayavarman-vii-hospital-siem-reap",
        "description": "The major humanitarian children's hospital in Northern Cambodia providing completely free pediatric inpatient, emergency trauma, and maternity services.",
        "phone": "+85563963409",
        "email": "info@beat-richner.ch",
        "website": "https://www.beat-richner.ch",
        "address": "Charles de Gaulle Street, Sangkat Kork Chak, Krong Siem Reap, Siem Reap Province, Cambodia",
        "latitude": 13.3765,
        "longitude": 103.8612,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 5.0,
        "total_reviews": 3100,
        "departments": [
            {
                "name": "Children's Emergency & Inpatient Care (សង្គ្រោះបន្ទាន់កុមារ សៀមរាប)",
                "code": "JV-ER",
                "floor_room": "Emergency Building, Ground Floor",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Laurenz Keller, MD",
                        "specialty": "Pediatric Emergency Director",
                        "bio": "Overseeing critical pediatric admissions, acute malaria, dengue triage, and infant dehydration.",
                        "room_number": "ER-Main",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Free Emergency Pediatric Examination", "duration_minutes": 15, "price": 0.0},
                    {"name": "Acute Dengue & Infectious Screening Panel", "duration_minutes": 20, "price": 0.0},
                    {"name": "Emergency Pediatric Inpatient Admission", "duration_minutes": 30, "price": 0.0},
                ],
                "queue": {
                    "prefix": "JV-ER",
                    "serving_num": "JV-ER-012",
                    "patients": [
                        ("Dara Pich (5 yr - High Fever)", "088990011"),
                        ("Sreypov Sin (1 yr - Dehydration)", "012554433"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Angkor Hospital for Children - AHC (មន្ទីរពេទ្យកុមារអង្គរ សៀមរាប)",
        "slug": "angkor-hospital-for-children-siem-reap",
        "description": "World-renowned non-profit pediatric teaching hospital recognized for international healthcare standards, pediatric oncology, neonatal care, and community outreach.",
        "phone": "+85563963409",
        "email": "ahc@angkorhospital.org",
        "website": "https://angkorhospital.org",
        "address": "Tep Vong Road & Oum Chhay Street, Svay Dangkum, Krong Siem Reap, Siem Reap Province, Cambodia",
        "latitude": 13.3598,
        "longitude": 103.8542,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.9,
        "total_reviews": 1800,
        "departments": [
            {
                "name": "Specialized Pediatric Outpatient & Oncology (ពិនិត្យជំងឺកុមារឯកទេស)",
                "code": "AHC-OPD",
                "floor_room": "Outpatient Pavilion, Room 102",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Ngoun Chanpheaktra, MD",
                        "specialty": "Pediatric Clinical Director",
                        "bio": "Distinguished Cambodian pediatrician leading specialized child cancer therapies, chronic kidney disease, and neonatal care.",
                        "room_number": "Room 102",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Comprehensive Pediatric Consultation & Diagnosis", "duration_minutes": 20, "price": 0.0},
                    {"name": "Pediatric Chronic Illness & Oncology Monitoring", "duration_minutes": 30, "price": 0.0},
                    {"name": "Preventative Childhood Eye & Dental Screening", "duration_minutes": 15, "price": 0.0},
                ],
                "queue": {
                    "prefix": "AHC",
                    "serving_num": "AHC-008",
                    "patients": [
                        ("Bona Rath (4 yr - Specialist Follow-up)", "017882233"),
                        ("Monita Ly (2 yr - Blood Count Exam)", "096334411"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Maxicare Children Hospital (មន្ទីរពេទ្យកុមារ ម៉ាក់ស៊ីឃែរ ភ្នំពេញ)",
        "slug": "maxicare-children-hospital-phnom-penh",
        "description": "Leading private children's hospital in Phnom Penh offering 24/7 pediatric emergency, private inpatient suites, neonatal ICU, vaccinations, and pediatric gastroenterology.",
        "phone": "+85592590555",
        "email": "info@maxicarehospital.com.kh",
        "website": "https://maxicarehospital.com.kh",
        "address": "#49, Street 368, Sangkat Boeung Keng Kang 3 (BKK3), Khan Chamkarmon, Phnom Penh, Cambodia",
        "latitude": 11.5452,
        "longitude": 104.9198,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.8,
        "total_reviews": 420,
        "departments": [
            {
                "name": "24/7 Private Pediatric Emergency & Consultations (សង្គ្រោះបន្ទាន់កុមារ ២៤ម៉ោង)",
                "code": "MAXI-ER",
                "floor_room": "Ground Floor, Room 1",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Seng Kolab, MD",
                        "specialty": "Consultant Pediatrician",
                        "bio": "Specialist in acute infant infections, pediatric gastroenterology, allergy testing, and childhood immunization.",
                        "room_number": "Consult 1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Private Pediatric Specialist Consultation", "duration_minutes": 15, "price": 25.0},
                    {"name": "Comprehensive Child Vaccine Package (Rotavirus, Hexavalent)", "duration_minutes": 20, "price": 45.0},
                    {"name": "Emergency Pediatric IV Therapy & Observation", "duration_minutes": 45, "price": 35.0},
                ],
                "queue": {
                    "prefix": "MAXI",
                    "serving_num": "MAXI-004",
                    "patients": [
                        ("Master Lucas (1 yr - 12-Month Booster)", "012884400"),
                        ("Miss Sophie (3 yr - Stomach Flu)", "092441188"),
                    ],
                },
            },
        ],
    },
    {
        "name": "National Maternal and Child Health Center - NMCHC (មជ្ឈមណ្ឌលជាតិគាំពារមាតា និងទារក)",
        "slug": "national-maternal-child-health-center-phnom-penh",
        "description": "Cambodia's highest national authority and referral center for safe motherhood, newborn screening, infant vaccinations, and neonatal intensive care.",
        "phone": "+85523724257",
        "email": "info@nmchc.gov.kh",
        "website": "https://nmchc.gov.kh",
        "address": "Street 47, Sangkat Srah Chak, Khan Daun Penh, Phnom Penh, Cambodia",
        "latitude": 11.5818,
        "longitude": 104.9212,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.8,
        "total_reviews": 980,
        "departments": [
            {
                "name": "Infant Care & National Immunization (ផ្នែកថែទាំទារក និងចាក់ថ្នាំបង្ការ)",
                "code": "NMCHC-BABY",
                "floor_room": "Pavilion 2, Room 102",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Prak Sophal, MD",
                        "specialty": "Neonatal & Maternal Health Director",
                        "bio": "National expert in infant resuscitation, exclusive breastfeeding guidance, and newborn metabolic screening.",
                        "room_number": "Room 102",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Newborn Comprehensive Clinical Evaluation", "duration_minutes": 15, "price": 5.0},
                    {"name": "National Immunization (BCG, Hepatitis B, Polio)", "duration_minutes": 10, "price": 0.0},
                    {"name": "Infant Growth & Developmental Milestone Screening", "duration_minutes": 15, "price": 3.0},
                ],
                "queue": {
                    "prefix": "NMCHC",
                    "serving_num": "NMCHC-007",
                    "patients": [
                        ("Newborn Baby Nara (Day 5 Checkup)", "015993311"),
                        ("Baby Theara (6 Weeks Vaccines)", "089664422"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Domrey Mother & Child Clinic (គ្លីនិកមាតា និងកុមារ ដំរី ភ្នំពេញ)",
        "slug": "domrey-mother-child-clinic-phnom-penh",
        "description": "Modern private pediatric and maternal clinic in Sen Sok delivering 24/7 healthcare for children from birth to age 18, routine vaccinations, and pediatric consultations.",
        "phone": "+85592377000",
        "email": "contact@domreyhospital.com",
        "website": "https://domreyhospital.com",
        "address": "Street 1986, Sangkat Phnom Penh Thmey, Khan Sen Sok, Phnom Penh, Cambodia",
        "latitude": 11.5795,
        "longitude": 104.8845,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.7,
        "total_reviews": 290,
        "departments": [
            {
                "name": "Pediatric Clinic & Well-Baby Care (គ្លីនិកកុមារ និងថែទាំទារក)",
                "code": "DOMREY-PED",
                "floor_room": "Consultation Suite 1",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Voleak Morn, MD",
                        "specialty": "Pediatrician",
                        "bio": "Dedicated to compassionate infant and child care, toddler nutrition, and prompt fever triage.",
                        "room_number": "Suite 1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Pediatric Health Checkup", "duration_minutes": 15, "price": 20.0},
                    {"name": "Childhood Influenza & MMR Booster", "duration_minutes": 15, "price": 28.0},
                    {"name": "Pediatric Nebulizer Treatment for Asthma / Cough", "duration_minutes": 20, "price": 15.0},
                ],
                "queue": {
                    "prefix": "DOMREY",
                    "serving_num": "DOMREY-003",
                    "patients": [
                        ("Master David (2 yr - Wheezing Check)", "012778899"),
                    ],
                },
            },
        ],
    },
]


async def seed_pediatric_database():
    """Seeds verified Cambodian Children's Hospitals, Pediatric Clinics, and Child Health Services."""
    print("👶 Connecting to database to seed Cambodia Pediatric & Children's Facilities...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        for p_data in CAMBODIA_PEDIATRIC_FACILITIES:
            hosp_res = await session.execute(
                select(Hospital).where(Hospital.slug == p_data["slug"])
            )
            existing_hosp = hosp_res.scalar_one_or_none()

            if not existing_hosp:
                existing_hosp = Hospital(
                    name=p_data["name"],
                    slug=p_data["slug"],
                    description=p_data["description"],
                    phone=p_data.get("phone"),
                    email=p_data.get("email"),
                    website=p_data.get("website"),
                    address=p_data["address"],
                    latitude=p_data.get("latitude"),
                    longitude=p_data.get("longitude"),
                    is_active=p_data["is_active"],
                    is_verified=p_data["is_verified"],
                    verification_status=p_data["verification_status"],
                    emergency_service_available=p_data["emergency_service_available"],
                    rating=p_data["rating"],
                    total_reviews=p_data["total_reviews"],
                )
                session.add(existing_hosp)
                await session.flush()
                print(f"  + Added Children's Hospital: {existing_hosp.name}")
            else:
                existing_hosp.name = p_data["name"]
                existing_hosp.phone = p_data.get("phone")
                existing_hosp.address = p_data["address"]
                existing_hosp.latitude = p_data.get("latitude")
                existing_hosp.longitude = p_data.get("longitude")
                existing_hosp.rating = p_data["rating"]
                existing_hosp.emergency_service_available = p_data["emergency_service_available"]
                await session.flush()
                print(f"  ✓ Updated Children's Hospital: {existing_hosp.name}")

            # Process departments
            for d_data in p_data.get("departments", []):
                dept_res = await session.execute(
                    select(Department).where(
                        Department.hospital_id == existing_hosp.id,
                        Department.name == d_data["name"],
                    )
                )
                dept = dept_res.scalar_one_or_none()
                if not dept:
                    dept = Department(
                        hospital_id=existing_hosp.id,
                        name=d_data["name"],
                        code=d_data.get("code"),
                        floor_room=d_data.get("floor_room"),
                        avg_consultation_minutes=d_data.get("avg_consultation_minutes", 15),
                        is_active=True,
                    )
                    session.add(dept)
                    await session.flush()
                else:
                    dept.floor_room = d_data.get("floor_room")
                    dept.code = d_data.get("code")
                    dept.avg_consultation_minutes = d_data.get("avg_consultation_minutes", 15)
                    await session.flush()

                # Process doctors (pediatricians)
                for doc_data in d_data.get("doctors", []):
                    doc_res = await session.execute(
                        select(Doctor).where(
                            Doctor.department_id == dept.id,
                            Doctor.full_name == doc_data["full_name"],
                        )
                    )
                    doc = doc_res.scalar_one_or_none()
                    if not doc:
                        doc = Doctor(
                            hospital_id=existing_hosp.id,
                            department_id=dept.id,
                            full_name=doc_data["full_name"],
                            specialty=doc_data["specialty"],
                            bio=doc_data.get("bio"),
                            room_number=doc_data.get("room_number"),
                            avg_consultation_minutes=doc_data.get("avg_consultation_minutes", 15),
                            is_available=doc_data.get("is_available", True),
                            is_active=True,
                        )
                        session.add(doc)
                        await session.flush()

                # Process services
                for s_data in d_data.get("services", []):
                    svc_res = await session.execute(
                        select(Service).where(
                            Service.department_id == dept.id,
                            Service.name == s_data["name"],
                        )
                    )
                    svc = svc_res.scalar_one_or_none()
                    if not svc:
                        svc = Service(
                            hospital_id=existing_hosp.id,
                            department_id=dept.id,
                            name=s_data["name"],
                            duration_minutes=s_data["duration_minutes"],
                            price=s_data["price"],
                            is_active=True,
                        )
                        session.add(svc)
                        await session.flush()

                # Process queue sessions & active tickets
                q_info = d_data.get("queue")
                if q_info:
                    q_res = await session.execute(
                        select(QueueSession).where(
                            QueueSession.department_id == dept.id,
                            QueueSession.session_date == date.today(),
                            QueueSession.status == QueueStatus.ACTIVE,
                        )
                    )
                    q_sess = q_res.scalar_one_or_none()
                    if not q_sess:
                        q_sess = QueueSession(
                            hospital_id=existing_hosp.id,
                            department_id=dept.id,
                            session_date=date.today(),
                            status=QueueStatus.ACTIVE,
                            current_serving_number=q_info["serving_num"],
                            total_issued_today=len(q_info["patients"]) + 5,
                        )
                        session.add(q_sess)
                        await session.flush()

                        # Seed sample waiting tickets
                        prefix = q_info["prefix"]
                        for idx, (p_name, p_phone) in enumerate(q_info["patients"], 1):
                            t_num = f"{prefix}-{idx:03d}"
                            t_wait = idx * dept.avg_consultation_minutes
                            ticket = Ticket(
                                ticket_number=t_num,
                                queue_session_id=q_sess.id,
                                hospital_id=existing_hosp.id,
                                department_id=dept.id,
                                patient_name=p_name,
                                patient_phone=p_phone,
                                ticket_source=TicketSource.ONLINE if idx % 2 == 0 else TicketSource.WALK_IN,
                                status=TicketStatus.WAITING,
                                position=idx,
                                estimated_wait_minutes=t_wait,
                            )
                            session.add(ticket)
                        await session.flush()

        await session.commit()
        print("✅ Successfully seeded Cambodia Pediatric & Children's facilities!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_pediatric_database())
