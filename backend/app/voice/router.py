from typing import Any, Callable, List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.voice.config import VoiceConfig
from app.voice.schemas import VoiceCapabilitiesResponse, VoiceTranscribeResponse
from app.voice.stt_service import VoiceSTTService


def create_voice_router(
    get_config: Callable[[], VoiceConfig],
    auth_dependency: Optional[Callable[..., Any]] = None,
    prefix: str = "/voice",
    tags: Optional[List[str]] = None,
) -> APIRouter:
    """Create a portable FastAPI router for voice Speech-to-Text endpoints."""
    router = APIRouter(prefix=prefix, tags=tags or ["Voice Input"])

    @router.get("/capabilities", response_model=VoiceCapabilitiesResponse)
    async def get_voice_capabilities() -> VoiceCapabilitiesResponse:
        cfg = get_config()
        return VoiceCapabilitiesResponse(
            server_stt_available=cfg.is_configured,
            bilingual_auto_detect=cfg.is_configured,
        )

    dependencies = [Depends(auth_dependency)] if auth_dependency else []

    @router.post("/transcribe", response_model=VoiceTranscribeResponse, dependencies=dependencies)
    async def transcribe_voice_input(
        file: UploadFile = File(...),
        language: Optional[str] = Form("auto"),
    ) -> VoiceTranscribeResponse:
        service = VoiceSTTService(get_config())
        result = await service.transcribe_audio(file=file, language=language or "auto")
        return VoiceTranscribeResponse(**result)

    return router
