import logging
import uuid
import re
from typing import List, Dict, Optional, Any
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool

from app.core.config import settings
from app.models.hospital import Hospital, Department, Service
from app.models.doctor import Doctor
from app.models.queue import QueueSession, Ticket, TicketStatus, QueueStatus, TicketSource
from app.services.wait_time_calculator import WaitTimeCalculator
from app.services.queue_service import QueueService

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the official Healthcare AI Assistant equipped with real-time tools to search doctors, explore hospitals and clinics (human and animal/veterinary), check live queues, and book queue tickets for patients.

You have access to the following real-time database tools:
1. `search_doctors`: Find doctors by medical specialty, department, or doctor name across all hospitals and clinics.
2. `search_hospitals_and_clinics`: Find hospitals, medical specialty clinics, and animal veterinary clinics with active departments, services, address, and contact information.
3. `check_live_queue`: Look up live queue status, currently serving ticket, waiting count, and estimated wait minutes for any department.
4. `book_queue_ticket`: Issue a real queue ticket for a patient or pet.

INSTRUCTIONS:
- When a user asks about doctors, hospitals, clinics, wait times, or wants to book a ticket, ALWAYS invoke the corresponding tool to retrieve live, accurate data.
- When the user asks you to book a ticket, if they did not provide their name or phone number, check if patient information is available or ask them for their name and phone number.
- For general medical, wellness, and pet care questions, provide empathetic, clear, evidence-based guidance.
- Format responses cleanly with concise paragraphs and bullet points where helpful.

SUGGESTED ACTION BUTTONS:
Whenever you propose next steps or ask the user a question at the end of your response (for example: "Would you like me to check the live queue for their Animal Surgery & Urgent Care department or book a ticket for your dog?"), you MUST append a section at the very end of your message formatted exactly as:

SUGGESTED_ACTIONS:
- [Short, specific action button text directly answering or continuing your question]
- [Another short, specific action button text]

RULES:
- Each action MUST be a concrete, clickable request the user can send to continue the action (e.g. "Check Live Queue for Animal Surgery & Urgent Care", "Book a Ticket for Animal Surgery & Urgent Care", "Search Cardiologists").
- NEVER generate generic or useless actions like "Ask Another Question", "Ask a question", "None", or "Other".
- If no natural follow-up action is appropriate, omit the SUGGESTED_ACTIONS section entirely.

AUTOMATIC LANGUAGE DETECTION & MIRRORING:
- You MUST automatically detect the language of the user's latest question and respond in that EXACT same language.
- If the user communicates in Khmer (ភាសាខ្មែរ):
  Display and respond in natural, polite, and fluent Khmer (ភាសាខ្មែរ). Use English ONLY for specific technical or medical terms where standard in healthcare practice (e.g. MRI, ECG, CT scan, Troponin, ICU, ticket numbers like CARDIO-008, room numbers like Room 201, credentials like MD or DVM). All clinical guidance, conversational explanations, and SUGGESTED_ACTIONS must be in Khmer.
- If the user communicates in English:
  Display and respond in 100% pure English ONLY. Do NOT include any Khmer characters, Khmer scripts, or Khmer bracketed text. Present all hospital names, doctor names, departments, and explanations purely in English (e.g. use "Calmette Hospital", "Khmer-Soviet Friendship Hospital"). All SUGGESTED_ACTIONS must be purely in English.
- If the user communicates in another language (e.g. French, Chinese, Spanish, etc.):
  Respond completely and naturally in that detected language, including all guidance and SUGGESTED_ACTIONS.
