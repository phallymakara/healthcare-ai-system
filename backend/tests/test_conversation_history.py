import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.chat import ChatConversation, ChatMessage


@pytest.mark.asyncio
async def test_conversations_auth_required():
    """All conversation endpoints must reject requests without valid JWT auth"""
    fake_uuid = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # GET list
        res = await client.get("/api/v1/assistant/conversations")
        assert res.status_code == 401

        # GET detail
        res = await client.get(f"/api/v1/assistant/conversations/{fake_uuid}")
        assert res.status_code == 401

        # POST create
        res = await client.post("/api/v1/assistant/conversations", json={"title": "Test"})
        assert res.status_code == 401

        # DELETE
        res = await client.delete(f"/api/v1/assistant/conversations/{fake_uuid}")
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_conversations_user_isolation():
    """Conversations created by User A must be completely invisible and inaccessible to User B"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register User A
        suffix_a = uuid.uuid4().hex[:6]
        res_a = await client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Patient Alpha",
                "email": f"patient.alpha.{suffix_a}@carequeue.ai",
                "password": "Password123!",
                "phone_number": f"+85599{uuid.uuid4().int % 1000000:06d}",
            },
        )
        assert res_a.status_code == 201
        token_a = res_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 2. Register User B
        suffix_b = uuid.uuid4().hex[:6]
        res_b = await client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Patient Beta",
                "email": f"patient.beta.{suffix_b}@carequeue.ai",
                "password": "Password123!",
                "phone_number": f"+85598{uuid.uuid4().int % 1000000:06d}",
            },
        )
        assert res_b.status_code == 201
        token_b = res_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 3. User A creates a conversation
        create_res = await client.post(
            "/api/v1/assistant/conversations",
            json={"title": "Confidential Cardiology Consult"},
            headers=headers_a,
        )
        assert create_res.status_code == 201
        conv_id_a = create_res.json()["id"]

        # 4. User B lists conversations -> must NOT see User A's conversation
        list_b = await client.get("/api/v1/assistant/conversations", headers=headers_b)
        assert list_b.status_code == 200
        assert not any(c["id"] == conv_id_a for c in list_b.json())

        # 5. User B attempts to access User A's conversation detail -> must return 404
        get_b = await client.get(f"/api/v1/assistant/conversations/{conv_id_a}", headers=headers_b)
        assert get_b.status_code == 404

        # 6. User B attempts to delete User A's conversation -> must return 404
        del_b = await client.delete(f"/api/v1/assistant/conversations/{conv_id_a}", headers=headers_b)
        assert del_b.status_code == 404

        # 7. Verify User A can still retrieve and delete their own conversation
        get_a = await client.get(f"/api/v1/assistant/conversations/{conv_id_a}", headers=headers_a)
        assert get_a.status_code == 200
        assert get_a.json()["title"] == "Confidential Cardiology Consult"

        del_a = await client.delete(f"/api/v1/assistant/conversations/{conv_id_a}", headers=headers_a)
        assert del_a.status_code == 200


@pytest.mark.asyncio
async def test_conversation_multiturn_auto_persistence_and_cascade_delete():
    """Verify multi-turn conversation auto-persistence, message ordering, and cascade deletion"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login standard patient
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Turn 1: First chat message without conversation_id -> Backend must create conversation
        turn1_res = await client.post(
            "/api/v1/assistant/chat",
            json={"message": "I feel dizzy when standing up quickly."},
            headers=headers,
        )
        assert turn1_res.status_code == 200
        turn1_data = turn1_res.json()
        conv_id = turn1_data["conversation_id"]
        assert conv_id is not None

        # Verify conversation summary in list
        list_res = await client.get("/api/v1/assistant/conversations", headers=headers)
        assert list_res.status_code == 200
        matching = [c for c in list_res.json() if c["id"] == conv_id]
        assert len(matching) == 1
        assert "dizzy" in matching[0]["title"].lower()
        assert matching[0]["message_count"] == 2

        # Turn 2: Follow-up message referencing conversation_id
        turn2_res = await client.post(
            "/api/v1/assistant/chat",
            json={
                "message": "Should I drink more electrolyte water?",
                "conversation_id": conv_id,
            },
            headers=headers,
        )
        assert turn2_res.status_code == 200
        assert turn2_res.json()["conversation_id"] == conv_id

        # Retrieve detail and verify all 4 messages are present in order
        detail_res = await client.get(f"/api/v1/assistant/conversations/{conv_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert len(detail["messages"]) == 4

        assert detail["messages"][0]["role"] == "user"
        assert "dizzy" in detail["messages"][0]["content"]

        assert detail["messages"][1]["role"] == "assistant"

        assert detail["messages"][2]["role"] == "user"
        assert "electrolyte" in detail["messages"][2]["content"]

        assert detail["messages"][3]["role"] == "assistant"

        # Verify renaming conversation title via PATCH
        patch_res = await client.patch(
            f"/api/v1/assistant/conversations/{conv_id}",
            json={"title": "Renamed Dizziness Consultation"},
            headers=headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["title"] == "Renamed Dizziness Consultation"

        # Verify cascade deletion from database
        del_res = await client.delete(f"/api/v1/assistant/conversations/{conv_id}", headers=headers)
        assert del_res.status_code == 200

        # Verify 404 via API
        get_res = await client.get(f"/api/v1/assistant/conversations/{conv_id}", headers=headers)
        assert get_res.status_code == 404

        # Direct database query check: ensure zero orphaned messages exist
        async with AsyncSessionLocal() as session:
            conv_stmt = select(ChatConversation).where(ChatConversation.id == uuid.UUID(conv_id))
            conv_in_db = (await session.execute(conv_stmt)).scalar_one_or_none()
            assert conv_in_db is None

            msg_stmt = select(ChatMessage).where(ChatMessage.conversation_id == uuid.UUID(conv_id))
            msgs_in_db = (await session.execute(msg_stmt)).scalars().all()
            assert len(msgs_in_db) == 0


@pytest.mark.asyncio
async def test_image_attachment_persistence():
    """Verify that image attachments uploaded with prompt are stored and returned in message logs"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        test_image_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        chat_res = await client.post(
            "/api/v1/assistant/chat",
            json={
                "message": "Can you check this skin rash photo?",
                "image_url": test_image_url,
            },
            headers=headers,
        )
        assert chat_res.status_code == 200
        conv_id = chat_res.json()["conversation_id"]
        assert conv_id is not None

        # Fetch detail and verify image_url is stored on the user message
        detail_res = await client.get(f"/api/v1/assistant/conversations/{conv_id}", headers=headers)
        assert detail_res.status_code == 200
        messages = detail_res.json()["messages"]
        user_msg = next(m for m in messages if m["role"] == "user")
        assert user_msg["image_url"] == test_image_url

        # Clean up test conversation
        await client.delete(f"/api/v1/assistant/conversations/{conv_id}", headers=headers)


@pytest.mark.asyncio
async def test_guest_chat_unauthenticated_does_not_persist_db():
    """Guest chats (no Authorization header) operate statelessly without saving to DB and return conversation_id=None"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/assistant/chat",
            json={"message": "What is normal body temperature?"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["conversation_id"] is None
        assert len(data["reply"]) > 0
