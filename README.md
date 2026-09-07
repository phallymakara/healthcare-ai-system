# CareQueue AI - Intelligent Healthcare Queue Management Platform

CareQueue AI is an enterprise healthcare management system designed for multi-tenant hospital queue management, intelligent symptom triage, dynamic wait-time calculation, counter console operations, and patient real-time ticket tracking.

---

## System Architecture

The platform is structured into modular layers:

- Frontend: React 18, TypeScript, Vite, Vanilla CSS design system.
- Backend: FastAPI (Python 3.12+), SQLAlchemy 2.0 Async, Pydantic v2.
- Database: PostgreSQL 16 on port 5440 via asyncpg.
- Cache & Real-Time: Redis 7 on port 6379, WebSocket multi-channel dispatcher.

---

## Core Capabilities

### 1. Patient Portal
- Hospital and department discovery with live queue lengths.
- Symptom triage assistant mapping clinical complaints to medical departments.
- Remote queue ticket reservation.
- Live ticket tracker connected via WebSockets showing real-time positions and wait times.
- Consultation and visit history.

### 2. Hospital Partner & Counter Operations
- Live Counter Console for doctors and receptionists.
- Patient queue controls: Call Next, Start Consultation, Complete, Skip, No-Show.
- Walk-in ticket generator for on-premise arrivals.
- Doctor shift and department catalog management.

### 3. Platform Administration
- Super Admin dashboard with system-wide KPIs.
- Partner hospital verification pipeline.
- User directory and account status governance.
- System audit trail and state transition logs.

### 4. Dynamic Wait-Time Formula Engine
- Formula-driven deterministic queue modeling.
- Real-time deduction of active consultation elapsed time.
- Time-of-day peak congestion multipliers (morning and afternoon rush).
- Confidence interval estimation window.

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 18+ and npm

### 1. Infrastructure Setup (Docker Compose)

#### For Local Development (Database & Redis only):
Start only the PostgreSQL and Redis containers so you can run Backend and Frontend locally with hot-reloading:

```bash
docker compose -f docker-compose.dev.yml up -d
```

> **Tip**: To also launch web management tools (Adminer for PostgreSQL at `http://localhost:8080` and Redis Commander at `http://localhost:8081`):
> ```bash
> docker compose -f docker-compose.dev.yml --profile tools up -d
> ```

Verify services:
- PostgreSQL: 127.0.0.1:5440 (Database: healthcare_ai_db, User: postgres, Password: postgres123)
- Redis: 127.0.0.1:6379

#### For Production / Full-Stack (Builds all 4 containers):
To run all images including FastAPI backend and Nginx frontend in Docker:

```bash
docker compose up -d --build
```

### 2. Backend Setup
Navigate to the backend directory and activate the virtual environment:

```bash
cd backend
.\venv\Scripts\Activate.ps1
```

Apply database migrations:
```bash
alembic upgrade head
```

Seed initial demonstration data:
```bash
python -m app.seeds.seed_data
```

Start the FastAPI application:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at: `http://localhost:8000/docs`.

### 3. Frontend Setup
Navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The web application will be accessible at: `http://localhost:5173`.

---

## Default Demo Accounts

| Role | Email / Phone | Password | Target Console / Access |
| :--- | :--- | :--- | :--- |
| **Hospital Admin** | `patient.dararith@gmail.com` | `patient123!` | Hospital Partner Console |
| **Doctor / Physician** | `dr.sokha@royalcityhospital.com` | `doctor123!` | Hospital Counter & Shifts |
| **Super Admin** | `admin@carequeue.ai` | `admin123!` | Super Admin Center |
| **Patient** | `patient.sophea@gmail.com` | `patient123!` | Patient App & Live Tickets |

---

## Running Automated Tests

Run the complete backend test suite:

```bash
cd backend
.\venv\Scripts\pytest
```

Run frontend production build verification:

```bash
cd frontend
npm run build
```