- Always determine language strictly from the user's current message. Never respond in Khmer if the user wrote in English, and never respond in English if the user wrote in Khmer.
- When calling database tools, use English keywords (e.g. 'animal', 'cardio', 'pediatrics', 'dental', 'orthopedics', 'general') so the database queries match accurately, then format the final output strictly according to the detected language!
"""

KHMER_TERM_MAP = {
    "បេះដូង": "cardio",
    "សត្វ": "animal",
    "ឆ្កែ": "animal",
    "ឆ្មា": "animal",
    "ពេទ្យសត្វ": "animal",
    "ស្បែក": "derm",
    "កុមារ": "pediatric",
    "កូន": "pediatric",
    "ឆ្អឹង": "ortho",
    "សន្លាក់": "ortho",
    "ធ្មេញ": "dental",
    "ទូទៅ": "general",
    "ភ្នែក": "eye",
    "ត្រចៀក": "ent",
    "ច្រមុះ": "ent",
    "បំពង់ក": "ent",
    "ក្បាល": "neurology",
    "សរសៃប្រសាទ": "neurology",
    "ក្រពះ": "gastro",
    "ពោះវៀន": "gastro",
    "សួត": "pulmonology",
    "ផ្លូវដង្ហើម": "pulmonology",
    "មហារីក": "oncology",
    "ឈាម": "hematology",
    "សម្ភព": "obgyn",
    "រោគស្ត្រី": "obgyn",
    "តម្រងនោម": "nephrology",
    "សង្គ្រោះបន្ទាន់": "emergency",
    "បន្ទាន់": "emergency",
    "គ្រូពេទ្យ": "doctor",
    "ពេទ្យ": "doctor",
    "មន្ទីរពេទ្យ": "hospital",
    "គ្លីនិក": "clinic",
}

def detect_query_language(text: str, fallback_lang: str = "en") -> str:
    """
    Auto-detect user language based strictly on the question/message text.
    Prioritizes the actual script and words of the user's question over UI settings.
    """
    if not text or not text.strip():
        return fallback_lang or "en"

    # 1. Detect Khmer Unicode range (1780-17FF, 19E0-19FF)
    khmer_matches = len(re.findall(r"[\u1780-\u17FF\u19E0-\u19FF]", text))
    latin_matches = len(re.findall(r"[a-zA-Z]", text))
    chinese_matches = len(re.findall(r"[\u4e00-\u9fff]", text))
    japanese_matches = len(re.findall(r"[\u3040-\u30ff]", text))
    cyrillic_matches = len(re.findall(r"[\u0400-\u04FF]", text))

    if khmer_matches > 0:
        return "km"

    if chinese_matches >= 2:
        return "zh"

    if japanese_matches >= 2:
        return "ja"

    if cyrillic_matches >= 2:
        return "ru"

    # French common healthcare / conversational words
    if re.search(r"\b(bonjour|salut|merci|docteur|medecin|médecin|hopital|hôpital|douleur|symptome|symptômes|aidez|urgence|santé|suis|malade|rendez-vous|clinique)\b", text, re.IGNORECASE):
        return "fr"

    # Spanish common healthcare / conversational words
    if re.search(r"\b(hola|gracias|doctor|hospital|dolor|sintomas|síntomas|ayuda|urgencia|salud|estoy|enfermo|cita|clinica|clínica)\b", text, re.IGNORECASE):
        return "es"

    # If message contains Latin letters and no French/Spanish markers
    if latin_matches > 0:
        return "en"

    return fallback_lang or "en"

def normalize_khmer_query(text: str) -> str:
    t = text.strip().lower()
    for kh, en in KHMER_TERM_MAP.items():
        if kh in t:
            return en
    return t

class HealthcareAgentService:
    @classmethod
    async def run_agent(
        cls,
        message: str,
        history: List[Any],
        db: AsyncSession,
        user_context: Optional[Dict[str, str]] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """Runs the LangChain agent with tool calling to retrieve system data or perform booking"""

        booked_ticket_data: Optional[Dict[str, Any]] = None
        matching_hospitals_data: List[Dict[str, Any]] = []

        # 1. Define async tool implementations closing over db and session state
        @tool
        async def search_doctors(query: str = "") -> str:
            """Search doctors by doctor name, specialty (e.g. Cardiology, Pediatrics, Dermatology), or department."""
            stmt = (
                select(Doctor)
                .where(Doctor.is_active == True)
                .options(selectinload(Doctor.department).selectinload(Department.hospital))
            )
            res = await db.execute(stmt)
            doctors = res.scalars().all()

            q = normalize_khmer_query(query)
            if q:
                tokens = [w for w in q.split() if w not in ["at", "in", "for", "the", "a", "an", "hospital", "clinic", "center", "dr", "doctor", "md"]]
                if not tokens:
                    tokens = [q]
                doctors = [
                    d for d in doctors
                    if any(
                        t in d.full_name.lower()
                        or t in d.specialty.lower()
                        or (d.department and t in d.department.name.lower())
                        or (d.department and d.department.hospital and t in d.department.hospital.name.lower())
                        for t in tokens
                    )
                ]

            if not doctors:
                return f"No doctors found matching '{query}' in our system."

            results = []
            for d in doctors:
                hosp = d.department.hospital.name if (d.department and d.department.hospital) else "General Hospital"
                dept = d.department.name if d.department else "General Medicine"
                status_str = "Available today" if d.is_available else "Not on duty"
                results.append(
                    f"- **Dr. {d.full_name}** | Specialty: {d.specialty} | Facility: {hosp} | Dept: {dept} | Room: {d.room_number or 'Room 201'} | Status: {status_str} | Avg Consultation: ~{d.avg_consultation_minutes} mins"
                )
            return "\n".join(results)

        @tool
        async def search_hospitals_and_clinics(query: str = "") -> str:
            """Search hospitals, medical specialty clinics, and animal veterinary clinics across the system, including their active departments and medical services."""
            stmt = (
                select(Hospital)
                .where(Hospital.is_active == True)
                .options(
                    selectinload(Hospital.departments).selectinload(Department.queue_sessions),
                    selectinload(Hospital.services),
                )
            )
            res = await db.execute(stmt)
            hospitals = res.scalars().all()

            q = normalize_khmer_query(query)
            if q:
                tokens = [w for w in q.split() if w not in ["at", "in", "for", "the", "a", "an", "hospital", "clinic", "center"]]
                if not tokens:
                    tokens = [q]
                hospitals = [
                    h for h in hospitals
                    if any(
                        t in h.name.lower()
                        or t in (h.description or "").lower()
                        or any(t in d.name.lower() for d in h.departments)
                        or any(t in s.name.lower() for s in h.services)
                        for t in tokens
                    )
                ]

            if not hospitals:
                return f"No hospital or clinic facilities found matching '{query}'."

            results = []
            for h in hospitals:
                depts = [f"{d.name} ({d.code or 'DEPT'})" for d in h.departments if d.is_active]
                services = [s.name for s in h.services if s.is_active]
                results.append(
                    f"### {h.name}\n"
                    f"- **Address:** {h.address or 'Phnom Penh'}\n"
                    f"- **Phone:** {h.phone or '+85523888999'}\n"
                    f"- **Active Departments:** {', '.join(depts) if depts else 'General Outpatient'}\n"
                    f"- **Services:** {', '.join(services[:5]) if services else 'Standard Consultation'}"
                )
            return "\n\n".join(results)

        @tool
        async def check_live_queue(query: str = "") -> str:
            """Look up real-time live queue status, currently serving ticket number, and estimated waiting minutes for any department or hospital."""
            stmt = (
                select(Department)
                .where(Department.is_active == True)
                .options(
                    selectinload(Department.hospital),
                    selectinload(Department.queue_sessions),
                )
            )
            res = await db.execute(stmt)
            departments = res.scalars().all()

            q = normalize_khmer_query(query)
            tokens = [w for w in q.split() if w not in ["at", "in", "for", "the", "a", "an", "hospital", "clinic", "center", "queue", "wait", "time", "status"]]
            if not tokens:
                tokens = [q]
            matches = [
                d for d in departments
                if any(
                    t in d.name.lower()
                    or (d.code and t in d.code.lower())
                    or (d.hospital and t in d.hospital.name.lower())
                    for t in tokens
                )
            ]

            if not matches:
                return f"Could not find live queues matching '{query}'."

            lines = []
            for d in matches:
                session = next((s for s in d.queue_sessions if s.status == QueueStatus.ACTIVE), None)
                waiting_count = 0
                serving_no = "—"
                if session:
                    serving_no = session.current_serving_number or "—"
                    c_res = await db.execute(
                        select(func.count(Ticket.id)).where(
                            and_(
                                Ticket.queue_session_id == session.id,
                                Ticket.status.in_([TicketStatus.WAITING, TicketStatus.CALLED]),
                            )
                        )
                    )
                    waiting_count = c_res.scalar() or 0

                est_wait = WaitTimeCalculator.calculate_wait_time(
                    position_ahead=waiting_count,
                    avg_consultation_minutes=d.avg_consultation_minutes,
                    is_serving_in_progress=True,
                )

                lines.append(
                    f"- **{d.name}** at {d.hospital.name if d.hospital else 'Clinic'}: "
                    f"Serving Now: `{serving_no}` | Waiting: **{waiting_count} in line** | Est. Wait: **~{est_wait} mins** | Room: {d.floor_room or 'Room 201'}"
                )

                # Record structured match
                if d.hospital:
                    matching_hospitals_data.append({
                        "hospital_id": d.hospital.id,
                        "hospital_name": d.hospital.name,
                        "department_id": d.id,
                        "department_name": d.name,
                        "department_code": d.code,
                        "waiting_patients": waiting_count,
                        "estimated_wait_minutes": est_wait,
                        "address": d.hospital.address,
                    })

            return "\n".join(lines)

        @tool
        async def book_queue_ticket(hospital_name: str, department_name: str, patient_name: str, patient_phone: str) -> str:
            """Book and issue a real digital queue ticket for a patient or pet in the specified hospital and department."""
            nonlocal booked_ticket_data

            # Find matching department
            dept_stmt = (
                select(Department)
                .where(Department.is_active == True)
                .options(selectinload(Department.hospital))
            )
            d_res = await db.execute(dept_stmt)
            all_depts = d_res.scalars().all()

            h_q = hospital_name.strip().lower()
            d_q = department_name.strip().lower()

            target_dept: Optional[Department] = None
            for d in all_depts:
                h_name = d.hospital.name.lower() if d.hospital else ""
                dept_name = d.name.lower()
                dept_code = (d.code or "").lower()

                if (d_q in dept_name or d_q in dept_code) and (not h_q or h_q in h_name):
                    target_dept = d
                    break

            if not target_dept and all_depts:
                # Fuzzy fallback matching on department name alone
                for d in all_depts:
                    if d_q in d.name.lower():
                        target_dept = d
                        break

            if not target_dept:
                return f"Unable to find an active department matching '{department_name}' at '{hospital_name}'. Please verify the facility and department name."

            # Get or create today's active queue session
            queue_sess = await QueueService.get_or_create_queue_session(
                db,
                hospital_id=target_dept.hospital_id,
                department_id=target_dept.id,
            )

            # Issue ticket
            new_ticket = await QueueService.issue_ticket(
                db,
                queue_session_id=queue_sess.id,
                patient_name=patient_name.strip(),
                patient_phone=patient_phone.strip(),
                ticket_source=TicketSource.ONLINE,
            )

            booked_ticket_data = {
                "id": str(new_ticket.id),
                "ticket_number": new_ticket.ticket_number,
                "hospital_name": target_dept.hospital.name if target_dept.hospital else "Hospital",
                "department_name": target_dept.name,
                "department_code": target_dept.code,
                "patient_name": new_ticket.patient_name,
                "position": new_ticket.position,
                "estimated_wait_minutes": new_ticket.estimated_wait_minutes,
                "room_number": target_dept.floor_room or "Room 201",
                "appointment_date": str(new_ticket.appointment_date) if new_ticket.appointment_date else None,
                "appointment_time": new_ticket.appointment_time,
                "created_at": str(new_ticket.created_at),
            }

            return (
                f"SUCCESS: Digital ticket booked successfully!\n"
                f"- Ticket Number: **{new_ticket.ticket_number}**\n"
                f"- Facility: {target_dept.hospital.name if target_dept.hospital else 'Clinic'}\n"
                f"- Department: {target_dept.name} ({target_dept.code or 'DEPT'})\n"
                f"- Patient: {patient_name} (Phone: {patient_phone})\n"
                f"- Position in Line: {new_ticket.position}\n"
                f"- Estimated Wait Time: ~{new_ticket.estimated_wait_minutes} mins\n"
                f"- Destination: {target_dept.floor_room or 'Building A, Floor 2, Room 201'}\n"
                f"The patient can view live updates in the Live Queue page."
            )

        tools = [search_doctors, search_hospitals_and_clinics, check_live_queue, book_queue_ticket]
        tool_map = {t.name: t for t in tools}

        # 2. Setup LangChain ChatOpenAI model
        llm = ChatOpenAI(
            model=settings.MICROSOFT_FOUNDRY_MODEL,
            openai_api_key=settings.MICROSOFT_FOUNDRY_API_KEY,
            openai_api_base=settings.MICROSOFT_FOUNDRY_BASE_URL,
            temperature=0.3,
            max_tokens=1000,
        )
        llm_with_tools = llm.bind_tools(tools)

        # 3. Build message list
        system_text = SYSTEM_PROMPT
        detected_lang = detect_query_language(message, fallback_lang=language or "en")

        if detected_lang == "km":
            system_text += (
                "\n[ACTIVE DETECTED LANGUAGE: KHMER (ភាសាខ្មែរ)]\n"
                "The user's question is in Khmer. You MUST automatically respond in natural, polite Khmer (ភាសាខ្មែរ). "
                "Use English ONLY for standard technical/medical terms (such as MRI, ECG, CT scan, Troponin, ICU, ticket numbers, room numbers). "
                "Never output English conversational sentences. All SUGGESTED_ACTIONS must be in Khmer."
            )
        elif detected_lang == "fr":
            system_text += (
                "\n[ACTIVE DETECTED LANGUAGE: FRENCH]\n"
                "The user's question is in French. You MUST automatically respond completely and fluently in French. "
                "All explanations, clinical guidance, and SUGGESTED_ACTIONS must be in French."
            )
        elif detected_lang == "zh":
            system_text += (
                "\n[ACTIVE DETECTED LANGUAGE: CHINESE]\n"
                "The user's question is in Chinese. You MUST automatically respond completely and naturally in Chinese. "
                "All explanations, clinical guidance, and SUGGESTED_ACTIONS must be in Chinese."
            )
        elif detected_lang == "es":
            system_text += (
                "\n[ACTIVE DETECTED LANGUAGE: SPANISH]\n"
                "The user's question is in Spanish. You MUST automatically respond completely and naturally in Spanish. "
                "All explanations, clinical guidance, and SUGGESTED_ACTIONS must be in Spanish."
            )
        else:
            system_text += (
                "\n[ACTIVE DETECTED LANGUAGE: ENGLISH]\n"
                "The user's question is in English. You MUST automatically respond in 100% pure English ONLY. "
                "Do NOT include any Khmer characters, Khmer scripts, or Khmer bracketed text (e.g. write 'Calmette Hospital', never 'Calmette Hospital (មន្ទីរពេទ្យកាល់ម៉ែត)'). "
                "All explanations, clinical guidance, and SUGGESTED_ACTIONS must be purely in English."
            )

        if user_context and user_context.get("full_name"):
            system_text += f"\nCurrently logged-in patient: {user_context.get('full_name')} (Phone: {user_context.get('phone_number', 'None provided')}). You may use this information for booking if the patient does not specify different details."

        messages: List[Any] = [SystemMessage(content=system_text)]

        # Append history
        if history:
            for h in history[-8:]:
                role = getattr(h, "role", "user")
                content = getattr(h, "content", "")
                if role == "user":
                    messages.append(HumanMessage(content=content))
                else:
                    messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=message))

        # 4. Agent tool execution loop (up to 4 iterations)
        for _ in range(4):
            ai_res: AIMessage = await llm_with_tools.ainvoke(messages)
            messages.append(ai_res)

            if not ai_res.tool_calls:
                break

            for tc in ai_res.tool_calls:
                t_name = tc["name"]
                t_args = tc.get("args", {})
                t_id = tc.get("id", str(uuid.uuid4()))

                tool_fn = tool_map.get(t_name)
                if tool_fn:
                    try:
                        t_output = await tool_fn.ainvoke(t_args)
                    except Exception as err:
                        logger.error(f"Error executing tool {t_name}: {err}")
                        t_output = f"Error executing tool {t_name}: {str(err)}"
                else:
                    t_output = f"Tool {t_name} is not available."

                messages.append(ToolMessage(content=str(t_output), tool_call_id=t_id))

        final_reply = messages[-1].content if messages else "I am ready to help you with your health and clinic inquiries."
        if isinstance(final_reply, list):
            final_reply = "\n".join([str(c) for c in final_reply if isinstance(c, str)])

        # Parse SUGGESTED_ACTIONS: from LLM response
        extracted_actions: List[str] = []
        action_match = re.search(r"SUGGESTED_ACTIONS:\s*((\n\s*[-*•\d.]+\s*[^\n]+)+)", final_reply, re.IGNORECASE)
        if action_match:
            raw_block = action_match.group(1)
            final_reply = final_reply[:action_match.start()].strip()
            lines = [line.strip() for line in raw_block.split("\n") if line.strip()]
            for line in lines:
                cleaned = re.sub(r"^[-*•\d.]+\s*", "", line).strip()
                cleaned = cleaned.strip("[]'\"").strip()
                if cleaned and not any(bad in cleaned.lower() for bad in ["ask another question", "ask a question", "none", "n/a", "other"]):
                    extracted_actions.append(cleaned)

        # Fallback contextual actions only if LLM did not provide specific ones
        suggested_actions: List[str] = extracted_actions
        if not suggested_actions:
            if detected_lang == "km":
                if booked_ticket_data:
                    suggested_actions = ["មើលជួររង់ចាំផ្ទាល់", "កក់សំបុត្រមួយទៀត"]
                elif any(tc.get("name") == "search_doctors" for msg in messages if hasattr(msg, "tool_calls") and msg.tool_calls for tc in msg.tool_calls):
                    suggested_actions = ["ពិនិត្យមើលជួររង់ចាំផ្ទាល់", "កក់សំបុត្រ"]
                elif any(tc.get("name") == "search_hospitals_and_clinics" for msg in messages if hasattr(msg, "tool_calls") and msg.tool_calls for tc in msg.tool_calls):
                    suggested_actions = ["ពិនិត្យមើលជួររង់ចាំផ្ទាល់", "កក់សំបុត្រឌីជីថល"]
                elif any(tc.get("name") == "check_live_queue" for msg in messages if hasattr(msg, "tool_calls") and msg.tool_calls for tc in msg.tool_calls):
                    suggested_actions = ["កក់សំបុត្រសម្រាប់ជួរនេះ"]
            else:
                if booked_ticket_data:
                    suggested_actions = ["View in Live Queue", "Book Another Ticket"]
                elif any(tc.get("name") == "search_doctors" for msg in messages if hasattr(msg, "tool_calls") and msg.tool_calls for tc in msg.tool_calls):
                    suggested_actions = ["Check Live Waiting Times", "Book a Ticket"]
                elif any(tc.get("name") == "search_hospitals_and_clinics" for msg in messages if hasattr(msg, "tool_calls") and msg.tool_calls for tc in msg.tool_calls):
                    suggested_actions = ["Check Live Waiting Times", "Book a Digital Ticket"]
                elif any(tc.get("name") == "check_live_queue" for msg in messages if hasattr(msg, "tool_calls") and msg.tool_calls for tc in msg.tool_calls):
                    suggested_actions = ["Book a Ticket for this Queue"]

        # Ensure "View in Live Queue" is included if ticket was booked
        if booked_ticket_data:
            view_label = "មើលជួររង់ចាំផ្ទាល់" if detected_lang == "km" else "View in Live Queue"
            if view_label not in suggested_actions:
                suggested_actions.insert(0, view_label)

        # Exclude any generic placeholder buttons
        suggested_actions = [
            a for a in suggested_actions
            if not any(bad in a.lower() for bad in ["ask another question", "ask a question", "none", "n/a"])
        ]

        return {
            "reply": final_reply,
            "booked_ticket": booked_ticket_data,
            "matching_hospitals": matching_hospitals_data,
            "suggested_actions": suggested_actions,
            "detected_language": detected_lang,
        }
