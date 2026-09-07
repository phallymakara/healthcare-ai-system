import re
from datetime import date
from typing import List, Tuple, Any
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
    async def chat_with_assistant(
        cls,
        message: str,
        history: List[Any],
        db: AsyncSession,
    ) -> AssistantChatResponse:
        from app.services.llm_service import LLMService

        # Prepare messages for LLM
        formatted_messages = []
        if history:
            for h in history[-8:]:  # keep last 8 turns for context
                formatted_messages.append({"role": getattr(h, "role", "user"), "content": getattr(h, "content", "")})
        formatted_messages.append({"role": "user", "content": message})

        # Generate intelligent LLM response
        llm_reply = await LLMService.chat_completion(formatted_messages)

        # Check if user message or LLM recommends clinic or discusses symptoms
        m_lower = message.lower()
        matched_specialty = None
        urgency = None

        # Check for pet / animal
        is_animal = any(w in m_lower for w in ["dog", "cat", "pet", "puppy", "kitten", "animal", "vet", "veterinary"])
        if is_animal:
            matched_specialty = "Animal Care"
            urgency = UrgencyLevel.STANDARD

        # Check specialty rules
        for pattern, specialty, rule_urgency, _, _ in cls.SPECIALTY_RULES:
            if re.search(pattern, m_lower, re.IGNORECASE):
                matched_specialty = specialty
                urgency = rule_urgency
                break

        # Check if user explicitly asked for clinic/hospital/queue/appointment/booking
        has_clinic_intent = any(w in m_lower for w in ["clinic", "hospital", "doctor", "appointment", "ticket", "queue", "department", "book"])

        matching_hospitals: List[TriageHospitalMatch] = []
        if matched_specialty or has_clinic_intent:
            # Query active hospitals & live queues
            hosp_query = (
                select(Hospital)
                .where(Hospital.is_active == True)
                .options(
                    selectinload(Hospital.departments).selectinload(Department.queue_sessions),
                )
            )
            res = await db.execute(hosp_query)
            hospitals = res.scalars().all()

            for h in hospitals:
                for dept in h.departments:
                    if not dept.is_active:
                        continue
                    
                    # Match department appropriately
                    if is_animal:
                        if "animal" not in h.name.lower() and "vet" not in h.name.lower() and "pet" not in dept.name.lower():
                            continue
                    elif matched_specialty:
                        dept_name_lower = dept.name.lower()
                        spec_lower = matched_specialty.lower()
                        if spec_lower not in dept_name_lower and dept_name_lower not in spec_lower:
                            # If not exact match, include general/internal medicine if available
                            if "general" not in dept_name_lower and "internal" not in dept_name_lower:
                                continue

                    active_session = next((s for s in dept.queue_sessions if s.status == QueueStatus.ACTIVE), None)
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

            matching_hospitals.sort(key=lambda m: m.estimated_wait_minutes)
            matching_hospitals = matching_hospitals[:3]  # top 3 matches

        return AssistantChatResponse(
            reply=llm_reply,
            urgency_level=urgency,
            recommended_specialty=matched_specialty,
            matching_hospitals=matching_hospitals,
            suggested_actions=["Book Digital Ticket", "Explore Hospitals"] if matching_hospitals else ["Ask Another Question"],
        )
