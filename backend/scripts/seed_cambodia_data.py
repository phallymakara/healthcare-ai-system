import sys
import logging
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

import asyncio
import uuid
from datetime import date, datetime
from sqlalchemy import select, delete
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

CAMBODIA_HOSPITALS = [
    {
        "name": "Calmette Hospital (មន្ទីរពេទ្យកាល់ម៉ែត)",
        "slug": "calmette-hospital-phnom-penh",
        "description": "Cambodia's premier public tertiary referral hospital specializing in cardiology, neurosurgery, emergency trauma, and oncology.",
        "phone": "+85523426948",
        "email": "info@calmette.gov.kh",
        "website": "https://calmette.gov.kh",
        "address": "No. 3, Preah Monivong Blvd, Srah Chak, Daun Penh, Phnom Penh",
        "latitude": 11.5831,
        "longitude": 104.9189,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.8,
        "total_reviews": 1240,
        "departments": [
            {
                "name": "Cardiology & Heart Center",
                "code": "CARDIO",
                "floor_room": "Building A, Floor 2, Room 201",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Sokha Meas, MD",
                        "specialty": "Senior Interventional Cardiologist",
                        "bio": "Fellow of European Society of Cardiology with 18+ years treating coronary artery disease and hypertension.",
                        "room_number": "Room 201",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "12-Lead ECG & Consultation", "duration_minutes": 15, "price": 25.0},
                    {"name": "Color Doppler Echocardiography", "duration_minutes": 30, "price": 65.0},
                    {"name": "24-Hour Holter Blood Pressure Monitoring", "duration_minutes": 20, "price": 45.0},
                ],
                "queue": {
                    "prefix": "CARDIO",
                    "serving_num": "CARDIO-008",
                    "patients": [
                        ("Vannak Keo", "012345671"),
                        ("Sokly Mom", "092445566"),
                        ("Borey Hem", "078990011"),
                        ("Thavy Ly", "015882233"),
                        ("Chanthou Sin", "089334455"),
                    ],
                },
            },
            {
                "name": "Neurology & Stroke Center",
                "code": "NEURO",
                "floor_room": "Building B, Floor 3, Room 305",
                "avg_consultation_minutes": 25,
                "doctors": [
                    {
                        "full_name": "Vicheth Chea, MD",
                        "specialty": "Neurologist & Stroke Specialist",
                        "bio": "Specialist in acute ischemic stroke, Parkinson's disease, and epilepsy management.",
                        "room_number": "Room 305",
                        "avg_consultation_minutes": 25,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Comprehensive Neurological Assessment", "duration_minutes": 25, "price": 35.0},
                    {"name": "Brain MRI & Stroke Protocol", "duration_minutes": 40, "price": 180.0},
                ],
                "queue": {
                    "prefix": "NEURO",
                    "serving_num": "NEURO-004",
                    "patients": [
                        ("Bunrath Chan", "012998877"),
                        ("Kimheng Pich", "098112233"),
                        ("Sreyneth Som", "077556644"),
                    ],
                },
            },
            {
                "name": "General & Laparoscopic Surgery",
                "code": "SURG",
                "floor_room": "Building A, Floor 1, Room 102",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Bunna Seng, MD",
                        "specialty": "Chief Laparoscopic Surgeon",
                        "bio": "Specialized in minimally invasive abdominal surgery and emergency trauma.",
                        "room_number": "Room 102",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Pre-Surgical Consultation & Triage", "duration_minutes": 15, "price": 20.0},
                    {"name": "Abdominal Ultrasound Examination", "duration_minutes": 20, "price": 30.0},
                ],
                "queue": {
                    "prefix": "SURG",
                    "serving_num": "SURG-006",
                    "patients": [
                        ("Kunthea Ros", "093448822"),
                        ("Dara Nguon", "011229988"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Khmer-Soviet Friendship Hospital (មន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត / ពេទ្យរុស្ស៊ី)",
        "slug": "khmer-soviet-friendship-hospital",
        "description": "Major public hospital in Chamkarmon known for pulmonary diseases, infectious medicine, hemodialysis, and general internal medicine.",
        "phone": "+85523217764",
        "email": "info@ksfh.gov.kh",
        "address": "Yothapol Khemarak Phoumin Blvd (St. 271), Chamkarmon, Phnom Penh",
        "latitude": 11.5369,
        "longitude": 104.9084,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.6,
        "total_reviews": 980,
        "departments": [
            {
                "name": "Pulmonology & Respiratory Medicine",
                "code": "PULMO",
                "floor_room": "Building C, Floor 1, Room 108",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Sovannarith Keo, MD",
                        "specialty": "Pulmonology & Asthma Consultant",
                        "bio": "National expert in asthma, COPD, chronic cough, and lung infections.",
                        "room_number": "Room 108",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Digital Chest X-Ray & Pulmonology Review", "duration_minutes": 15, "price": 20.0},
                    {"name": "Spirometry Lung Function Test", "duration_minutes": 20, "price": 30.0},
                ],
                "queue": {
                    "prefix": "PULMO",
                    "serving_num": "PULMO-012",
                    "patients": [
                        ("Sovanrithy Chhay", "012665544"),
                        ("Bopha Meng", "096332211"),
                        ("Vireak Roth", "088776655"),
                        ("Channa Eam", "092113344"),
                    ],
                },
            },
            {
                "name": "Nephrology & Hemodialysis",
                "code": "NEPHRO",
                "floor_room": "Building D, Floor 2, Room 205",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Rithy Lim, MD",
                        "specialty": "Nephrologist & Renal Specialist",
                        "bio": "Experienced kidney specialist overseeing inpatient dialysis and chronic kidney disease management.",
                        "room_number": "Room 205",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Kidney Function Blood Panel (eGFR, Creatinine)", "duration_minutes": 15, "price": 18.0},
                    {"name": "Routine Hemodialysis Session", "duration_minutes": 240, "price": 45.0},
                ],
                "queue": {
                    "prefix": "NEPHRO",
                    "serving_num": "NEPHRO-003",
                    "patients": [
                        ("Kosal Prak", "012887766"),
                        ("Theara Suon", "097665544"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Kantha Bopha Children's Hospital IV (មន្ទីរពេទ្យគន្ធបុប្ផាទី៤ ភ្នំពេញ)",
        "slug": "kantha-bopha-hospital-phnom-penh",
        "description": "Legendary pediatric hospital delivering free, world-class medical and surgical treatment for infants, children, and pregnant mothers.",
        "phone": "+85523722020",
        "website": "https://beat-richner.ch",
        "address": "Street 47, Sangkat Wat Phnom, Khan Daun Penh, Phnom Penh",
        "latitude": 11.5786,
        "longitude": 104.9228,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 5.0,
        "total_reviews": 3500,
        "departments": [
            {
                "name": "Pediatric Outpatient Consultation",
                "code": "PEDIATRIC",
                "floor_room": "Outpatient Pavilion, Room P-101",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Chan Moly, MD",
                        "specialty": "Chief Pediatric Consultant",
                        "bio": "Dedicated child health physician with 20 years at Kantha Bopha managing acute infections and malnutrition.",
                        "room_number": "Room P-101",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    },
                    {
                        "full_name": "Bopha Tep, MD",
                        "specialty": "Pediatrician & Neonatal Specialist",
                        "bio": "Specialist in newborn screening, infant fever, and vaccination schedules.",
                        "room_number": "Room P-102",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    },
                ],
                "services": [
                    {"name": "Free Pediatric Comprehensive Consultation", "duration_minutes": 15, "price": 0.0},
                    {"name": "Child Fever & Dengue Diagnostic Evaluation", "duration_minutes": 20, "price": 0.0},
                    {"name": "Essential Childhood Immunization Protocol", "duration_minutes": 15, "price": 0.0},
                ],
                "queue": {
                    "prefix": "PEDIATRIC",
                    "serving_num": "PEDIATRIC-024",
                    "patients": [
                        ("Chenda Khorn (Child: Seyha)", "012339944"),
                        ("Piseth Yan (Child: Dara)", "093887766"),
                        ("Malen Chey (Child: Sreypov)", "088221144"),
                        ("Rath Sam (Child: Makara)", "077998811"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Sunrise Japan Hospital Phnom Penh (មន្ទីរពេទ្យជប៉ុន សាន់រ៉ាយស៍)",
        "slug": "sunrise-japan-hospital-phnom-penh",
        "description": "International Japanese-standard hospital in Chroy Changvar with Japanese and Cambodian doctors providing advanced emergency, stroke care, and executive checkups.",
        "phone": "+85523432666",
        "email": "contact@sunrise-hs.com",
        "website": "https://sunrise-hs.com",
        "address": "No. 177D, Kola Loum Street, Chroy Changvar, Phnom Penh",
        "latitude": 11.5975,
        "longitude": 104.9312,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.9,
        "total_reviews": 750,
        "departments": [
            {
                "name": "Emergency & Stroke Center",
                "code": "SJH-STROKE",
                "floor_room": "Ground Floor, Room ER-01",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Kenjiro Tanaka, MD",
                        "specialty": "Emergency & Neuro-Trauma Director",
                        "bio": "Certified emergency specialist from Tokyo Medical Center with rapid stroke intervention expertise.",
                        "room_number": "Room ER-01",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Rapid Emergency Triage & Neuro Evaluation", "duration_minutes": 20, "price": 50.0},
                    {"name": "High-Definition 1.5T Brain MRI", "duration_minutes": 35, "price": 210.0},
                ],
                "queue": {
                    "prefix": "SJH-STROKE",
                    "serving_num": "SJH-STROKE-005",
                    "patients": [
                        ("Tola Seng", "012558833"),
                        ("Chanthy Noun", "098224466"),
                    ],
                },
            },
            {
                "name": "Gastroenterology & Endoscopy Center",
                "code": "SJH-GASTRO",
                "floor_room": "Floor 2, Room 215",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Khemara Seng, MD",
                        "specialty": "Gastroenterologist & Hepatologist",
                        "bio": "Specialist in liver health, hepatitis B/C, acid reflux (GERD), and colonoscopy.",
                        "room_number": "Room 215",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Digestive Health Consultation & H. Pylori Test", "duration_minutes": 20, "price": 40.0},
                    {"name": "Video Gastroscopy (Stomach Endoscopy)", "duration_minutes": 30, "price": 160.0},
                ],
                "queue": {
                    "prefix": "SJH-GASTRO",
                    "serving_num": "SJH-GASTRO-002",
                    "patients": [
                        ("Sopheak Men", "015994422"),
                        ("Kanika Som", "092334411"),
                        ("Vuthy Chhay", "088665511"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Preah Ket Mealea Hospital (មន្ទីរពេទ្យព្រះកេតុមាលា / ពេទ្យទាហាន)",
        "slug": "preah-ket-mealea-hospital",
        "description": "Historic national hospital known for orthopedic trauma, joint surgery, ophthalmology, and ear-nose-throat (ENT) care.",
        "phone": "+85523883011",
        "address": "Preah Mohaksat Treiyani Kossamak Blvd (St. 47), Srah Chak, Phnom Penh",
        "latitude": 11.5804,
        "longitude": 104.9192,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.5,
        "total_reviews": 610,
        "departments": [
            {
                "name": "Orthopedics & Joint Replacement",
                "code": "ORTHO",
                "floor_room": "Building 2, Floor 2, Room 204",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dararith Pen, MD",
                        "specialty": "Orthopedic & Trauma Surgeon",
                        "bio": "22 years experience performing joint replacements, fracture fixations, and athletic sports injuries.",
                        "room_number": "Room 204",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Bone & Joint Consultation with X-Ray", "duration_minutes": 15, "price": 25.0},
                    {"name": "Knee Osteoarthritis Hyaluronic Injection", "duration_minutes": 20, "price": 60.0},
                ],
                "queue": {
                    "prefix": "ORTHO",
                    "serving_num": "ORTHO-009",
                    "patients": [
                        ("Mao Sambath", "012778899"),
                        ("Thida Chea", "096554433"),
                        ("Pharith Oung", "088332211"),
                    ],
                },
            },
            {
                "name": "Ophthalmology (Eye Care Center)",
                "code": "EYE",
                "floor_room": "Building 3, Floor 1, Room 118",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Chamroeun Som, MD",
                        "specialty": "Senior Eye Surgeon & Cataract Specialist",
                        "bio": "Expert in Phaco cataract surgery, diabetic retinopathy, and refractive error correction.",
                        "room_number": "Room 118",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Slit-Lamp Eye Exam & Refraction Check", "duration_minutes": 15, "price": 18.0},
                    {"name": "Glaucoma Screening & Intraocular Pressure Test", "duration_minutes": 20, "price": 25.0},
                ],
                "queue": {
                    "prefix": "EYE",
                    "serving_num": "EYE-007",
                    "patients": [
                        ("Chhay Hak", "012441199"),
                        ("Sophea Yim", "092881133"),
                        ("Nary Seng", "016554422"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Pasteur Institute of Cambodia (វិទ្យាស្ថានប៉ាស្ទ័រ កម្ពុជា)",
        "slug": "pasteur-institute-cambodia",
        "description": "Leading scientific institution offering international-standard rabies prevention, travel vaccines, and medical laboratory diagnostics.",
        "phone": "+85523426009",
        "email": "info@pasteur-kh.org",
        "website": "https://pasteur-kh.org",
        "address": "5 Preah Monivong Blvd (St. 93), Srah Chak, Daun Penh, Phnom Penh",
        "latitude": 11.5798,
        "longitude": 104.9195,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.9,
        "total_reviews": 1890,
        "departments": [
            {
                "name": "Rabies Prevention & Animal Bite Center",
                "code": "RABIES",
                "floor_room": "Ground Floor, Vaccination Hall Room 101",
                "avg_consultation_minutes": 10,
                "doctors": [
                    {
                        "full_name": "Sophal Tuy, MD",
                        "specialty": "Vaccinologist & Rabies Protocol Specialist",
                        "bio": "Director of rabies post-exposure prophylaxis with over 15 years preventing rabies in Cambodia.",
                        "room_number": "Room 101",
                        "avg_consultation_minutes": 10,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Post-Exposure Rabies Vaccine Injection (Dose 1-4)", "duration_minutes": 10, "price": 15.0},
                    {"name": "Rabies Immunoglobulin (RIG) Administration", "duration_minutes": 20, "price": 45.0},
                    {"name": "Tetanus Toxoid Booster Injection", "duration_minutes": 10, "price": 10.0},
                ],
                "queue": {
                    "prefix": "RABIES",
                    "serving_num": "RABIES-018",
                    "patients": [
                        ("Bunnarith Sin", "012993322"),
                        ("Davy Heng", "097886655"),
                        ("Phalla Keo", "092443311"),
                        ("Sophearith Tan", "015776655"),
                    ],
                },
            },
        ],
    },
    {
        "name": "Phnom Penh Animal Care & Veterinary Clinic (គ្លីនិកព្យាបាលសត្វភ្នំពេញ)",
        "slug": "phnom-penh-animal-care-clinic",
        "description": "24/7 modern small animal clinic for dogs, cats, and pets, offering general wellness checks, surgeries, ultrasound, and vaccination.",
        "phone": "+85523777888",
        "email": "care@pethospital.kh",
        "address": "Building 45, Street 360, BKK1, Phnom Penh",
        "latitude": 11.5432,
        "longitude": 104.9254,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.9,
        "total_reviews": 412,
        "departments": [
            {
                "name": "Pet Outpatient & General Medicine",
                "code": "VET-OPD",
                "floor_room": "Room Vet-A (Ground Floor)",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Seyha Long, DVM",
                        "specialty": "Small Animal Veterinary Physician",
                        "bio": "Veterinary doctor specializing in canine dermatology, feline infectious diseases, and puppy wellness.",
                        "room_number": "Room Vet-A",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Pet Health Examination & Physical Triage", "duration_minutes": 15, "price": 15.0},
                    {"name": "Core Canine Vaccine (DHPPi + Rabies)", "duration_minutes": 15, "price": 20.0},
                    {"name": "Pet Dental Cleaning & Scaling", "duration_minutes": 35, "price": 35.0},
                ],
                "queue": {
                    "prefix": "VET-OPD",
                    "serving_num": "VET-OPD-004",
                    "patients": [
                        ("Chanthy Sok (Dog: Lucky)", "012888111"),
                        ("Borey Vong (Cat: Mimi)", "093444222"),
                        ("Sothea Phan (Dog: Brownie)", "098111333"),
                    ],
                },
            },
            {
                "name": "Animal Surgery & Urgent Care",
                "code": "VET-SURG",
                "floor_room": "Room Vet-Surg (Floor 2)",
                "avg_consultation_minutes": 25,
                "doctors": [
                    {
                        "full_name": "Dr. Thida Roeun, DVM",
                        "specialty": "Veterinary Soft-Tissue Surgeon",
                        "bio": "Experienced veterinary surgeon for emergency wound repairs, neutering/spaying, and gastrointestinal foreign body removal.",
                        "room_number": "Room Vet-Surg",
                        "avg_consultation_minutes": 25,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Emergency Pet Trauma & Wound Suture", "duration_minutes": 30, "price": 45.0},
                    {"name": "Pet Abdominal Ultrasound Scan", "duration_minutes": 25, "price": 40.0},
                ],
                "queue": {
                    "prefix": "VET-SURG",
                    "serving_num": "VET-SURG-002",
                    "patients": [
                        ("Kosal Leng (Dog: Tiger)", "012334455"),
                        ("Pisey Oun (Cat: Bella)", "077991122"),
                    ],
                },
            },
        ],
    },
    # 8. Roomchang Dental & Aesthetic Hospital (Specialty Clinic)
    {
        "name": "Roomchang Dental & Aesthetic Hospital (មន្ទីរព្យាបាលធ្មេញ និងកែសម្ផស្ស រំចង់)",
        "slug": "roomchang-dental-hospital-phnom-penh",
        "description": "Cambodia's premier international dental and maxillofacial specialty center providing digital dentistry, dental implants, orthodontics, and cosmetic dental surgery.",
        "phone": "+85523211801",
        "email": "contact@roomchang.com",
        "website": "https://roomchang.com",
        "address": "No. 42, Street 178, Chey Chumneah, Daun Penh, Phnom Penh",
        "latitude": 11.5642,
        "longitude": 104.9281,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.9,
        "total_reviews": 640,
        "departments": [
            {
                "name": "Implant & Oral Maxillofacial Surgery",
                "code": "DENT-SURG",
                "floor_room": "Floor 3, Surgical Suite 301",
                "avg_consultation_minutes": 25,
                "doctors": [
                    {
                        "full_name": "Dr. Tith Hongsar, DDS",
                        "specialty": "Maxillofacial & Dental Implant Surgeon",
                        "bio": "Founding director and international master implantologist with 25+ years experience in bone grafting and guided implantology.",
                        "room_number": "Suite 301",
                        "avg_consultation_minutes": 25,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "3D CBCT Scan & Implant Consultation", "duration_minutes": 25, "price": 40.0},
                    {"name": "Surgical Tooth Extraction (Wisdom Tooth)", "duration_minutes": 35, "price": 80.0},
                ],
                "queue": {
                    "prefix": "DENT",
                    "serving_num": "DENT-004",
                    "patients": [
                        ("Vicheka Seng", "012884422"),
                        ("Chhany Rath", "098776655"),
                    ],
                },
            },
            {
                "name": "Orthodontics & Pediatric Dentistry",
                "code": "DENT-ORTHO",
                "floor_room": "Floor 2, Clinic Room 204",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Vuthy Keo, DDS",
                        "specialty": "Orthodontist",
                        "bio": "Certified Invisalign specialist providing comprehensive bite alignment and pediatric interceptive orthodontics.",
                        "room_number": "Room 204",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Orthodontic & Aligners Evaluation", "duration_minutes": 20, "price": 30.0},
                    {"name": "Routine Dental Cleaning & Airflow Polish", "duration_minutes": 25, "price": 25.0},
                ],
                "queue": {
                    "prefix": "BRACE",
                    "serving_num": "BRACE-002",
                    "patients": [
                        ("Maly Samnang", "011332211"),
                    ],
                },
            },
        ],
    },

    # 9. International Polyclinic & Maternity Center (Specialty Clinic)
    {
        "name": "International Polyclinic & Maternity Center (គ្លីនិកសម្ភព និងរោគស្ត្រី អន្តរជាតិ)",
        "slug": "international-polyclinic-maternity-phnom-penh",
        "description": "Specialized women's health clinic providing obstetric care, 4D high-definition ultrasound, gynecological surgery, and family planning.",
        "phone": "+85523992255",
        "email": "care@maternitypolyclinic.com.kh",
        "website": "https://maternitypolyclinic.com.kh",
        "address": "No. 188, Mao Tse Toung Blvd, Tuol Svay Prey, Boeng Keng Kang, Phnom Penh",
        "latitude": 11.5458,
        "longitude": 104.9123,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.7,
        "total_reviews": 420,
        "departments": [
            {
                "name": "Obstetrics & Gynecology (OB-GYN)",
                "code": "OBGYN",
                "floor_room": "Building B, Ground Floor, Room 102",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Chantrea Sam, MD",
                        "specialty": "Senior Obstetrician & Gynecologist",
                        "bio": "Experienced maternal-fetal medicine specialist with over 15 years supervising high-risk deliveries and prenatal screening.",
                        "room_number": "Room 102",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "4D HD Live Prenatal Ultrasound", "duration_minutes": 25, "price": 35.0},
                    {"name": "Cervical Cancer Screening (Pap Smear + HPV)", "duration_minutes": 15, "price": 45.0},
                ],
                "queue": {
                    "prefix": "OBGYN",
                    "serving_num": "OBGYN-006",
                    "patients": [
                        ("Sreypov Meas", "089223344"),
                        ("Kanika Nhem", "092113355"),
                        ("Davy Chorn", "070667788"),
                    ],
                },
            },
        ],
    },

    # 10. Angkor Eye Care Specialty Clinic (Specialty Clinic)
    {
        "name": "Angkor Eye Care Specialty Clinic (គ្លីនិកឯកទេសចក្ខុរោគ អង្គរ)",
        "slug": "angkor-eye-care-clinic-phnom-penh",
        "description": "Leading ophthalmology center offering phacoemulsification cataract surgery, corneal topography, retina assessment, and laser vision correction.",
        "phone": "+85523881144",
        "email": "info@angkoreye.com.kh",
        "website": "https://angkoreye.com.kh",
        "address": "No. 76, Russian Federation Blvd, Teuk Laak I, Tuol Kork, Phnom Penh",
        "latitude": 11.5689,
        "longitude": 104.8987,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": False,
        "rating": 4.8,
        "total_reviews": 310,
        "departments": [
            {
                "name": "Comprehensive Ophthalmology & Cataract",
                "code": "EYE-CAT",
                "floor_room": "Floor 2, Examination Room 202",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Sovannarith Kong, MD",
                        "specialty": "Consultant Ophthalmic Surgeon",
                        "bio": "Fellow of the Royal College of Ophthalmologists, specializing in micro-incision cataract surgery and refractive lenses.",
                        "room_number": "Room 202",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Dilated Fundus & Retinal Examination", "duration_minutes": 20, "price": 25.0},
                    {"name": "Intraocular Pressure (Tonometry) Glaucoma Check", "duration_minutes": 15, "price": 18.0},
                ],
                "queue": {
                    "prefix": "EYE",
                    "serving_num": "EYE-003",
                    "patients": [
                        ("Bunly Heng", "012998877"),
                        ("Channa Ros", "097554433"),
                    ],
                },
            },
        ],
    },

    # 11. VET-Care Cambodia Animal Hospital (Animal Clinic)
    {
        "name": "VET-Care Cambodia Animal Hospital (មន្ទីរពេទ្យសត្វ វ៉េតឃែរ កម្ពុជា)",
        "slug": "vet-care-cambodia-animal-hospital",
        "description": "Modern full-service companion animal hospital equipped with in-house laboratory, digital radiology, pet ICU, and orthopedic surgery suites.",
        "phone": "+85523668899",
        "email": "care@vetcarecambodia.com",
        "website": "https://vetcarecambodia.com",
        "address": "No. 55, Street 315, Boeng Kak II, Tuol Kork, Phnom Penh",
        "latitude": 11.5794,
        "longitude": 104.9012,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.9,
        "total_reviews": 380,
        "departments": [
            {
                "name": "Veterinary Outpatient & Diagnostics",
                "code": "VET-OPD",
                "floor_room": "Ground Floor, Consultation Bay 1",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Kimheng Ouk, DVM",
                        "specialty": "Small Animal Clinical Veterinarian",
                        "bio": "Veterinary medical doctor specialized in feline and canine infectious diseases, dermatology, and preventative wellness.",
                        "room_number": "Bay 1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Canine 5-in-1 Vaccine (DHPP) + Rabies", "duration_minutes": 15, "price": 22.0},
                    {"name": "Complete Pet Blood Count (CBC) & Chem-10", "duration_minutes": 20, "price": 38.0},
                ],
                "queue": {
                    "prefix": "VET-OPD",
                    "serving_num": "VET-OPD-005",
                    "patients": [
                        ("Chenda Krouch (Dog: Max)", "088554433"),
                        ("Romny Teng (Cat: Mochi)", "016778899"),
                        ("Sopheap Nuon (Dog: Lucky)", "010445566"),
                    ],
                },
            },
            {
                "name": "Pet Orthopedic & Soft Tissue Surgery",
                "code": "VET-SURG",
                "floor_room": "Floor 1, Sterile Operating Theater",
                "avg_consultation_minutes": 30,
                "doctors": [
                    {
                        "full_name": "Dr. Julien Moreau, DVM",
                        "specialty": "Senior Veterinary Surgeon",
                        "bio": "European board-certified veterinary surgeon focusing on fracture plating, cruciate ligament repair, and laparoscopy.",
                        "room_number": "Surg-OT",
                        "avg_consultation_minutes": 30,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Pet Fracture Fixation Consultation", "duration_minutes": 30, "price": 45.0},
                    {"name": "Canine Soft Tissue Spay / Neuter Procedure", "duration_minutes": 45, "price": 75.0},
                ],
                "queue": {
                    "prefix": "PET-SURG",
                    "serving_num": "PET-SURG-002",
                    "patients": [
                        ("Vannak Long (Dog: Rocky)", "012338899"),
                    ],
                },
            },
        ],
    },

    # 12. Angkor Pet Hospital & Emergency Care (Animal Clinic)
    {
        "name": "Angkor Pet Hospital & Emergency Care (មន្ទីរពេទ្យសត្វអង្គរ និងសង្គ្រោះបន្ទាន់)",
        "slug": "angkor-pet-hospital-emergency-phnom-penh",
        "description": "24/7 round-the-clock veterinary critical care facility specialized in animal trauma resuscitation, oxygen therapy, and emergency toxicity treatment.",
        "phone": "+85523991122",
        "email": "emergency@angkorpethospital.com",
        "website": "https://angkorpethospital.com",
        "address": "No. 112, Norodom Blvd, Tonle Bassac, Chamkarmon, Phnom Penh",
        "latitude": 11.5521,
        "longitude": 104.9312,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": True,
        "rating": 4.8,
        "total_reviews": 510,
        "departments": [
            {
                "name": "Animal ICU & Emergency Triage",
                "code": "PET-ER",
                "floor_room": "Emergency Ground Floor Bay",
                "avg_consultation_minutes": 20,
                "doctors": [
                    {
                        "full_name": "Dr. Sereyroth Mao, DVM",
                        "specialty": "Emergency & Critical Care Veterinarian",
                        "bio": "Over 10 years experience in veterinary trauma, poison ingestion triage, and critical cardiopulmonary care for pets.",
                        "room_number": "ER Bay",
                        "avg_consultation_minutes": 20,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Emergency Animal Poison & Trauma Stabilization", "duration_minutes": 30, "price": 50.0},
                    {"name": "Pet Oxygen Therapy & ICU Monitoring (per hour)", "duration_minutes": 60, "price": 30.0},
                ],
                "queue": {
                    "prefix": "PET-ER",
                    "serving_num": "PET-ER-003",
                    "patients": [
                        ("Kimly Chhay (Dog: Milo)", "015443322"),
                        ("Panha Rin (Cat: Luna)", "093221100"),
                    ],
                },
            },
        ],
    },

    # 13. Lucky Dog & Cat Veterinary Clinic (Animal Clinic)
    {
        "name": "Lucky Dog & Cat Veterinary Clinic (គ្លីនិកព្យាបាលសត្វឆ្កែ និងឆ្មា ឡាក់គី)",
        "slug": "lucky-dog-cat-clinic-phnom-penh",
        "description": "Friendly neighborhood companion animal clinic providing preventative health checks, microchipping, grooming, and routine outpatient care.",
        "phone": "+85523774411",
        "email": "hello@luckypetclinic.kh",
        "website": "https://luckypetclinic.kh",
        "address": "No. 29, Street 2004, Kakab, Pur Senchey, Phnom Penh",
        "latitude": 11.5543,
        "longitude": 104.8621,
        "is_active": True,
        "is_verified": True,
        "verification_status": VerificationStatus.APPROVED,
        "emergency_service_available": False,
        "rating": 4.7,
        "total_reviews": 230,
        "departments": [
            {
                "name": "Preventative Pet Care & Wellness",
                "code": "PET-WELL",
                "floor_room": "Room 1",
                "avg_consultation_minutes": 15,
                "doctors": [
                    {
                        "full_name": "Dr. Piseth Rin, DVM",
                        "specialty": "General Practice Veterinarian",
                        "bio": "Compassionate companion animal doctor offering health screening, tick-fever prophylaxis, and pet travel health certificates.",
                        "room_number": "Room 1",
                        "avg_consultation_minutes": 15,
                        "is_available": True,
                    }
                ],
                "services": [
                    {"name": "Pet Wellness Health Checkup", "duration_minutes": 15, "price": 15.0},
                    {"name": "ISO Pet Microchip Implantation & Registration", "duration_minutes": 15, "price": 20.0},
                ],
                "queue": {
                    "prefix": "LUCKY",
                    "serving_num": "LUCKY-002",
                    "patients": [
                        ("Bora Noun (Dog: Cooper)", "077889900"),
                    ],
                },
            },
        ],
    },
]

from app.core.database import AsyncSessionLocal

async def seed_cambodia_database():
    async with AsyncSessionLocal() as session:
        print("Seeding Cambodia healthcare system data...")

        for h_data in CAMBODIA_HOSPITALS:
            # Check if hospital already exists
            res = await session.execute(
                select(Hospital).where(Hospital.slug == h_data["slug"])
            )
            existing_hosp = res.scalar_one_or_none()

            if not existing_hosp:
                existing_hosp = Hospital(
                    name=h_data["name"],
                    slug=h_data["slug"],
                    description=h_data["description"],
                    phone=h_data.get("phone"),
                    email=h_data.get("email"),
                    website=h_data.get("website"),
                    address=h_data["address"],
                    latitude=h_data.get("latitude"),
                    longitude=h_data.get("longitude"),
                    is_active=h_data["is_active"],
                    is_verified=h_data["is_verified"],
                    verification_status=h_data["verification_status"],
                    emergency_service_available=h_data["emergency_service_available"],
                    rating=h_data["rating"],
                    total_reviews=h_data["total_reviews"],
                )
                session.add(existing_hosp)
                await session.flush()
                print(f"  + Added Hospital: {existing_hosp.name}")
            else:
                existing_hosp.name = h_data["name"]
                existing_hosp.phone = h_data.get("phone")
                existing_hosp.address = h_data["address"]
                existing_hosp.rating = h_data["rating"]
                existing_hosp.emergency_service_available = h_data["emergency_service_available"]
                await session.flush()
                print(f"  ✓ Updated Hospital: {existing_hosp.name}")

            # Process departments
            for d_data in h_data.get("departments", []):
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

                # Process doctors
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

                # Process queue sessions & tickets
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

                        # Seed waiting tickets
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
        print("✅ Successfully seeded authentic Cambodia healthcare data!")

if __name__ == "__main__":
    asyncio.run(seed_cambodia_database())
