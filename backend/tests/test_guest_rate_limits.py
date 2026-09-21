import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.jwt import create_access_token


@pytest.mark.asyncio
async def test_guest_rate_limit_enforces_7_messages_per_hour(db_session):
    transport = ASGITransport(app=app)
    device_id = f"test_dev_{uuid.uuid4().hex}"
    client_ip = f"198.51.100.{uuid.uuid4().int % 200 + 10}"

    headers = {
        "X-Device-Id": device_id,
        "X-Forwarded-For": client_ip,
        "User-Agent": "PyTestClient/1.0",
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First 7 guest messages should be allowed
        for i in range(1, 8):
            res = await client.post(
                "/api/v1/assistant/chat",
                json={"message": f"Guest test symptom query {i}", "history": []},
                headers=headers,
            )
            assert res.status_code == 200, f"Expected message {i} to pass, got {res.status_code}"

        # 8th message should hit the 7 msgs/hour rate limit
        res_blocked = await client.post(
            "/api/v1/assistant/chat",
            json={"message": "Guest test symptom query 8", "history": []},
            headers=headers,
        )
        assert res_blocked.status_code == 429
        detail = res_blocked.json().get("detail", {})
        assert detail.get("code") == "GUEST_LIMIT_REACHED"
        assert detail.get("minutes_remaining") > 0


@pytest.mark.asyncio
async def test_guest_ip_ceiling_prevents_device_rotation_bot_attack(db_session):
    transport = ASGITransport(app=app)
    bot_ip = f"203.0.113.{uuid.uuid4().int % 200 + 10}"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Send 20 messages each with a freshly randomized device ID (simulating a bot rotation attack)
        for i in range(1, 21):
            headers = {
                "X-Device-Id": f"bot_dev_{uuid.uuid4().hex}",
                "X-Forwarded-For": bot_ip,
                "User-Agent": "BotRotationScript/1.0",
            }
            res = await client.post(
                "/api/v1/assistant/chat",
                json={"message": f"Bot probe query {i}", "history": []},
                headers=headers,
            )
            assert res.status_code == 200, f"Expected probe {i} to pass under IP ceiling, got {res.status_code}"

        # 21st message from this IP should be blocked by the 20 msgs/hour IP ceiling
        headers_blocked = {
            "X-Device-Id": f"bot_dev_{uuid.uuid4().hex}",
            "X-Forwarded-For": bot_ip,
            "User-Agent": "BotRotationScript/1.0",
        }
        res_blocked = await client.post(
            "/api/v1/assistant/chat",
            json={"message": "Bot probe query 21", "history": []},
            headers=headers_blocked,
        )
        assert res_blocked.status_code == 429
        detail = res_blocked.json().get("detail", {})
        assert detail.get("code") == "GUEST_LIMIT_REACHED"


@pytest.mark.asyncio
async def test_authenticated_user_bypasses_guest_limits(db_session):
    unique_phone = f"+85598{uuid.uuid4().hex[:6]}"
    user = User(
        full_name="Registered Patient",
        phone_number=unique_phone,
        hashed_password=get_password_hash("SecretPass123!"),
        role=UserRole.PATIENT,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(subject=user.id, role=user.role.value)
    device_id = f"test_dev_{uuid.uuid4().hex}"
    client_ip = f"192.0.2.{uuid.uuid4().int % 200 + 10}"

    headers = {
        "X-Device-Id": device_id,
        "X-Forwarded-For": client_ip,
        "Authorization": f"Bearer {token}",
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Authenticated user should be able to send more than 7 messages freely
        for i in range(1, 9):
            res = await client.post(
                "/api/v1/assistant/chat",
                json={"message": f"Patient medical query {i}", "history": []},
                headers=headers,
            )
            assert res.status_code == 200
