import json
import logging
import re
from pathlib import Path
from typing import Dict, Optional, Tuple
import httpx
from fastapi import HTTPException, UploadFile, status

from app.voice.config import VoiceConfig

logger = logging.getLogger("voice.stt")

ALLOWED_AUDIO_MIME_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/aac",
}

_EXT_BY_MIME = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/wave": "wav",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "mp4",
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
    "audio/aac": "aac",
}

_AZURE_V1_MIME_TYPES = {"audio/wav", "audio/x-wav", "audio/wave", "audio/ogg"}

BILINGUAL_STT_PROMPT = (
    "សូមសរសេរជាភាសាខ្មែរសម្រាប់ពាក្យខ្មែរ និងជាភាសាអង់គ្លេសសម្រាប់ពាក្យអង់គ្លេស។ "
    "Transcribe spoken Khmer in Khmer script (ភាសាខ្មែរ) and spoken English in English. "
    "Never romanize Khmer words into English letters, and never transliterate English words into Khmer script. "
    "The speaker may switch or mix between Khmer and English in the same sentence "
    "(e.g. 'ខ្ញុំឈឺក្បាល និងមាន fever', 'I want to book a clinic'), including healthcare terms, symptoms, and hospital names."
)


def normalize_audio_mime_type(content_type: Optional[str]) -> str:
    """Strip codec parameters (e.g. 'audio/webm;codecs=opus' -> 'audio/webm')."""
    if not content_type:
        return ""
    return content_type.split(";", 1)[0].strip().lower()


def resolve_speech_locale(language: Optional[str]) -> Tuple[str, str]:
    """Resolve short code ('auto', 'km', 'en') and BCP-47 locale(s)."""
    lang = (language or "auto").strip().lower()
    if lang == "auto":
        return "auto", "km-KH,en-US"
    if lang.startswith("km"):
        return "km", "km-KH"
    return "en", "en-US"


def detect_transcribed_language(text: str, fallback: str = "km") -> str:
    """Detect whether transcribed speech contains Khmer, English, or mixed Khmer+English."""
    has_khmer = bool(re.search(r"[\u1780-\u17FF\u19E0-\u19FF]", text or ""))
    has_latin = bool(re.search(r"[a-zA-Z]{2,}", text or ""))
    if has_khmer and has_latin:
        return "km+en"
    if has_khmer:
        return "km"
    if has_latin:
        return "en"
    return "km" if fallback == "auto" else fallback


