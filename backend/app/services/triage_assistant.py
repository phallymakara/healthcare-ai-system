import re
from datetime import date
from typing import List, Tuple
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Hospital, Department, QueueSession, Ticket, TicketStatus, QueueStatus
from app.schemas.assistant import (
    UrgencyLevel,
    TriageRequest,
    TriageResponse,
    TriageHospitalMatch,
    AssistantChatResponse,
)
from app.services.wait_time_calculator import WaitTimeCalculator


class TriageAssistantService:
    """Clinical triage intelligence and department routing service"""

    SPECIALTY_RULES = [
        (
            r"\b(chest pain|heart|palpitation|shortness of breath|tightness in chest|angina)\b",
            "Cardiology",
            UrgencyLevel.URGENT,
            "Cardiovascular symptoms require prompt medical assessment to rule out cardiac conditions.",
            "Please refrain from strenuous physical exertion. If symptoms worsen rapidly, call emergency medical services immediately.",
        ),
        (
            r"\b(rash|itch|eczema|psoriasis|skin|hives|acne|blister|dermatitis)\b",
            "Dermatology",
            UrgencyLevel.STANDARD,
            "Dermatological presentation suggests an outpatient skin evaluation.",
            "Keep the affected area clean and dry. Avoid scratching or applying unprescribed topical steroids.",
        ),
        (
            r"\b(bone|fracture|joint|sprain|knee|ankle|back pain|spine|arthritis|orthopedic)\b",
            "Orthopedics",
            UrgencyLevel.STANDARD,
            "Musculoskeletal symptoms indicate an orthopedic consultation.",
            "Rest the affected limb and apply cold compress if acute swelling occurred within 24 hours.",
        ),
        (
            r"\b(child|infant|baby|toddler|pediatric|vaccination)\b",
            "Pediatrics",
            UrgencyLevel.STANDARD,
            "Pediatric care recommended for children and young adolescents.",
            "Ensure regular hydration and monitor body temperature frequently.",
        ),
        (
            r"\b(headache|migraine|seizure|numbness|dizziness|vertigo|stroke)\b",
            "Neurology",
            UrgencyLevel.URGENT,
            "Neurological assessment recommended for persistent cranial or nerve symptoms.",
            "Rest in a quiet, darkened room. Seek emergency help if sudden weakness on one side occurs.",
        ),
    ]

    @classmethod
    async def analyze_symptoms(
        cls,
        data: TriageRequest,
        db: AsyncSession,
    ) -> TriageResponse:
        text = data.symptoms.lower()

        matched_specialty = "General Medicine"
        urgency = UrgencyLevel.STANDARD
        summary = "General outpatient evaluation recommended based on described symptoms."
        advice = "Stay well hydrated, rest adequately, and monitor your symptoms."

        # 1. Rule matching
        for pattern, specialty, rule_urgency, rule_summary, rule_advice in cls.SPECIALTY_RULES:
            if re.search(pattern, text, re.IGNORECASE):
                matched_specialty = specialty
                urgency = rule_urgency
                summary = rule_summary
                advice = rule_advice
                break

        # Check for emergency triggers
        if re.search(r"\b(crushing chest pain|difficulty breathing|unconscious|severe bleeding|stroke)\b", text, re.IGNORECASE):
            urgency = UrgencyLevel.EMERGENCY
            advice = "CRITICAL: These symptoms may indicate a medical emergency. Go to the nearest emergency room immediately."

        # 2. Query matching hospitals and departments with live queues
        hosp_query = (
            select(Hospital)
            .where(Hospital.is_active == True)
            .options(
                selectinload(Hospital.departments).selectinload(Department.queue_sessions),
            )
        )
        res = await db.execute(hosp_query)
        hospitals = res.scalars().all()

        matching_hospitals: List[TriageHospitalMatch] = []
        today = date.today()

        for h in hospitals:
            # Find department matching specialty (or General)
            dept = next(
                (d for d in h.departments if d.is_active and matched_specialty.lower() in d.name.lower()),
                None
            )
            if not dept and h.departments:
                dept = h.departments[0]

            if not dept:
                continue

            # Check live queue session
            active_session = next(
                (s for s in dept.queue_sessions if s.session_date == today and s.status == QueueStatus.ACTIVE),
                None
            )
            waiting_count = 0
            if active_session:
                t_res = await db.execute(
                    select(func.count(Ticket.id)).where(
                        and_(
                            Ticket.queue_session_id == active_session.id,
                            Ticket.status.in_([TicketStatus.WAITING, TicketStatus.CALLED]),
                        )
                    )
                )
                waiting_count = t_res.scalar() or 0

            est_wait = WaitTimeCalculator.calculate_wait_time(
                position_ahead=waiting_count,
                avg_consultation_minutes=dept.avg_consultation_minutes,
                is_serving_in_progress=True,
            )

            matching_hospitals.append(
                TriageHospitalMatch(
                    hospital_id=h.id,
                    hospital_name=h.name,
                    department_id=dept.id,
                    department_name=dept.name,
                    department_code=dept.code,
                    waiting_patients=waiting_count,
                    estimated_wait_minutes=est_wait,
                    address=h.address,
                )
            )

        # Sort by shortest wait time
        matching_hospitals.sort(key=lambda m: m.estimated_wait_minutes)

        return TriageResponse(
            urgency_level=urgency,
            recommended_specialty=matched_specialty,
            clinical_summary=summary,
            advice=advice,
            matching_hospitals=matching_hospitals,
        )

    @classmethod
    def get_chat_reply(cls, message: str) -> AssistantChatResponse:
        m = message.lower()
        if any(w in m for w in ["wait", "time", "queue", "how long"]):
            return AssistantChatResponse(
                reply="You can check real-time queue lengths and estimated wait times directly in our Discover Hospitals directory. We update queue lengths every 15 seconds.",
                suggested_actions=["Check Live Queues", "Book Queue Ticket"],
            )
        if any(w in m for w in ["book", "appointment", "reserve", "ticket"]):
            return AssistantChatResponse(
                reply="To reserve a queue ticket, browse our hospital departments and click 'Reserve Ticket'. You'll receive a live ticket tracker and automated alerts when your turn approaches.",
                suggested_actions=["Find Hospital", "View My Tickets"],
            )
        if any(w in m for w in ["emergency", "urgent", "ambulance"]):
            return AssistantChatResponse(
                reply="For severe life-threatening conditions (e.g. intense chest pain, severe breathing difficulty), please dial 119 or proceed to the nearest emergency department immediately.",
                suggested_actions=["Emergency Services", "Find Nearest Hospital"],
            )
        return AssistantChatResponse(
            reply="Hello! I can help you evaluate your symptoms, identify the appropriate clinical outpatient department, and find the clinic with the shortest waiting line today. What symptoms are you experiencing?",
            suggested_actions=["Describe Symptoms", "Browse Hospitals"],
        )
