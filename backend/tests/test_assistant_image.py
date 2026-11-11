import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.langchain_agent import HealthcareAgentService
from langchain_core.messages import HumanMessage


# 1x1 transparent PNG bytes for testing
TINY_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00"
    b"\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.mark.asyncio
async def test_upload_assistant_image_success():
    """Verify valid image upload returns 201 and valid image URL."""
    files = {
        "file": ("test_symptom.png", io.BytesIO(TINY_PNG_BYTES), "image/png"),
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/assistant/upload-image", files=files)
        assert response.status_code == 201
        data = response.json()
        assert "image_url" in data
        assert "blob_name" in data
        assert "consultations/" in data["blob_name"]


@pytest.mark.asyncio
async def test_upload_assistant_image_invalid_type():
    """Verify non-image MIME type upload is rejected with 400."""
    files = {
        "file": ("notes.txt", io.BytesIO(b"medical notes text"), "text/plain"),
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/assistant/upload-image", files=files)
        assert response.status_code == 400
        data = response.json()
        assert "Invalid image type" in data["detail"]


@pytest.mark.asyncio
async def test_upload_assistant_image_oversized():
    """Verify file exceeding 5MB limit is rejected with 400."""
    oversized_bytes = b"0" * (5 * 1024 * 1024 + 1024)
    files = {
        "file": ("large_scan.png", io.BytesIO(oversized_bytes), "image/png"),
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/assistant/upload-image", files=files)
        assert response.status_code == 400
        data = response.json()
        assert "exceeds maximum size" in data["detail"]


def test_multimodal_human_message_construction():
    """Verify that providing an image_url constructs a high-resolution multimodal HumanMessage."""
    test_img = "https://example.com/uploads/symptom.webp"
    ctx = HealthcareAgentService._setup_agent_context(
        message="Rash on forearm",
        history=[],
        db=None,  # Not used for message list construction
        language="en",
        image_url=test_img,
    )
    messages = ctx[4]
    human_msg = messages[-1]
    assert isinstance(human_msg, HumanMessage)
    assert isinstance(human_msg.content, list)
    assert len(human_msg.content) == 2
    assert human_msg.content[0]["type"] == "text"
    assert human_msg.content[0]["text"] == "Rash on forearm"
    assert human_msg.content[1]["type"] == "image_url"
    assert human_msg.content[1]["image_url"]["url"] == test_img
    assert human_msg.content[1]["image_url"]["detail"] == "high"


def test_multimodal_human_message_empty_text_fallback():
    """Verify that an empty message with an image defaults to the clinical vision prompt."""
    test_img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    ctx = HealthcareAgentService._setup_agent_context(
        message="",
        history=[],
        db=None,
        language="km",
        image_url=test_img,
    )
    messages = ctx[4]
    human_msg = messages[-1]
    assert isinstance(human_msg, HumanMessage)
    assert isinstance(human_msg.content, list)
    assert "សូមវិភាគរូបភាពវេជ្ជសាស្ត្រនេះ" in human_msg.content[0]["text"]
    assert human_msg.content[1]["image_url"]["detail"] == "high"


def test_medication_safety_directive_in_system_prompt():
    """Verify SYSTEM_PROMPT contains topical-only and oral-consultation safety rules."""
    from app.services.langchain_agent import SYSTEM_PROMPT
    assert "TOPICAL MEDICATIONS" in SYSTEM_PROMPT
    assert "ថ្នាំលាប" in SYSTEM_PROMPT
    assert "ORAL MEDICATIONS STRICTLY REQUIRE DOCTOR CONSULTATION" in SYSTEM_PROMPT
    assert "ថ្នាំលេប" in SYSTEM_PROMPT