class VoiceSTTService:
    """Portable Speech-to-Text service supporting bilingual Khmer & English recognition."""

    def __init__(self, config: VoiceConfig):
        self.config = config

    async def validate_audio_upload(self, file: UploadFile) -> Tuple[bytes, str, str]:
        mime_type = normalize_audio_mime_type(file.content_type)
        if mime_type not in ALLOWED_AUDIO_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported audio format '{mime_type or 'unknown'}'.",
            )

        audio_bytes = await file.read()
        await file.seek(0)

        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recorded audio file is empty.",
            )
        if len(audio_bytes) > self.config.max_audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio recording exceeds the maximum allowed size.",
            )

        ext = _EXT_BY_MIME[mime_type]
        safe_name = f"{Path(file.filename or 'recording').stem[:60]}.{ext}"
        return audio_bytes, mime_type, safe_name

    async def transcribe_audio(
        self,
        file: UploadFile,
        language: Optional[str] = "auto",
    ) -> Dict[str, str]:
        """Validate and transcribe an uploaded audio clip supporting Khmer, English, or mixed speech."""
        audio_bytes, mime_type, filename = await self.validate_audio_upload(file)
        short_lang, bcp47_locale = resolve_speech_locale(language)

        if not self.config.is_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Voice transcription service is not configured on the server.",
            )

        # Prefer Azure AI Speech Fast Transcription for bilingual auto-detect (km-KH + en-US)
        if self.config.is_azure_speech_configured:
            text, provider = await self._transcribe_with_azure_speech(
                audio_bytes=audio_bytes,
                mime_type=mime_type,
                filename=filename,
                short_lang=short_lang,
                locale=bcp47_locale,
            )
            detected = detect_transcribed_language(text, fallback=short_lang)
            return {"text": text, "language": detected, "provider": provider}

        if self.config.is_foundry_stt_configured:
            text = await self._transcribe_with_foundry(
                audio_bytes=audio_bytes,
                mime_type=mime_type,
                filename=filename,
                short_lang=short_lang,
            )
            detected = detect_transcribed_language(text, fallback=short_lang)
            return {"text": text, "language": detected, "provider": "foundry_whisper"}

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice transcription service is not configured on the server.",
        )

    async def _transcribe_with_foundry(
        self,
        audio_bytes: bytes,
        mime_type: str,
        filename: str,
        short_lang: str,
    ) -> str:
        base_url = self.config.foundry_base_url.rstrip("/")
        url = f"{base_url}/audio/transcriptions"
        headers = {
            "api-key": self.config.foundry_api_key,
            "Authorization": f"Bearer {self.config.foundry_api_key}",
        }
        files = {"file": (filename, audio_bytes, mime_type)}
        data: Dict[str, str] = {
            "model": self.config.foundry_stt_model,
            "prompt": BILINGUAL_STT_PROMPT,
        }
        # Only lock language when explicitly chosen; omit in 'auto' mode for bilingual Khmer+English detection
        if short_lang in ("km", "en"):
            data["language"] = short_lang

        try:
            async with httpx.AsyncClient(timeout=self.config.request_timeout_seconds) as client:
                res = await client.post(url, headers=headers, files=files, data=data)
            if res.status_code != 200:
                logger.error("Foundry STT error %s: %s", res.status_code, res.text[:250])
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Unable to transcribe voice recording. Please try again.",
                )
            payload = res.json()
            return str(payload.get("text", "")).strip()
        except HTTPException:
            raise
        except Exception as err:
            logger.error("Foundry STT request failed: %s", err)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Voice transcription service timed out or is unavailable.",
            )

    async def _transcribe_with_azure_speech(
        self,
        audio_bytes: bytes,
        mime_type: str,
        filename: str,
        short_lang: str,
        locale: str,
    ) -> Tuple[str, str]:
        # 1. Fast Transcription API supports multi-locale ['km-KH', 'en-US'] and webm/mp4/ogg/wav
        base_endpoint = (
            self.config.azure_speech_endpoint.rstrip("/")
            if self.config.azure_speech_endpoint
            else f"https://{self.config.azure_speech_region}.api.cognitive.microsoft.com"
        )
        fast_url = f"{base_endpoint}/speechtotext/transcriptions:transcribe?api-version=2024-11-15"
        locales = ["km-KH", "en-US"] if short_lang == "auto" else [locale]
        definition = json.dumps({"locales": locales})

        try:
            async with httpx.AsyncClient(timeout=self.config.request_timeout_seconds) as client:
                fast_res = await client.post(
                    fast_url,
                    headers={"Ocp-Apim-Subscription-Key": self.config.azure_speech_key},
                    files={
                        "audio": (filename, audio_bytes, mime_type),
                        "definition": (None, definition, "application/json"),
                    },
                )
            if fast_res.status_code == 200:
                payload = fast_res.json()
                combined = payload.get("combinedPhrases") or []
                if combined and isinstance(combined, list):
                    text = " ".join(str(p.get("text", "")).strip() for p in combined).strip()
                    return text, "azure_speech"
                phrases = payload.get("phrases") or []
                text = " ".join(str(p.get("text", "")).strip() for p in phrases).strip()
                return text, "azure_speech"

            # Fallback to v1 single-locale REST API for WAV/OGG if Fast Transcription is unavailable
            if mime_type in _AZURE_V1_MIME_TYPES and short_lang != "auto":
                v1_url = (
                    f"{self.config.azure_speech_endpoint.rstrip('/')}/speech/recognition/conversation/cognitiveservices/v1"
                    if self.config.azure_speech_endpoint
                    else f"https://{self.config.azure_speech_region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1"
                )
                content_type = "audio/ogg; codecs=opus" if mime_type == "audio/ogg" else "audio/wav"
                async with httpx.AsyncClient(timeout=self.config.request_timeout_seconds) as client:
                    v1_res = await client.post(
                        v1_url,
                        headers={
                            "Ocp-Apim-Subscription-Key": self.config.azure_speech_key,
                            "Content-Type": content_type,
                            "Accept": "application/json",
                        },
                        params={"language": locale, "format": "simple"},
                        content=audio_bytes,
                    )
                if v1_res.status_code == 200:
                    return str(v1_res.json().get("DisplayText", "")).strip(), "azure_speech"

            logger.error("Azure Speech STT error %s: %s", fast_res.status_code, fast_res.text[:250])
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to transcribe voice recording. Please try again.",
            )
        except HTTPException:
            raise
        except Exception as err:
            logger.error("Azure Speech STT request failed: %s", err)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Voice transcription service timed out or is unavailable.",
            )
