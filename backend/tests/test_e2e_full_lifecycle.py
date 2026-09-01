import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_end_to_end_patient_to_counter_to_admin_lifecycle():
    """Complete End-to-End User Lifecycle Integration Test:
    1. Patient Symptom Triage -> Recommended Department.
    2. Patient Online Ticket Reservation -> Wait-time & Position tracking.
    3. Counter Doctor calls ticket -> Starts consultation -> Completes consultation.
    4. Walk-in ticket issuance by Counter Staff.
    5. Super Admin Telemetry & Partner Hospital Verification.
    6. RBAC unauthorized & forbidden access protection.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # =========================================================
        # 1. PATIENT JOURNEY
        # =========================================================
        # A. Login Patient
        pat_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        assert pat_login.status_code == 200
        pat_token = pat_login.json()["access_token"]
        pat_headers = {"Authorization": f"Bearer {pat_token}"}

        # B. Run Symptom Triage
        triage_res = await client.post(
            "/api/v1/assistant/triage",
            json={"symptoms": "Severe chest pressure and irregular heart palpitations."},
        )
        assert triage_res.status_code == 200
        triage_data = triage_res.json()
        assert triage_data["recommended_specialty"] == "Cardiology"
        assert len(triage_data["matching_hospitals"]) >= 1

        selected_clinic = triage_data["matching_hospitals"][0]
        hospital_id = selected_clinic["hospital_id"]
        department_id = selected_clinic["department_id"]

        # C. Book Online Ticket
        book_res = await client.post(
            "/api/v1/tickets/book",
            json={
                "hospital_id": hospital_id,
                "department_id": department_id,
                "patient_name": "Dararith Ken",
                "patient_phone": "+85512999888",
            },
            headers=pat_headers,
        )
        assert book_res.status_code in [200, 201]
        booked_ticket = book_res.json()
        ticket_id = booked_ticket["id"]
        assert booked_ticket["ticket_number"] is not None
        assert booked_ticket["status"] == "WAITING"

        # D. Check In-App Notification Feed
        notif_res = await client.get("/api/v1/notifications/my-notifications", headers=pat_headers)
        assert notif_res.status_code == 200
        assert len(notif_res.json()) >= 1

        # =========================================================
        # 2. DOCTOR / STAFF COUNTER OPERATIONS
        # =========================================================
        # A. Login Doctor
        doc_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "dr.sokha@royalcityhospital.com", "password": "doctor123!"},
        )
        assert doc_login.status_code == 200
        doc_token = doc_login.json()["access_token"]
        doc_headers = {"Authorization": f"Bearer {doc_token}"}

        # B. Call Next Patient
        call_res = await client.post(
            f"/api/v1/queues/{booked_ticket['queue_session_id']}/call-next",
            headers=doc_headers,
        )
        assert call_res.status_code == 200
        called_ticket = call_res.json()
        assert called_ticket["id"] is not None

        # C. Start Consultation
        start_res = await client.post(
            f"/api/v1/tickets/{called_ticket['id']}/start",
            json={"note": "Started clinical consultation"},
            headers=doc_headers,
        )
        assert start_res.status_code == 200
        assert start_res.json()["status"] == "SERVING"

        # D. Complete Consultation
        complete_res = await client.post(
            f"/api/v1/tickets/{called_ticket['id']}/complete",
            json={"note": "Patient treated successfully"},
            headers=doc_headers,
        )
        assert complete_res.status_code == 200
        assert complete_res.json()["status"] == "COMPLETED"

        # E. Issue Walk-in Ticket for Physical Arrival
        walkin_res = await client.post(
            "/api/v1/tickets/walk-in",
            json={
                "hospital_id": hospital_id,
                "department_id": department_id,
                "patient_name": "Walk-in Guest",
                "patient_phone": "+85599887766",
            },
            headers=doc_headers,
        )
        assert walkin_res.status_code in [200, 201]
        assert walkin_res.json()["ticket_source"] == "WALK_IN"

        # =========================================================
        # 3. SUPER ADMIN PLATFORM GOVERNANCE
        # =========================================================
        # A. Login Super Admin
        admin_login = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "admin123!"},
        )
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # B. Platform Dashboard Telemetry
        admin_dash = await client.get("/api/v1/admin/dashboard", headers=admin_headers)
        assert admin_dash.status_code == 200
        dash_data = admin_dash.json()
        assert dash_data["total_hospitals"] >= 1
        assert dash_data["total_patients"] >= 1

        # C. Audit Trail Logs
        audit_res = await client.get("/api/v1/admin/audit-logs", headers=admin_headers)
        assert audit_res.status_code == 200
        assert len(audit_res.json()) >= 1

        # =========================================================
        # 4. SECURITY & RBAC ACCESS PROTECTION
        # =========================================================
        # Patient attempting Admin route -> 403 Forbidden
        forbidden_res = await client.get("/api/v1/admin/dashboard", headers=pat_headers)
        assert forbidden_res.status_code == 403

        # Unauthenticated request to protected route -> 401 Unauthorized
        unauth_res = await client.get("/api/v1/patients/my-tickets")
        assert unauth_res.status_code == 401
