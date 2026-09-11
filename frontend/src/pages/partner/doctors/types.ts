export interface DayDef {
  dayIndex: number;
  labelKey: string;
  fullKey: string;
}

export const DAY_DEFS: DayDef[] = [
  { dayIndex: 0, labelKey: 'day_mon', fullKey: 'day_mon_full' },
  { dayIndex: 1, labelKey: 'day_tue', fullKey: 'day_tue_full' },
  { dayIndex: 2, labelKey: 'day_wed', fullKey: 'day_wed_full' },
  { dayIndex: 3, labelKey: 'day_thu', fullKey: 'day_thu_full' },
  { dayIndex: 4, labelKey: 'day_fri', fullKey: 'day_fri_full' },
  { dayIndex: 5, labelKey: 'day_sat', fullKey: 'day_sat_full' },
  { dayIndex: 6, labelKey: 'day_sun', fullKey: 'day_sun_full' },
];

export interface DoctorSchedule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients_per_slot?: number;
  is_active?: boolean;
}

export interface DoctorItem {
  id: string;
  hospital_id: string;
  department_id: string;
  full_name: string;
  specialty: string;
  room_number?: string;
  license_number?: string;
  avg_consultation_minutes?: number;
  photo_url?: string | null;
  is_available: boolean;
  is_active: boolean;
  schedules?: DoctorSchedule[];
}
