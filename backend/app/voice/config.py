from dataclasses import dataclass


@dataclass(frozen=True)
class VoiceConfig:
    """Standalone configuration for Speech-to-Text providers (portable across FastAPI apps)."""

    foundry_api_key: str = ""
    foundry_base_url: str = ""
    foundry_stt_model: str = "whisper-1"
    azure_speech_key: str = ""
    azure_speech_region: str = ""
    azure_speech_endpoint: str = ""
    max_audio_bytes: int = 10 * 1024 * 1024  # 10 MB
    request_timeout_seconds: float = 30.0

    @property
    def is_foundry_stt_configured(self) -> bool:
        key = (self.foundry_api_key or "").strip()
        base = (self.foundry_base_url or "").strip()
        model = (self.foundry_stt_model or "").strip()
        return bool(key and key != "your-api-key-here" and len(key) >= 10 and base and model)

    @property
    def is_azure_speech_configured(self) -> bool:
        key = (self.azure_speech_key or "").strip()
        region = (self.azure_speech_region or "").strip()
        endpoint = (self.azure_speech_endpoint or "").strip()
        return bool(key and (region or endpoint))

    @property
    def is_configured(self) -> bool:
        return self.is_foundry_stt_configured or self.is_azure_speech_configured

