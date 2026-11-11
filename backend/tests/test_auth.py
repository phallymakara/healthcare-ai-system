import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_admin_login_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "admin123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["role"] == "SUPER_ADMIN"
        assert data["user"]["email"] == "admin@carequeue.ai"


@pytest.mark.asyncio
async def test_patient_login_with_phone():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={"account": "+85512999001", "password": "patient123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "PATIENT"
        assert data["user"]["full_name"] == "Dararith Ken"


@pytest.mark.asyncio
async def test_invalid_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "wrongpassword!"},
        )
        assert response.status_code == 401
        assert "Incorrect" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_new_patient():
    rand_suffix = uuid.uuid4().hex[:6]
    unique_phone = f"+85512{uuid.uuid4().int % 1000000:06d}"
    unique_email = f"patient.{rand_suffix}@carequeue.ai"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Test Patient",
                "phone_number": unique_phone,
                "email": unique_email,
                "password": "securepassword123!",
                "date_of_birth": "1995-08-20",
                "gender": "Female",
                "blood_type": "A+",
                "accept_terms": True,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["user"]["full_name"] == "Test Patient"
        assert data["user"]["patient_profile"]["blood_type"] == "A+"
        assert data["user"]["terms_accepted"] is True
        assert data["user"]["terms_audience"] == "PATIENT"

        # Try duplicate registration -> should fail with 409
        dup_res = await client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Duplicate Patient",
                "phone_number": unique_phone,
                "password": "securepassword123!",
                "accept_terms": True,
            },
        )
        assert dup_res.status_code == 409


@pytest.mark.asyncio
async def test_get_current_user_and_role_protection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as patient
        p_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.dararith@gmail.com", "password": "patient123!"},
        )
        patient_token = p_res.json()["access_token"]

        # 2. Get profile
        me_res = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {patient_token}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "patient.dararith@gmail.com"

        # 3. Patient tries to access admin-only endpoint -> 403 Forbidden
        admin_res = await client.get(
            "/api/v1/auth/admin/ping",
            headers={"Authorization": f"Bearer {patient_token}"},
        )
        assert admin_res.status_code == 403

        # 4. Admin accesses admin endpoint -> 200 OK
        a_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "admin123!"},
        )
        admin_token = a_res.json()["access_token"]
        admin_ok_res = await client.get(
            "/api/v1/auth/admin/ping",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert admin_ok_res.status_code == 200
        assert admin_ok_res.json()["status"] == "authorized"


@pytest.mark.asyncio
async def test_refresh_token_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin@carequeue.ai", "password": "admin123!"},
        )
        refresh_tok = login_res.json()["refresh_token"]

        # Refresh
        refresh_res = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_tok},
        )
        assert refresh_res.status_code == 200
        new_data = refresh_res.json()
        assert "access_token" in new_data
        assert "refresh_token" in new_data


def test_terms_audience_and_validation_unit():
    """Verify role-based Terms audience mapping and mandatory acceptance validation."""
    from fastapi import HTTPException
    from app.models.enums import UserRole
    from app.models.user import User
    from app.services.auth_service import AuthService

    assert AuthService.resolve_terms_audience(UserRole.PATIENT) == "PATIENT"
    assert AuthService.resolve_terms_audience(UserRole.HOSPITAL_ADMIN) == "PARTNER"
    assert AuthService.resolve_terms_audience(UserRole.DOCTOR) == "PARTNER"
    assert AuthService.resolve_terms_audience(UserRole.RECEPTIONIST) == "PARTNER"

    with pytest.raises(HTTPException) as exc_info:
        AuthService._ensure_terms_accepted(False)
    assert exc_info.value.status_code == 422

    u = User(full_name="New Staff", hashed_password="x", role=UserRole.DOCTOR)
    AuthService._stamp_terms_acceptance(u, audience="PARTNER", version="1.0")
    assert u.terms_accepted is True
    assert u.terms_audience == "PARTNER"
    assert u.terms_version == "1.0"
    assert u.terms_accepted_at is not None


@pytest.mark.asyncio
async def test_registration_requires_terms_acceptance_and_accept_terms_endpoint():
    """Verify new patient/partner registrations require accept_terms=True and accept-terms requires auth."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Patient registration without accept_terms -> 422
        pat_res = await client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Unaccepted Patient",
                "email": f"unaccepted.{uuid.uuid4().hex[:6]}@carequeue.ai",
                "password": "securepassword123!",
            },
        )
        assert pat_res.status_code == 422

        # 2. Partner registration without accept_terms -> 422
        part_res = await client.post(
            "/api/v1/auth/partner-register",
            json={
                "admin_full_name": "Unaccepted Admin",
                "contact_identifier": f"clinic.{uuid.uuid4().hex[:6]}@carequeue.ai",
                "password": "securepassword123!",
                "accept_terms": False,
            },
        )
        assert part_res.status_code == 422

        # 3. Unauthenticated POST /accept-terms -> 401
        unauth_res = await client.post("/api/v1/auth/accept-terms", json={"accepted": True})
        assert unauth_res.status_code == 401

