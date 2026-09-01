import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_triage_cardiology_symptoms():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/assistant/triage",
            json={"symptoms": "I have sudden chest pain, shortness of breath, and palpitations."},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["recommended_specialty"] == "Cardiology"
        assert data["urgency_level"] in ["URGENT", "EMERGENCY"]
        assert len(data["matching_hospitals"]) >= 1


@pytest.mark.asyncio
async def test_triage_dermatology_symptoms():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/assistant/triage",
            json={"symptoms": "Severe skin rash and itchy eczema on my arms."},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["recommended_specialty"] == "Dermatology"
        assert data["urgency_level"] == "STANDARD"


@pytest.mark.asyncio
async def test_triage_general_symptoms():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/assistant/triage",
            json={"symptoms": "Mild fever and sore throat for two days."},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["recommended_specialty"] == "General Medicine"


@pytest.mark.asyncio
async def test_assistant_chat_guidance():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/assistant/chat",
            json={"message": "How do I check wait times?"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "wait" in data["reply"].lower() or "queue" in data["reply"].lower()


@pytest.mark.asyncio
async def test_triage_empty_symptoms_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/assistant/triage",
            json={"symptoms": ""},
        )
        assert res.status_code == 400
