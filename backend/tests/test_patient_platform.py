import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_search_hospitals_discovery():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Search all
        res = await client.get("/api/v1/patients/discovery/hospitals")
        assert res.status_code == 200
        hospitals = res.json()
        assert len(hospitals) >= 1
        hosp = hospitals[0]
        assert "name" in hosp
        assert "departments" in hosp
        assert len(hosp["departments"]) >= 1

        # 2. Filter search query
        res_query = await client.get("/api/v1/patients/discovery/hospitals?q=Royal")
        assert res_query.status_code == 200
        filtered = res_query.json()
        assert len(filtered) >= 1
        assert "Royal" in filtered[0]["name"]


@pytest.mark.asyncio
async def test_search_doctors_discovery():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/patients/discovery/doctors")
        assert res.status_code == 200
        doctors = res.json()
        assert len(doctors) >= 1
        assert any("Cardiologist" in d["specialty"] for d in doctors)


@pytest.mark.asyncio
async def test_get_my_tickets():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login patient
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        patient_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {patient_token}"}

        # Get tickets
        tickets_res = await client.get("/api/v1/patients/my-tickets", headers=headers)
        assert tickets_res.status_code == 200
        tickets = tickets_res.json()
        assert isinstance(tickets, list)


@pytest.mark.asyncio
async def test_get_and_update_patient_profile():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login patient
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        patient_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {patient_token}"}

        # 1. Get profile
        profile_res = await client.get("/api/v1/patients/my-profile", headers=headers)
        assert profile_res.status_code == 200
        data = profile_res.json()
        assert "Dararith" in data["full_name"]

        # 2. Update profile
        update_res = await client.put(
            "/api/v1/patients/my-profile",
            json={
                "blood_type": "O+",
                "emergency_contact_name": "Sothea Chea",
                "emergency_contact_phone": "+85512999888",
            },
            headers=headers,
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["emergency_contact_name"] == "Sothea Chea"
        assert updated["blood_type"] == "O+"
