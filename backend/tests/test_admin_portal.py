import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_get_admin_dashboard_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as Super Admin
        admin_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "admin123!"},
        )
        admin_token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}

        res = await client.get("/api/v1/admin/dashboard", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total_hospitals"] >= 1
        assert "recent_hospitals" in data


@pytest.mark.asyncio
async def test_list_and_verify_partner_hospital():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        admin_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "admin123!"},
        )
        headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

        # 1. List partners
        list_res = await client.get("/api/v1/admin/partners", headers=headers)
        assert list_res.status_code == 200
        partners = list_res.json()
        assert len(partners) >= 1
        hosp_id = partners[0]["id"]

        # 2. Verify / Approve hospital
        verify_res = await client.post(
            f"/api/v1/admin/partners/{hosp_id}/verify",
            json={"status": "APPROVED"},
            headers=headers,
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["verification_status"] == "APPROVED"
        assert verify_res.json()["is_verified"] is True


@pytest.mark.asyncio
async def test_list_and_toggle_user_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        admin_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "admin123!"},
        )
        headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

        # 1. List users
        users_res = await client.get("/api/v1/admin/users", headers=headers)
        assert users_res.status_code == 200
        users = users_res.json()
        assert len(users) >= 1

        # Pick a non-admin user
        target_user = next((u for u in users if u["role"] == "PATIENT"), users[0])
        user_id = target_user["id"]

        # 2. Update status
        status_res = await client.put(
            f"/api/v1/admin/users/{user_id}/status",
            json={"is_active": True},
            headers=headers,
        )
        assert status_res.status_code == 200
        assert status_res.json()["is_active"] is True


@pytest.mark.asyncio
async def test_list_admin_audit_logs():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        admin_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "admin123!"},
        )
        headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

        res = await client.get("/api/v1/admin/audit-logs", headers=headers)
        assert res.status_code == 200
        logs = res.json()
        assert isinstance(logs, list)


@pytest.mark.asyncio
async def test_non_admin_forbidden():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login Patient
        p_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        p_headers = {"Authorization": f"Bearer {p_login.json()['access_token']}"}

        res = await client.get("/api/v1/admin/dashboard", headers=p_headers)
        assert res.status_code == 403
