from pydantic import BaseModel


class VoiceCapabilitiesResponse(BaseModel):
    server_stt_available: bool
    bilingual_auto_detect: bool = False


class VoiceTranscribeResponse(BaseModel):
    text: str
    language: str
    provider: str
