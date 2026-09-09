import sys
import urllib.request
import urllib.error
import json

sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://localhost:8000/api/v1'

# 1. Get first department of hospital
hosp_id = '11c80144-bc31-4ed1-8529-f25db3a203d3'
req = urllib.request.Request(f'{BASE}/patients/discovery/hospitals')
with urllib.request.urlopen(req) as resp:
    hospitals = json.loads(resp.read().decode())
    target_hosp = next((h for h in hospitals if h['id'] == hosp_id), hospitals[0])
    dept_id = target_hosp['departments'][0]['id']
    print("Using hospital:", target_hosp['name'], "dept:", target_hosp['departments'][0]['name'])

# 2. Book slot '09:00 AM - 10:00 AM'
book_payload = {
    'hospital_id': hosp_id,
    'department_id': dept_id,
    'patient_name': 'Test Slot Patient',
    'patient_phone': '012345678',
    'appointment_date': '2026-09-09',
    'appointment_time': '09:00 AM - 10:00 AM'
}
req = urllib.request.Request(
    f'{BASE}/tickets/book',
    data=json.dumps(book_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
try:
    with urllib.request.urlopen(req) as resp:
        ticket = json.loads(resp.read().decode())
        ticket_id = ticket['id']
        print(f"Booked ticket successfully! Ticket #{ticket['ticket_number']}, id={ticket_id}")
except urllib.error.HTTPError as e:
    print("Booking failed with status:", e.code)
    print("Response body:", e.read().decode())
    sys.exit(1)

# 3. Check slots availability
req = urllib.request.Request(f'{BASE}/tickets/slots/availability?hospital_id={hosp_id}&department_id={dept_id}&date=2026-09-09')
with urllib.request.urlopen(req) as resp:
    avail = json.loads(resp.read().decode())
    print(f"Slots after booking -> Total: {avail['total_slots']}, Available: {avail['available_slots']}, Booked: {avail['booked_slots']}")
    slot_09 = next(s for s in avail['slots'] if '09:00' in s['slot'])
    print(f"  Slot 09:00 AM - 10:00 AM status: is_booked={slot_09['is_booked']}, count={slot_09['booked_count']}")

# 4. Attempt double booking identical slot
try:
    req = urllib.request.Request(
        f'{BASE}/tickets/book',
        data=json.dumps(book_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    urllib.request.urlopen(req)
    print("ERROR: Double booking succeeded when it should fail!")
except urllib.error.HTTPError as e:
    err = json.loads(e.read().decode())
    print(f"Double booking blocked correctly! HTTP {e.code}: {err['detail']}")

# 5. Attempt booking with intermediate time '09:30 AM'
try:
    payload_30 = dict(book_payload, appointment_time='09:30 AM')
    req = urllib.request.Request(
        f'{BASE}/tickets/book',
        data=json.dumps(payload_30).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    urllib.request.urlopen(req)
    print("ERROR: Intermediate 09:30 AM booking succeeded when slot is taken!")
except urllib.error.HTTPError as e:
    err = json.loads(e.read().decode())
    print(f"Intermediate time booking blocked correctly! HTTP {e.code}: {err['detail']}")

# 6. Cancel test ticket and check slot availability restored
req = urllib.request.Request(
    f'{BASE}/tickets/{ticket_id}/cancel',
    data=json.dumps({'reason': 'End-to-end test completion'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as resp:
    print("Ticket cancelled successfully.")

req = urllib.request.Request(f'{BASE}/tickets/slots/availability?hospital_id={hosp_id}&department_id={dept_id}&date=2026-09-09')
with urllib.request.urlopen(req) as resp:
    avail_after = json.loads(resp.read().decode())
    print(f"Slots after cancellation -> Available: {avail_after['available_slots']}, Booked: {avail_after['booked_slots']}")
