import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.models import QueueSession, Hospital, Department


@pytest.mark.asyncio
async def test_get_live_queue_snapshot(db_session):
    q_res = await db_session.execute(select(QueueSession))
    queue = q_res.scalars().first()
    assert queue is not None

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/api/v1/queues/{queue.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["department_name"] == "Cardiology"
        assert "active_tickets" in data


@pytest.mark.asyncio
async def test_issue_online_and_walkin_tickets(db_session):
    h_res = await db_session.execute(select(Hospital))
    hospital = h_res.scalars().first()
    d_res = await db_session.execute(
        select(Department).where(Department.hospital_id == hospital.id)
    )
    dept = d_res.scalars().first()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as patient
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        patient_token = login_res.json()["access_token"]

        # 2. Book online ticket
        book_res = await client.post(
            "/api/v1/tickets/book",
            json={
                "hospital_id": str(hospital.id),
                "department_id": str(dept.id),
            },
            headers={"Authorization": f"Bearer {patient_token}"},
        )
        assert book_res.status_code == 201
        ticket_data = book_res.json()
        assert ticket_data["status"] == "WAITING"
        assert ticket_data["ticket_source"] == "ONLINE"
        assert ticket_data["position"] >= 1
        assert ticket_data["ticket_number"].startswith(dept.code or "TICK")

        # 3. Doctor login
        doc_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "dr.sokha@royalcityhospital.com", "password": "doctor123!"},
        )
        doc_token = doc_login.json()["access_token"]

        # 4. Issue walk-in ticket
        walkin_res = await client.post(
            "/api/v1/tickets/walk-in",
            json={
                "hospital_id": str(hospital.id),
                "department_id": str(dept.id),
                "patient_name": "Walk-In Testing Patient",
                "patient_phone": "+85512333444",
            },
            headers={"Authorization": f"Bearer {doc_token}"},
        )
        assert walkin_res.status_code == 201
        walkin_data = walkin_res.json()
        assert walkin_data["status"] == "WAITING"
        assert walkin_data["ticket_source"] == "WALK_IN"
        assert walkin_data["patient_name"] == "Walk-In Testing Patient"


@pytest.mark.asyncio
async def test_full_ticket_lifecycle_step_by_step(db_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as Doctor
        doc_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "dr.sokha@royalcityhospital.com", "password": "doctor123!"},
        )
        doc_token = doc_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {doc_token}"}

        # 2. Get cardiology department
        d_res = await db_session.execute(select(Department))
        dept = d_res.scalars().first()

        # 3. Book a fresh ticket to guarantee a WAITING ticket in queue
        book_res = await client.post(
            "/api/v1/tickets/walk-in",
            json={
                "hospital_id": str(dept.hospital_id),
                "department_id": str(dept.id),
                "patient_name": "Lifecycle Patient Test",
            },
            headers=headers,
        )
        assert book_res.status_code == 201
        booked_ticket = book_res.json()
        queue_session_id = booked_ticket["queue_session_id"]
        booked_id = booked_ticket["id"]

        # 4. Directly test starting & completing this specific ticket
        start_res = await client.post(
            f"/api/v1/tickets/{booked_id}/start",
            headers=headers,
        )
        assert start_res.status_code == 200
        serving_ticket = start_res.json()
        assert serving_ticket["status"] == "SERVING"

        # 5. Complete Consultation
        complete_res = await client.post(
            f"/api/v1/tickets/{booked_id}/complete",
            headers=headers,
        )
        assert complete_res.status_code == 200
        completed_ticket = complete_res.json()
        assert completed_ticket["status"] == "COMPLETED"

        # 6. Check Ticket Detail and Audit Trail
        detail_res = await client.get(f"/api/v1/tickets/{booked_id}")
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["status"] == "COMPLETED"
        assert len(detail_data["logs"]) >= 2  # WAITING -> SERVING -> COMPLETED


@pytest.mark.asyncio
async def test_skip_and_no_show_workflow(db_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login Doctor
        doc_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "dr.sokha@royalcityhospital.com", "password": "doctor123!"},
        )
        headers = {"Authorization": f"Bearer {doc_login.json()['access_token']}"}

        d_res = await db_session.execute(select(Department))
        dept = d_res.scalars().first()

        # Book a test ticket
        book_res = await client.post(
            "/api/v1/tickets/walk-in",
            json={
                "hospital_id": str(dept.hospital_id),
                "department_id": str(dept.id),
                "patient_name": "Skip Patient Test",
            },
            headers=headers,
        )
        test_tid = book_res.json()["id"]

        # Skip patient
        skip_res = await client.post(
            f"/api/v1/tickets/{test_tid}/skip",
            headers=headers,
        )
        assert skip_res.status_code == 200
        assert skip_res.json()["status"] == "SKIPPED"
