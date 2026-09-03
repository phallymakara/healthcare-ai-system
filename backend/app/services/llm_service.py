import logging
from typing import List, Dict, Optional, Any
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the official Healthcare AI Assistant for our hospital and clinic network.
Your capabilities include:
1. Answering patient questions on general health, symptoms, lifestyle, medications, and wellness.
2. Answering questions on pet health and veterinary care for dogs, cats, and common domestic animals.
3. Helping patients understand what clinical department or specialist is best for their condition.
4. Being empathetic, helpful, clear, and professional.

IMPORTANT GUIDELINES:
- Provide direct, helpful answers to any questions or casual conversation.
- If the user describes serious or life-threatening symptoms (e.g. crushing chest pain, severe bleeding, difficulty breathing), advise them to seek emergency medical attention immediately.
- Always provide clear, well-structured responses without unnecessary fluff.
"""

class LLMService:
    @classmethod
    async def chat_completion(
        cls,
        messages: List[Dict[str, str]],
        system_instruction: Optional[str] = None,
        max_tokens: int = 800,
        temperature: float = 0.7,
    ) -> str:
        """Call Microsoft Foundry / Azure OpenAI GPT-4o model"""
        url = f"{settings.MICROSOFT_FOUNDRY_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "api-key": settings.MICROSOFT_FOUNDRY_API_KEY,
            "Authorization": f"Bearer {settings.MICROSOFT_FOUNDRY_API_KEY}",
            "Content-Type": "application/json",
        }

        full_messages = [
            {"role": "system", "content": system_instruction or SYSTEM_PROMPT}
        ]
        full_messages.extend(messages)

        payload = {
            "model": settings.MICROSOFT_FOUNDRY_MODEL,
            "messages": full_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "").strip()
                    return "I received your message, but was unable to process the response text."
                else:
                    logger.error(f"LLM API Error {res.status_code}: {res.text}")
                    return "I am currently experiencing a service connectivity issue. Please try your question again in a moment."
        except Exception as e:
            logger.error(f"Exception during LLM call: {e}")
            return "Unable to connect to the healthcare AI service. Please verify your connection and try again."
