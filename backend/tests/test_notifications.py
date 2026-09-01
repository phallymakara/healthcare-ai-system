import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_dispatch_test_notification():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login patient
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        patient_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {patient_token}"}

        # 1. Dispatch manual alert
        res = await client.post(
            "/api/v1/notifications/test-dispatch",
            json={
                "title": "Turn Approaching Alert",
                "message": "Only 1 patient ahead. Please prepare to enter room 201.",
                "notification_type": "TURN_APPROACHING",
                "channel": "IN_APP",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Turn Approaching Alert"
        assert data["notification_type"] == "TURN_APPROACHING"

        # 2. Get my notifications
        list_res = await client.get("/api/v1/notifications/my-notifications", headers=headers)
        assert list_res.status_code == 200
        items = list_res.json()
        assert len(items) >= 1
        assert any(i["title"] == "Turn Approaching Alert" for i in items)


@pytest.mark.asyncio
async def test_automatic_notification_on_ticket_booking():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        # Discover hospital
        h_res = await client.get("/api/v1/patients/discovery/hospitals")
        hosp = h_res.json()[0]
        dept = hosp["departments"][0]

        # Book ticket
        book_res = await client.post(
            "/api/v1/tickets/book",
            json={
                "hospital_id": hosp["id"],
                "department_id": dept["id"],
                "patient_name": "Dararith Ken",
                "patient_phone": "+85512999777",
            },
            headers=headers,
        )
        assert book_res.status_code in [200, 201]
        ticket = book_res.json()

        # Check notifications
        notif_res = await client.get("/api/v1/notifications/my-notifications", headers=headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()
        assert any(ticket["ticket_number"] in n["message"] or n["title"] == "Ticket Confirmed" for n in notifs)
