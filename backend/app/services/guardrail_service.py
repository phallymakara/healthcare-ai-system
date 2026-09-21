import re
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

STATIC_REFUSAL_MESSAGES = {
    "en": "I can only assist with healthcare, medical terms, and clinical services.",
    "km": "ខ្ញុំអាចជួយផ្ដល់ព័ត៌មានបានតែលើប្រធានបទសុខភាព ពាក្យវេជ្ជសាស្ត្រ និងសេវាកម្មវេជ្ជសាស្ត្រតែប៉ុណ្ណោះ។",
    "fr": "Je ne peux vous aider que pour les questions de santé, les termes médicaux et les services cliniques.",
    "es": "Solo puedo ayudar con temas de salud, términos médicos y servicios clínicos.",
    "zh": "我只能协助解答健康、医学术语和临床医疗服务相关的问题。",
}

# 1. Prompt Injection & Jailbreak Vectors
PROMPT_INJECTION_PATTERNS = [
    r"(?i)\b(?:ignore|disregard|forget|override|bypass|reset)\s+(?:all\s+|any\s+|prior\s+|previous\s+|system\s+)*(?:instructions|prompts|rules|directives|constraints|filters|safeguards|commands)\b",
    r"(?i)\b(?:what\s+is|repeat|output|print|show|reveal|display|tell\s+me)\s+(?:your\s+|the\s+)*(?:system\s+prompt|initial\s+prompt|developer\s+prompt|hidden\s+prompt|hidden\s+instructions|system\s+instructions|raw\s+prompt)\b",
    r"(?i)\b(?:repeat|output|print|echo)\s+(?:everything|text|content)\s+(?:above|before\s+this|from\s+the\s+beginning)\b",
    r"(?i)\b(?:act\s+as|pretend\s+to\s+be|you\s+are\s+now|roleplay\s+as|switch\s+to)\s+(?:a\s+|an\s+)*(?:dan|jailbreak|unrestricted|developer\s+mode|unfiltered|chaos|anti-gpt)\b",
    r"(?i)\b(?:dan\s+mode|jailbreak\s+mode|developer\s+mode)\b",
    r"(?i)\b(?:leak|reveal|give\s+me|show|print)\s+(?:your\s+|the\s+)*(?:api\s*key|secret|password|credential|token|env\s*file)\b",
    r"(?i)\b(?:now\s+you\s+must\s+obey|new\s+rule\s*:|from\s+now\s+on\s+you\s+will)\b",
]

# 2. Technical Skill Implementation (Programming, Scripting, DevOps, Architecture)
TECHNICAL_IMPLEMENTATION_PATTERNS = [
    r"(?i)\b(?:write|generate|create|implement|debug|refactor|fix|compile|execute|run)\s+(?:a\s+|some\s+|the\s+)*(?:[a-z0-9#+\-_]+\s+)*(?:code|script|program|function|class|method|module|algorithm|regex|sql\s+query|api\s+endpoint|component|unit\s+test|snippet|macro)\b",
    r"(?i)\b(?:how\s+to\s+(?:code|program|build|develop|implement|debug|compile|deploy|install|configure))\s+(?:a|an|in|with|using)?\s*(?:python|javascript|typescript|react|fastapi|docker|kubernetes|sql|git|linux|node|vue|angular|django|flask|spring|c\+\+|c#|java|golang|rust|php|ruby|bash|powershell|html|css)\b",
    r"(?i)\b(?:in|using)\s+(?:python|javascript|typescript|c\+\+|java|golang|rust|php|ruby|bash|powershell|sql|html|css)\s*:\s*(?:write|create|how\s+to)\b",
    r"(?i)\b(?:write|give\s+me)\s+(?:a\s+)?(?:python|javascript|typescript|bash|sql|c\+\+|java)\s+(?:script|code|example|function)\b",
    r"(?i)\b(?:javascript|python|typescript|c\+\+|java|golang|rust|bash|sql|react|fastapi|docker)\s+code\b",
    r"(?i)\b(?:syntax\s+error|stack\s*trace|segmentation\s+fault|git\s+(?:commit|push|pull|rebase|merge))\b",
    r"(?i)\b(?:sql\s+injection|buffer\s+overflow|reverse\s+shell|payload|xss\s+attack|csrf)\b",
    r"(?i)\b(?:rest\s+api|graphql|webhook|jwt\s+token|oauth2|database\s+schema|orm\s+model)\b",
]

