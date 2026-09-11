export interface BookingItem {
  id: string;
  ticket_number: string;
  patient_name: string;
  patient_phone?: string;
  patient_id?: string;
  ticket_source: string;
  status: string;
  appointment_date?: string;
  appointment_time?: string;
  department_id: string;
  department_name?: string;
  department_code?: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  service_id?: string;
  service_name?: string;
  position: number;
  estimated_wait_minutes: number;
  created_at: string;
  serving_started_at?: string;
  completed_at?: string;
}

export interface BookingsSummary {
  total_bookings: number;
  online_bookings: number;
  walkin_bookings: number;
  waiting_count: number;
  serving_count: number;
  completed_count: number;
}

export interface StandardTimeSlot {
  key: string;
  labelKm: string;
}

export const STANDARD_TIME_SLOTS: StandardTimeSlot[] = [
  { key: '08:00 AM - 09:00 AM', labelKm: '០៨:០០ ព្រឹក - ០៩:០០ ព្រឹក' },
  { key: '09:00 AM - 10:00 AM', labelKm: '០៩:០០ ព្រឹក - ១០:០០ ព្រឹក' },
  { key: '10:00 AM - 11:00 AM', labelKm: '១០:០០ ព្រឹក - ១១:០០ ព្រឹក' },
  { key: '11:00 AM - 12:00 PM', labelKm: '១១:០០ ព្រឹក - ១២:០០ ថ្ងៃត្រង់' },
  { key: '01:30 PM - 02:30 PM', labelKm: '០១:៣០ រសៀល - ០២:៣០ រសៀល' },
  { key: '02:30 PM - 03:30 PM', labelKm: '០២:៣០ រសៀល - ០៣:៣០ រសៀល' },
  { key: '03:30 PM - 04:30 PM', labelKm: '០៣:៣០ រសៀល - ០៤:៣០ រសៀល' },
  { key: '04:30 PM - 05:30 PM', labelKm: '០៤:៣០ រសៀល - ០៥:៣០ រសៀល' },
];
