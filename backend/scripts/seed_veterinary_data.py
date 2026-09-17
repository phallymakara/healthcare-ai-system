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

VETERINARY_CLINICS = [
    {
        "name": "Animal Mama Veterinary Hospital (មន្ទីរពេទ្យសត្វ អានីម៉ល ម៉ាម៉ា)",
        "slug": "animal-mama-veterinary-hospital",
        "description": "Premier 24/7 emergency veterinary hospital in Phnom Penh. Specializing in advanced soft-tissue surgery, digital radiography, ultrasound, ICU oxygen therapy, pet relocation, and wildlife rescue triage.",
        "phone": "+85510500999",
        "email": "contact@animal-mama.com",
        "website": "https://animal-mama.com",
        "address": "Villa #51, Street 454, Phsar Derm Tkov, Chamkarmon, Phnom Penh",
        "latitude": 11.5332,
        "longitude": 104.9216,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.9,
        "total_reviews": 340,
        "departments": [
            {
                "name": "24/7 Emergency & Critical Care (សង្គ្រោះបន្ទាន់សត្វ)",
                "code": "VET-ER",
                "floor_room": "Ground Floor, Trauma Room 1",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Sarah Lindqvist, DVM",
                        "specialty": "Emergency Veterinary Medicine & Critical Care",
                        "bio": "Specialist in trauma stabilization, gastric dilation volvulus (GDV), acute toxicity management, and emergency transfusions.",
                        "room_number": "Trauma 1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Emergency Triage & Patient Stabilization", "duration_minutes": 20, "price": 35.0},
                    {"name": "Toxicity / Poisoning Immediate Decontamination", "duration_minutes": 30, "price": 50.0},
                    {"name": "Emergency Oxygen Therapy & IV Fluid Resuscitation", "duration_minutes": 45, "price": 40.0},
                ],
                "queue": {
                    "prefix": "VET-ER",
                    "serving_num": "VET-ER-003",
                    "patients": [
                        ("Bona (Golden Retriever - Heatstroke)", "012889911"),
                        ("Mimi (Persian Cat - Poisoning Check)", "098223344"),
                    ],
                },
            },
            {
                "name": "General Small Animal Medicine & Vaccinations (ពិនិត្យទូទៅ និងចាក់វ៉ាក់សាំង)",
                "code": "VET-MED",
                "floor_room": "Ground Floor, Consultation Room 2",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Piseth Chan, DVM",
                        "specialty": "Small Animal Internal Medicine",
                        "bio": "Over 10 years treating canine infectious diseases, feline nephrology, skin allergies, and preventative vaccination.",
                        "room_number": "Room 2",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "General Wellness Check & Physical Examination", "duration_minutes": 15, "price": 18.0},
                    {"name": "Rabies Vaccination + Certificate (វ៉ាក់សាំងជំងឺឆ្កែឆ្កួត)", "duration_minutes": 10, "price": 12.0},
                    {"name": "Core Canine DHPPi / Feline FVRCP Vaccine", "duration_minutes": 15, "price": 22.0},
                    {"name": "Pet Microchipping & Registration", "duration_minutes": 15, "price": 25.0},
                ],
                "queue": {
                    "prefix": "VET-MED",
                    "serving_num": "VET-MED-005",
                    "patients": [
                        ("Lucky (Husky - Annual Booster)", "077112233"),
                        ("Kiki (Domestic Shorthair - Skin Allergy)", "089556677"),
                        ("Brownie (Poodle - Routine Check)", "011334455"),
                    ],
                },
            },
            {
                "name": "Veterinary Surgery & Orthopedics (វះកាត់ និងឆ្អឹងសត្វ)",
                "code": "VET-SURG",
                "floor_room": "First Floor, Sterile Surgical Suite",
                "avg_consultation_minutes": 25,
                "doctors": [
                    {
                        "full_name": "Dr. Marc Dubois, DVM, MRCVS",
                        "specialty": "Veterinary Surgeon",
                        "bio": "Specialist in soft tissue reconstruction, spay/neuter, foreign body removal, and bone fracture repair.",
                        "room_number": "OR-1",
                        "avg_consultation_minutes": 25,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Cat Spay / Neuter Surgery (Sterilization)", "duration_minutes": 45, "price": 45.0},
                    {"name": "Dog Spay / Neuter Surgery (Sterilization)", "duration_minutes": 60, "price": 75.0},
                    {"name": "Digital X-Ray Radiography (2 Views)", "duration_minutes": 20, "price": 40.0},
                    {"name": "Abdominal Ultrasound Diagnostic Scan", "duration_minutes": 25, "price": 50.0},
                ],
                "queue": {
                    "prefix": "VET-SURG",
                    "serving_num": "VET-SURG-002",
                    "patients": [
                        ("Max (Bulldog - Pre-Surgical Consult)", "015443322"),
                    ],
                },
            },
        ],
    },
    {
        "name": "EUROVET Clinic Phnom Penh (គ្លីនិកសត្វ អឺរ៉ូវ៉េត)",
        "slug": "eurovet-animal-clinic-phnom-penh",
        "description": "Full-service veterinary hospital in Boeung Keng Kang providing 24/7 inpatient hospitalization, modern surgical equipment, diagnostic blood analyzers, and dental prophylaxis for dogs and cats.",
        "phone": "+85512803024",
        "email": "info@eurovetcambodia.com",
        "website": "https://eurovetcambodia.com",
        "address": "No. 17, Street 288, BKK1, Boeung Keng Kang, Phnom Penh",
        "latitude": 11.5492,
        "longitude": 104.9221,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.8,
        "total_reviews": 215,
        "departments": [
            {
                "name": "Outpatient & Internal Medicine (ពិនិត្យជំងឺសត្វទូទៅ)",
                "code": "EV-MED",
                "floor_room": "Room 101",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Jean-Pierre Laurent, DVM",
                        "specialty": "Small Animal Practitioner",
                        "bio": "French licensed veterinarian with 15+ years of experience across Europe and Southeast Asia.",
                        "room_number": "Room 101",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "General Veterinary Consultation", "duration_minutes": 15, "price": 20.0},
                    {"name": "Comprehensive In-House Blood Chemistry & CBC", "duration_minutes": 20, "price": 55.0},
                    {"name": "Deworming & Parasite Prevention Protocol", "duration_minutes": 10, "price": 10.0},
                ],
                "queue": {
                    "prefix": "EV-MED",
                    "serving_num": "EV-MED-004",
                    "patients": [
                        ("Bella (Corgi - Ear Infection Check)", "016887766"),
                        ("Milo (Siamese Cat - Dietary Consultation)", "097112244"),
                    ],
                },
            },
            {
                "name": "Dentistry & Inpatient Care (ទន្តសាស្ត្រ និងសម្រាកព្យាបាល)",
                "code": "EV-DENT",
                "floor_room": "Dental Suite & Ward",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Vutha Kim, DVM",
                        "specialty": "Veterinary Dental & Hospital Care",
                        "bio": "Certified veterinary dental specialist focusing on ultrasonic scaling, tooth extraction, and feline stomatitis.",
                        "room_number": "Ward 2",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Ultrasonic Dental Scaling & Polishing under Anesthesia", "duration_minutes": 45, "price": 60.0},
                    {"name": "24-Hour Medical Hospitalization & Monitoring", "duration_minutes": 60, "price": 30.0},
                ],
                "queue": {
                    "prefix": "EV-DENT",
                    "serving_num": "EV-DENT-001",
                    "patients": [
                        ("Teddy (Shih Tzu - Dental Scaling)", "092445588"),
                    ],
                },
            },
        ],
    },
    {
        "name": "VSL Veterinary Clinic (គ្លីនិកសត្វ វីអេសអិល)",
        "slug": "vsl-veterinary-clinic-phnom-penh",
        "description": "High-standard clinical practice in BKK1 with an international veterinary team. Renowned for pet relocation certification, blood diagnostics, orthopedic surgery, and preventive care.",
        "phone": "+85523986640",
        "email": "info@vslvet.com",
        "website": "https://vslvet.com",
        "address": "No. 33A, Street 334, BKK1, Boeung Keng Kang, Phnom Penh",
        "latitude": 11.5510,
        "longitude": 104.9245,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": False,
        "rating": 4.7,
        "total_reviews": 190,
        "departments": [
            {
                "name": "General Clinical Practice & International Travel (ពិនិត្យទូទៅ និងលិខិតធ្វើដំណើរ)",
                "code": "VSL-GEN",
                "floor_room": "Consultation 1",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Sopheap Heng, DVM",
                        "specialty": "General Veterinary Practitioner & Relocation Advisor",
                        "bio": "Expert in international pet import/export health passports, titer testing, and preventative epidemiology.",
                        "room_number": "Consultation 1",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Routine Health Examination", "duration_minutes": 20, "price": 22.0},
                    {"name": "International Pet Travel Health Certificate", "duration_minutes": 30, "price": 60.0},
                    {"name": "Rabies Serological Titer Test Sampling", "duration_minutes": 20, "price": 95.0},
                ],
                "queue": {
                    "prefix": "VSL-GEN",
                    "serving_num": "VSL-GEN-002",
                    "patients": [
                        ("Leo (Golden Retriever - Travel Clearance)", "010998877"),
                    ],
                },
            },
        ],
    },
    {
        "name": "CamPaws Animal Hospital (មន្ទីរពេទ្យសត្វ ខេមផውስ)",
        "slug": "campaws-animal-hospital-phnom-penh",
        "description": "Modern animal clinic in Sen Sok offering comprehensive veterinary consultations, diagnostic blood tests, sterile soft-tissue surgeries, and vaccinations for companion pets.",
        "phone": "+855965416272",
        "email": "campaws.kh@gmail.com",
        "website": "https://campaws-animalhospital.com",
        "address": "No. 128, Street 1986, Phnom Penh Thmey, Sen Sok, Phnom Penh",
        "latitude": 11.5815,
        "longitude": 104.8812,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": False,
        "rating": 4.8,
        "total_reviews": 145,
        "departments": [
            {
                "name": "Small Animal Clinic & Surgery (គ្លីនិកសត្វតូច និងវះកាត់)",
                "code": "CP-CLINIC",
                "floor_room": "Main Clinic Area",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Rathana Ouk, DVM",
                        "specialty": "Veterinary Practitioner",
                        "bio": "Dedicated to community pet health, pediatric pet vaccinations, and affordable surgical care.",
                        "room_number": "Room 1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "General Health Checkup", "duration_minutes": 15, "price": 15.0},
                    {"name": "Cat Spay / Neuter Package", "duration_minutes": 45, "price": 40.0},
                    {"name": "Infectious Disease Rapid Test (Parvo/CPV, CDV)", "duration_minutes": 15, "price": 20.0},
                ],
                "queue": {
                    "prefix": "CP-CLINIC",
                    "serving_num": "CP-003",
                    "patients": [
                        ("Tiger (Ginger Tabby - Deworming)", "017223344"),
                        ("Coco (Pug - Parvo Screening)", "093445566"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Siem Reap Veterinary Care (គ្លីនិកសត្វ សៀមរាប)",
        "slug": "siem-reap-veterinary-care",
        "description": "The leading dedicated veterinary clinic in Siem Reap province. Providing high-standard diagnostics, soft-tissue surgeries, pet vaccinations, and emergency medical attention for domestic and expat pets.",
        "phone": "+855963248380",
        "email": "info@siemreapvet.com",
        "website": "https://siemreapvet.com",
        "address": "Street 07, Svay Dangkum, Krong Siem Reap, Siem Reap Province",
        "latitude": 13.3562,
        "longitude": 103.8547,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.9,
        "total_reviews": 180,
        "departments": [
            {
                "name": "Outpatient Clinic & Emergency (ផ្នែកជំងឺទូទៅ និងសង្គ្រោះបន្ទាន់)",
                "code": "SRV-CLINIC",
                "floor_room": "Consultation Suite A",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Martin Becker, DVM",
                        "specialty": "Veterinary Medical Director",
                        "bio": "Experienced European veterinary clinician providing modern compassionate care for animals across northwestern Cambodia.",
                        "room_number": "Suite A",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Comprehensive Clinical Consultation", "duration_minutes": 20, "price": 20.0},
                    {"name": "Annual Booster & Rabies Inoculation", "duration_minutes": 15, "price": 15.0},
                    {"name": "Emergency Wound Treatment & Suturing", "duration_minutes": 35, "price": 45.0},
                ],
                "queue": {
                    "prefix": "SRV",
                    "serving_num": "SRV-002",
                    "patients": [
                        ("Shadow (Labrador - Limping Exam)", "081223388"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Worldwide Veterinary Service (WVS) / ARC Clinic (គ្លីនិកសុខុមាលភាពសត្វ WVS / ARC)",
        "slug": "wvs-arc-veterinary-clinic-cambodia",
        "description": "International veterinary non-profit clinic in Phnom Penh working in rabies elimination, population control through humane spay/neuter outreach, and rescue medical care.",
        "phone": "+85512340114",
        "email": "cambodia@wvs.org.uk",
        "website": "https://wvscambodia.org",
        "address": "Street 41, Phsar Derm Tkov, Khan Chamkarmon, Phnom Penh",
        "latitude": 11.5358,
        "longitude": 104.9205,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": False,
        "rating": 4.9,
        "total_reviews": 310,
        "departments": [
            {
                "name": "Community Animal Welfare & Sterilization (ការចាក់ថ្នាំ និងពង្រីកសុខភាពសត្វ)",
                "code": "WVS-WELFARE",
                "floor_room": "Outreach Clinic 1",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Chamnan Som, DVM",
                        "specialty": "Shelter Medicine & High-Volume Spay/Neuter",
                        "bio": "Leading public health campaigns for dog rabies vaccination and humane companion animal population management.",
                        "room_number": "Room 1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Rabies Vaccination Drive (យុទ្ធនាការចាក់វ៉ាក់សាំងឆ្កែឆ្កួត)", "duration_minutes": 10, "price": 5.0},
                    {"name": "Subsidized Community Cat/Dog Neuter", "duration_minutes": 30, "price": 20.0},
                    {"name": "Mange & Parasite Eradication Treatment", "duration_minutes": 15, "price": 10.0},
                ],
                "queue": {
                    "prefix": "WVS",
                    "serving_num": "WVS-004",
                    "patients": [
                        ("Stray Rescue Pup 1 (Rabies Vaccine)", "012330099"),
                        ("Temple Cat 2 (Neuter Check)", "015887722"),
                    ],
                },
            },
        ],
    },
    {
        "name": "PPAWS - Phnom Penh Animal Welfare Society (សមាគមសុខុមាលភាពសត្វភ្នំពេញ)",
        "slug": "ppaws-animal-clinic-phnom-penh",
        "description": "Established community animal welfare clinic providing affordable medical treatments, low-cost spay and neuter surgeries, rabies shots, and mobile clinic veterinary assistance.",
        "phone": "+85512250136",
        "email": "info@ppaws.com",
        "website": "https://ppaws.com",
        "address": "National Road 2, Chak Angre Krom, Khan Meanchey, Phnom Penh",
        "latitude": 11.5098,
        "longitude": 104.9351,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": False,
        "rating": 4.7,
        "total_reviews": 220,
        "departments": [
            {
                "name": "Community Veterinary Clinic (គ្លីនិកសហគមន៍សត្វ)",
                "code": "PPAWS-CLINIC",
                "floor_room": "Clinic Floor",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Kimleang Meas, DVM",
                        "specialty": "Community Veterinary Practice",
                        "bio": "Experienced in preventative medicine, feline health, and low-cost animal welfare surgeries.",
                        "room_number": "Consultation 1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Basic Health Evaluation", "duration_minutes": 15, "price": 10.0},
                    {"name": "Rabies Vaccination & Deworming", "duration_minutes": 10, "price": 8.0},
                    {"name": "Low-Cost Spay / Neuter Surgery", "duration_minutes": 40, "price": 25.0},
                ],
                "queue": {
                    "prefix": "PPAWS",
                    "serving_num": "PPAWS-002",
                    "patients": [
                        ("Snowy (Kitten - Booster)", "096887711"),
                    ],
                },
            },
        ],
    },
]


async def seed_veterinary_database():
    """Seeds verified Cambodian veterinary hospitals, clinics, and animal health services."""
    print("🐾 Connecting to database to seed Veterinary & Animal Clinic data...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        for v_data in VETERINARY_CLINICS:
            hosp_res = await session.execute(
                select(Hospital).where(Hospital.slug == v_data["slug"])
            )
            existing_hosp = hosp_res.scalar_one_or_none()

            if not existing_hosp:
                existing_hosp = Hospital(
                    name=v_data["name"],
                    slug=v_data["slug"],
                    description=v_data["description"],
                    phone=v_data.get("phone"),
                    email=v_data.get("email"),
                    website=v_data.get("website"),
                    address=v_data["address"],
                    latitude=v_data.get("latitude"),
                    longitude=v_data.get("longitude"),
                    is_active=v_data["is_active"],
                    is_verified=v_data["is_verified"],
                    verification_status=v_data["verification_status"],
                    emergency_service_available=v_data["emergency_service_available"],
                    rating=v_data["rating"],
                    total_reviews=v_data["total_reviews"],
                )
                session.add(existing_hosp)
                await session.flush()
                print(f"  + Added Veterinary Hospital: {existing_hosp.name}")
            else:
                existing_hosp.name = v_data["name"]
                existing_hosp.phone = v_data.get("phone")
                existing_hosp.address = v_data["address"]
                existing_hosp.latitude = v_data.get("latitude")
                existing_hosp.longitude = v_data.get("longitude")
                existing_hosp.rating = v_data["rating"]
                existing_hosp.emergency_service_available = v_data["emergency_service_available"]
                await session.flush()
                print(f"  ✓ Updated Veterinary Hospital: {existing_hosp.name}")

            # Process departments
            for d_data in v_data.get("departments", []):
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

                # Process doctors (veterinarians)
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
                            total_issued_today=len(q_info["patients"]) + 3,
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
        print("✅ Successfully seeded Veterinary & Animal Clinic facilities!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_veterinary_database())