# 3. Technical Processes & Machine/Hardware Mechanics (including medical machines)
PROCESS_AND_MECHANICS_PATTERNS = [
    r"(?i)\bhow\s+does\s+(?:the\s+|this\s+|an?\s+)*(?:[a-z0-9#+\-_/]+\s+)*(?:system|backend|server|database|ai|llm|neural\s+network|langchain|agent|algorithm|api|process)\s+(?:work|operate|function|run)\b",
    r"(?i)\bhow\s+(?:is|was)\s+(?:this\s+ai|this\s+assistant|this\s+system|the\s+backend)\s+(?:built|trained|architected|implemented|programmed)\b",
    r"(?i)\b(?:mechanical|hardware|electronic|internal|physical|technical)\s+(?:workings|engineering|mechanics|mechanism|architecture|circuitry|schematic)\b",
    r"(?i)\bhow\s+does\s+(?:an?\s+|the\s+)*(?:mri(?:\s+machine)?|ct\s+scan(?:ner)?|x-ray(?:\s+machine)?|ultrasound(?:\s+machine)?|dialysis(?:\s+machine)?|ventilator|pacemaker|ecg(?:\s+machine)?|eeg(?:\s+machine)?|defibrillator|pet\s+scanner|autoclave|centrifuge)\s+(?:work|operate|function)\b",
    r"(?i)\b(?:explain|describe)\s+(?:the\s+)*(?:[a-z0-9#+\-_/]+\s+)*(?:process|operation|mechanism|functioning|workings|engineering|mechanics|circuitry|schematic)\s+of\s+(?:an?\s+|the\s+)*(?:[a-z0-9#+\-_/]+\s+)*(?:machine|scanner|device|mri|ct|x-ray|dialysis|server|system)\b",
    r"(?i)\b(?:របៀប|វិធី)\s*(?:សរសេរកូដ|បង្កើតកម្មវិធី|hack|ចាក់សោ|programming|python|javascript|កូដ)\b",
    r"(?i)\b(?:តើម៉ាស៊ីន|ដំណើរការបច្ចេកទេស)\s*(?:MRI|CT|X-ray|ដំណើរការយ៉ាងដូចម្តេចតាមលក្ខណៈបច្ចេកទេស)\b",
]


class GuardrailService:
    @classmethod
    def evaluate_query(
        cls,
        query: str,
        language: Optional[str] = None,
    ) -> Optional[Tuple[str, str]]:
        """
        Evaluate if a user query violates the domain boundaries or contains prompt injections.

        Returns:
            None: If the query is safe and within the healthcare domain.
            Tuple[str, str]: (static_refusal_message, violation_category) if blocked.
        """
        if not query or not query.strip():
            return None

        q = query.strip()

        # 1. Check Prompt Injection / Jailbreaks
        for pattern in PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, q):
                logger.warning(
                    f"SECURITY GUARDRAIL TRIGGERED [PROMPT_INJECTION]: pattern='{pattern}' | query_snippet='{q[:80]}'"
                )
                return cls._build_refusal(language, "PROMPT_INJECTION")

        # 2. Check Technical Skill Implementation
        for pattern in TECHNICAL_IMPLEMENTATION_PATTERNS:
            if re.search(pattern, q):
                logger.warning(
                    f"SECURITY GUARDRAIL TRIGGERED [TECHNICAL_IMPLEMENTATION]: pattern='{pattern}' | query_snippet='{q[:80]}'"
                )
                return cls._build_refusal(language, "TECHNICAL_IMPLEMENTATION")

        # 3. Check System or Machine Mechanics
        for pattern in PROCESS_AND_MECHANICS_PATTERNS:
            if re.search(pattern, q):
                logger.warning(
                    f"SECURITY GUARDRAIL TRIGGERED [PROCESS_OR_MACHINE_MECHANICS]: pattern='{pattern}' | query_snippet='{q[:80]}'"
                )
                return cls._build_refusal(language, "PROCESS_OR_MACHINE_MECHANICS")

        return None

    @classmethod
    def get_static_refusal(cls, language: Optional[str] = None) -> str:
        """Get the static refusal text matching the specified or detected language."""
        lang = (language or "en").lower()
        return STATIC_REFUSAL_MESSAGES.get(lang, STATIC_REFUSAL_MESSAGES["en"])

    @classmethod
    def _build_refusal(cls, language: Optional[str], category: str) -> Tuple[str, str]:
        reply = cls.get_static_refusal(language)
        return reply, category
