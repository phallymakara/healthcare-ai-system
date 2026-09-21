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


@pytest.mark.asyncio
async def test_conversations_unauthorized():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/assistant/conversations")
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_conversations_crud_and_auto_persistence():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login patient
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Explicitly create conversation
        create_res = await client.post(
            "/api/v1/assistant/conversations",
            json={"title": "General Health Checkup"},
            headers=headers,
        )
        assert create_res.status_code == 201
        conv_data = create_res.json()
        conv_id = conv_data["id"]
        assert conv_data["title"] == "General Health Checkup"

        # 3. List conversations
        list_res = await client.get("/api/v1/assistant/conversations", headers=headers)
        assert list_res.status_code == 200
        conv_list = list_res.json()
        assert any(c["id"] == conv_id for c in conv_list)

        # 4. Chat with conversation_id - verify auto-persistence
        chat_res = await client.post(
            "/api/v1/assistant/chat",
            json={
                "message": "What should I eat when recovering from mild fever?",
                "conversation_id": conv_id,
            },
            headers=headers,
        )
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        assert chat_data["conversation_id"] == conv_id
        assert len(chat_data["reply"]) > 0

        # 5. Retrieve conversation detail - verify messages persisted in DB
        detail_res = await client.get(
            f"/api/v1/assistant/conversations/{conv_id}",
            headers=headers,
        )
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["id"] == conv_id
        assert len(detail_data["messages"]) >= 2  # user message and assistant reply
        assert detail_data["messages"][0]["role"] == "user"
        assert "mild fever" in detail_data["messages"][0]["content"]
        assert detail_data["messages"][1]["role"] == "assistant"

        # 6. Delete conversation
        delete_res = await client.delete(
            f"/api/v1/assistant/conversations/{conv_id}",
            headers=headers,
        )
        assert delete_res.status_code == 200

        # 7. Verify 404 after deletion
        get_deleted_res = await client.get(
            f"/api/v1/assistant/conversations/{conv_id}",
            headers=headers,
        )
        assert get_deleted_res.status_code == 404

