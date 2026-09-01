import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_get_partner_dashboard_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login Doctor / Staff
        doc_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "dr.sokha@royalcityhospital.com", "password": "doctor123!"},
        )
        doc_token = doc_login.json()["access_token"]

        response = await client.get(
            "/api/v1/partners/dashboard",
            headers={"Authorization": f"Bearer {doc_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "hospital_name" in data
        assert "total_tickets_today" in data
        assert "departments" in data
        assert len(data["departments"]) >= 1


@pytest.mark.asyncio
async def test_list_and_create_department():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "dr.sokha@royalcityhospital.com", "password": "doctor123!"},
        )
        doc_token = doc_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {doc_token}"}

        # 1. Create Department
        rand_code = f"TEST{uuid.uuid4().hex[:3].upper()}"
        create_res = await client.post(
            "/api/v1/partners/departments",
            json={
                "name": "Orthopedics & Sports Medicine",
                "code": rand_code,
                "description": "Bone, joint, and sports injury care.",
                "floor_room": "Building C, 1st Floor",
                "avg_consultation_minutes": 20,
            },
            headers=headers,
        )
        assert create_res.status_code == 201
        dept_data = create_res.json()
        assert dept_data["name"] == "Orthopedics & Sports Medicine"
        assert dept_data["code"] == rand_code

        # 2. List Departments
        list_res = await client.get("/api/v1/partners/departments", headers=headers)
        assert list_res.status_code == 200
        assert any(d["id"] == dept_data["id"] for d in list_res.json())


@pytest.mark.asyncio
async def test_create_doctor_and_schedule():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "dr.sokha@royalcityhospital.com", "password": "doctor123!"},
        )
        headers = {"Authorization": f"Bearer {doc_login.json()['access_token']}"}

        # Get existing department
        depts_res = await client.get("/api/v1/partners/departments", headers=headers)
        dept_id = depts_res.json()[0]["id"]

        # Create doctor
        rand_email = f"dr.new{uuid.uuid4().hex[:4]}@royalcityhospital.com"
        rand_phone = f"+85512{uuid.uuid4().int % 1000000:06d}"
        create_doc = await client.post(
            "/api/v1/partners/doctors",
            json={
                "department_id": dept_id,
                "full_name": "Dr. Vatanak Srey, MD",
                "specialty": "Pediatric Orthopedic Surgeon",
                "license_number": f"MD-KH-{uuid.uuid4().hex[:4].upper()}",
                "email": rand_email,
                "password": "doctorpassword123!",
                "phone": rand_phone,
                "room_number": "Room 302",
                "avg_consultation_minutes": 20,
            },
            headers=headers,
        )
        assert create_doc.status_code == 201
        doc_data = create_doc.json()
        assert doc_data["full_name"] == "Dr. Vatanak Srey, MD"

        # Add schedule (Wednesday 08:00 - 16:00)
        sched_res = await client.post(
            f"/api/v1/partners/doctors/{doc_data['id']}/schedules",
            json={
                "day_of_week": 2,
                "start_time": "08:00:00",
                "end_time": "16:00:00",
                "max_patients_per_slot": 20,
                "is_active": True,
            },
            headers=headers,
        )
        assert sched_res.status_code == 201
        assert sched_res.json()["day_of_week"] == 2


@pytest.mark.asyncio
async def test_patient_forbidden_from_partner_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login Patient
        p_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        patient_token = p_login.json()["access_token"]

        response = await client.get(
            "/api/v1/partners/dashboard",
            headers={"Authorization": f"Bearer {patient_token}"},
        )
        assert response.status_code == 403
