# CareQueue AI - Full System Testing Guide and Strategy

This document provides a structured, step-by-step manual and automated testing strategy to verify all modules, user roles, real-time WebSocket channels, and queue state machines across the entire platform.

---

## 1. Automated Test Suite Execution

### 1-Click Automated Docker DB Test Runner
You can run the complete end-to-end automated testing pipeline directly against the Docker PostgreSQL and Redis containers using the automated test script:

```powershell
.\test_system_docker.ps1
```

This automated script will:
1. Ensure the PostgreSQL (port 5440) and Redis (port 6379) Docker containers are active.
2. Apply all latest Alembic database migrations.
3. Seed clean demonstration records.
4. Verify live database table connectivity and row counts.
5. Execute all 41 backend pytest suites against the live Docker database.

---

### Manual Pytest Suite Execution
Alternatively, activate your virtual environment and run the test suite manually:

```bash
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```

Expected output:
- 41 passed test cases.

### Frontend TypeScript and Production Build Verification
Verify type safety and compilation:

```bash
cd frontend
npm run build
```

Expected output:
- Zero TypeScript errors.
- Successful production bundle build in dist/.

---

## 2. Interactive Role-Based Manual Testing Strategy

To test the system end-to-end in your browser, open two browser windows side by side (e.g., standard window and an incognito window) to observe real-time WebSocket synchronization.

Default demo accounts:
- Patient: patient.dararith@gmail.com / patient123!
- Doctor: dr.sokha@royalcityhospital.com / doctor123!
- Super Admin: admin@carequeue.ai / admin123!

---

### Module A: Patient Journey Testing

#### Step 1: Hospital Discovery & Live Queues
1. Open the application at http://localhost:5173.
2. Select the "Discover Hospitals" tab.
3. Type a hospital name (e.g., "Royal") in the search bar and submit.
4. Verify that hospital cards display outpatient departments with live queue lengths and estimated wait times (e.g., "Cardiology - 2 waiting - ~30 mins").

#### Step 2: AI Symptom Triage & Clinic Matcher
1. Select the "Symptom Triage" tab.
2. Test Case 1 (Cardiology): Enter "I have acute chest pain and palpitations" -> Click "Analyze Symptoms".
   - Verify recommended department is Cardiology with Urgent priority and matching clinics sorted by shortest wait time.
3. Test Case 2 (Dermatology): Enter "Severe skin rash and itchy eczema on arms".
   - Verify recommended department is Dermatology with Standard priority.
4. Test Case 3 (Validation Error): Submit an empty input.
   - Verify human-friendly error text appears directly beneath the textarea without any container box or technical jargon.

#### Step 3: Remote Ticket Booking
1. From either Hospital Discovery or Symptom Triage, click "Reserve Ticket" on a department.
2. Fill in the Patient Name and Phone Number in the reservation modal.
3. Click "Confirm Ticket".
4. Verify you are automatically redirected to the "Live Ticket Tracker" tab with your newly issued ticket number (e.g., CARDIO-001).

#### Step 4: Live Ticket Tracker & In-App Notifications
1. Observe the live ticket badge, current position in line, and estimated wait duration.
2. Verify that the notification bell in the top right header shows an unread badge count with your "Ticket Confirmed" alert.

---

### Module B: Hospital Counter Operations Testing

#### Step 1: Login as Doctor / Counter Staff
1. In your second browser window, click "Sign In" in the header.
2. Click "Doctor" demo role to auto-fill dr.sokha@royalcityhospital.com and click "Sign In".
3. Verify that the "Counter Console" tab is selected.

#### Step 2: Real-Time State Machine Transitions
1. In the Counter Console, find the patient ticket created in Module A.
2. Click "Call Next":
   - Observe in the Patient window that the ticket instantly shifts to "Called - Proceed to Room" via WebSockets, and a top notification banner appears.
3. Click "Start Visit":
   - Ticket status shifts to "In Consultation / Now Serving".
4. Click "Complete Visit":
   - Ticket status shifts to "Completed" and total completed count increments.

#### Step 3: Walk-In Ticket Generation
1. Click "Issue Walk-In Ticket" in the Counter Console.
2. Enter patient name "Walk-in Guest" and phone number -> Submit.
3. Verify the walk-in ticket appears immediately in the counter queue list with source badge "WALK_IN".

#### Step 4: Doctor Shift and Department Management
1. Select the "Doctors" tab.
2. Verify existing doctor profiles and weekly shift matrices.
3. Select the "Departments" tab.
4. Add a new clinical department (e.g., "Orthopedics & Sports Medicine") and verify it appears in the catalog.

---

### Module C: Platform Super Admin Governance Testing

#### Step 1: Login as Super Admin
1. Click "Sign In" -> Select "Super Admin" demo role -> Sign In as admin@carequeue.ai.
2. Select the "Admin Center" tab.

#### Step 2: System Telemetry & KPIs
1. Verify platform summary cards: Total Partner Hospitals, Registered Patients, and Total Tickets Today.

#### Step 3: Partner Hospital Verification Pipeline
1. In the "Partner Verification & Onboarding" table, inspect registered hospitals.
2. Click "Approve" or "Reject" to test partner verification status changes.
3. Verify the status badge updates immediately.

#### Step 4: Platform User Directory
1. In the "User Directory & Account Governance" section, use the search box to filter by name or role.
2. Click "Deactivate" / "Activate" on a patient account to verify account status toggling.

#### Step 5: System Audit Trail
1. Scroll to the "System Operations & Audit Trail" section.
2. Verify the chronological log of all ticket state transitions (NEW -> WAITING -> CALLED -> SERVING -> COMPLETED) with timestamps and operator names.

---

### Module D: Security & Access Boundary Testing

1. Log in as a Patient.
2. Attempt to manually navigate or perform staff/admin operations:
   - Verify that administrative actions are hidden and API calls return HTTP 403 Forbidden.
3. Log out and attempt to access protected endpoints:
   - Verify API returns HTTP 401 Unauthorized.

---

### Module E: Dynamic Formula Wait-Time Verification

1. Check that when a patient is in position 1 with consultation in progress, the remaining wait time deducts elapsed minutes.
2. Verify peak-hour multiplier: during morning rush (09:00 - 11:30) and afternoon rush (14:00 - 16:00), estimated wait times reflect the congestion factor.

---

## 3. Test Verification Checklist Summary

- [ ] All 41 Pytest unit and integration tests pass.
- [ ] Frontend builds cleanly with zero TypeScript errors.
- [ ] Hospital search and department queue browsing work.
- [ ] Symptom triage correctly identifies Cardiology, Dermatology, Orthopedics, Pediatrics, and General Medicine.
- [ ] Ticket booking issues unique sequential ticket numbers (e.g., CARDIO-001).
- [ ] WebSockets deliver real-time ticket state shifts across multiple browser windows.
- [ ] In-app notification bell and popup banners fire automatically on turn call and booking.
- [ ] Counter console executes Call Next, Start Visit, Complete, Skip, and No-Show.
- [ ] Super Admin portal approves/rejects partner hospitals and manages user accounts.
- [ ] No visual box-shadows, text-shadows, or AI-generated sparkle icons.
- [ ] All error messages display inline in plain human-readable text without container boxes.
