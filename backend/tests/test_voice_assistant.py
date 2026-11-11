import io
from types import SimpleNamespace
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.voice import (
    VoiceConfig,
    VoiceSTTService,
    detect_transcribed_language,
    normalize_audio_mime_type,
    resolve_speech_locale,
)


def test_voice_helpers_and_standalone_config():
    assert normalize_audio_mime_type("audio/webm;codecs=opus") == "audio/webm"
    assert normalize_audio_mime_type("AUDIO/WAV") == "audio/wav"
    assert resolve_speech_locale("auto") == ("auto", "km-KH,en-US")
    assert resolve_speech_locale("km") == ("km", "km-KH")
    assert resolve_speech_locale("en-US") == ("en", "en-US")
    assert detect_transcribed_language("ខ្ញុំឈឺក្បាល") == "km"
    assert detect_transcribed_language("I have a mild fever") == "en"
    assert detect_transcribed_language("ខ្ញុំឈឺក្បាល និងមាន fever") == "km+en"

    empty_cfg = VoiceConfig()
    assert empty_cfg.is_configured is False

    foundry_cfg = VoiceConfig(
        foundry_api_key="1234567890abcdef",
        foundry_base_url="https://example.services.ai.azure.com/openai/v1",
        foundry_stt_model="whisper-1",
    )
    assert foundry_cfg.is_configured is True
    assert foundry_cfg.is_foundry_stt_configured is True
    assert VoiceSTTService(foundry_cfg).config.foundry_stt_model == "whisper-1"


@pytest.mark.asyncio
async def test_voice_capabilities_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/assistant/voice/capabilities")
        assert res.status_code == 200
        data = res.json()
        assert "server_stt_available" in data
        assert isinstance(data["server_stt_available"], bool)
        assert "bilingual_auto_detect" in data
        assert isinstance(data["bilingual_auto_detect"], bool)


@pytest.mark.asyncio
async def test_voice_transcribe_validation_errors():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Unsupported MIME type
        res_bad_mime = await client.post(
            "/api/v1/assistant/voice/transcribe",
            files={"file": ("note.txt", io.BytesIO(b"hello"), "text/plain")},
            data={"language": "km"},
        )
        assert res_bad_mime.status_code == 400

        # 2. Empty file
        res_empty = await client.post(
            "/api/v1/assistant/voice/transcribe",
            files={"file": ("empty.webm", io.BytesIO(b""), "audio/webm")},
            data={"language": "en"},
        )
        assert res_empty.status_code == 400

        # 3. Oversized file (>10MB)
        res_big = await client.post(
            "/api/v1/assistant/voice/transcribe",
            files={"file": ("big.webm", io.BytesIO(b"0" * (10 * 1024 * 1024 + 32)), "audio/webm")},
            data={"language": "en"},
        )
        assert res_big.status_code == 400


@pytest.mark.asyncio
async def test_voice_transcribe_unconfigured_returns_503(monkeypatch):
    monkeypatch.setattr("app.api.v1.assistant.settings.MICROSOFT_FOUNDRY_API_KEY", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.MICROSOFT_FOUNDRY_BASE_URL", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.MICROSOFT_FOUNDRY_STT_MODEL", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_KEY", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_REGION", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_ENDPOINT", "")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/assistant/voice/transcribe",
            files={"file": ("speech.webm", io.BytesIO(b"fake-webm-bytes"), "audio/webm;codecs=opus")},
            data={"language": "km"},
        )
        assert res.status_code == 503


@pytest.mark.asyncio
async def test_voice_transcribe_foundry_and_azure_speech_mocked(monkeypatch):
    captured = {}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, **kwargs):
            captured["url"] = url
            captured["kwargs"] = kwargs
            if "transcriptions:transcribe" in url:
                return SimpleNamespace(
                    status_code=200,
                    json=lambda: {"combinedPhrases": [{"text": "ខ្ញុំឈឺក្បាល និងមាន fever"}]},
                    text="",
                )
            if "cognitiveservices" in url:
                return SimpleNamespace(status_code=200, json=lambda: {"DisplayText": "ខ្ញុំឈឺក្បាល"}, text="")
            data_payload = kwargs.get("data") or {}
            if "language" not in data_payload:
                return SimpleNamespace(
                    status_code=200,
                    json=lambda: {"text": "ខ្ញុំឈឺក្បាល និងមាន fever"},
                    text="",
                )
            return SimpleNamespace(status_code=200, json=lambda: {"text": "I have a mild fever"}, text="")

    monkeypatch.setattr("app.voice.stt_service.httpx.AsyncClient", FakeAsyncClient)

    # 1. Foundry Whisper mode (explicit EN + bilingual auto)
    monkeypatch.setattr("app.api.v1.assistant.settings.MICROSOFT_FOUNDRY_API_KEY", "test-key-1234567890")
    monkeypatch.setattr(
        "app.api.v1.assistant.settings.MICROSOFT_FOUNDRY_BASE_URL",
        "https://example.services.ai.azure.com/openai/v1",
    )
    monkeypatch.setattr("app.api.v1.assistant.settings.MICROSOFT_FOUNDRY_STT_MODEL", "whisper-1")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_KEY", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_REGION", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_ENDPOINT", "")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_en = await client.post(
            "/api/v1/assistant/voice/transcribe",
            files={"file": ("voice.webm", io.BytesIO(b"webm-audio-data"), "audio/webm;codecs=opus")},
            data={"language": "en"},
        )
        assert res_en.status_code == 200
        assert res_en.json() == {
            "text": "I have a mild fever",
            "language": "en",
            "provider": "foundry_whisper",
        }
        assert captured["url"].endswith("/audio/transcriptions")
        assert captured["kwargs"]["data"]["language"] == "en"

        res_auto = await client.post(
            "/api/v1/assistant/voice/transcribe",
            files={"file": ("voice.webm", io.BytesIO(b"webm-audio-data"), "audio/webm;codecs=opus")},
            data={"language": "auto"},
        )
        assert res_auto.status_code == 200
        assert res_auto.json() == {
            "text": "ខ្ញុំឈឺក្បាល និងមាន fever",
            "language": "km+en",
            "provider": "foundry_whisper",
        }
        assert "language" not in captured["kwargs"]["data"]
        assert "prompt" in captured["kwargs"]["data"]

    # 2. Azure AI Speech mode (Fast Transcription bilingual WebM)
    monkeypatch.setattr("app.api.v1.assistant.settings.MICROSOFT_FOUNDRY_API_KEY", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.MICROSOFT_FOUNDRY_STT_MODEL", "")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_KEY", "speech-key-123")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_REGION", "southeastasia")
    monkeypatch.setattr("app.api.v1.assistant.settings.AZURE_SPEECH_ENDPOINT", "")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_km = await client.post(
            "/api/v1/assistant/voice/transcribe",
            files={"file": ("voice.webm", io.BytesIO(b"webm-audio-data"), "audio/webm")},
            data={"language": "auto"},
        )
        assert res_km.status_code == 200
        assert res_km.json() == {
            "text": "ខ្ញុំឈឺក្បាល និងមាន fever",
            "language": "km+en",
            "provider": "azure_speech",
        }
        assert "speechtotext/transcriptions:transcribe" in captured["url"]
        definition_json = captured["kwargs"]["files"]["definition"][1]
        assert '"km-KH"' in definition_json
        assert '"en-US"' in definition_json

