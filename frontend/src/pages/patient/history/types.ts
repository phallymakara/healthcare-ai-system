export interface PrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  dispensed: boolean;
}

export interface DiagnosticItem {
  id: string;
  test_name: string;
  category: string;
  status: 'COMPLETED' | 'NORMAL' | 'REVIEWED';
  notes?: string;
}

export interface BillingReceipt {
  consultation_fee: number;
  pharmacy_fee: number;
  diagnostics_fee: number;
  total_paid: number;
  payment_method: string;
  invoice_number: string;
  paid_at: string;
}

export interface FollowUpPlan {
  recommended_date: string;
  advice: string;
  days_from_visit: number;
}

export interface MedicalRecord {
  id: string;
  ticket_number: string;
  hospital_id: string;
  hospital_name: string;
  hospital_logo_url?: string;
  hospital_address?: string;
  department_name: string;
  doctor_name: string;
  doctor_specialty: string;
  room_number?: string;
  patient_name: string;
  patient_phone?: string;
  visited_date: string;
  consultation_start?: string;
  consultation_end?: string;
  duration_minutes: number;
  status: 'COMPLETED' | 'CANCELLED';
  diagnosis: {
    code?: string;
    condition_en: string;
    condition_km: string;
  };
  clinical_notes: {
    notes_en: string;
    notes_km: string;
  };
  prescriptions: PrescriptionItem[];
  diagnostics: DiagnosticItem[];
  billing: BillingReceipt;
  follow_up?: FollowUpPlan;
}

export const DEMO_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'hist-rec-001',
    ticket_number: 'CARD-001',
    hospital_id: '11c80144-bc31-4ed1-8529-f25db3a203d3',
    hospital_name: 'Royal City General Hospital',
    hospital_logo_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200',
    hospital_address: 'Building 12, Monivong Blvd, Phnom Penh',
    department_name: 'Cardiology',
    doctor_name: 'Dr. Sokha Meas, MD',
    doctor_specialty: 'Senior Cardiologist',
    room_number: 'Room 201',
    patient_name: 'Sophea Rath',
    patient_phone: '+85512999003',
    visited_date: '2026-08-25',
    consultation_start: '09:15 AM',
    consultation_end: '09:40 AM',
    duration_minutes: 25,
    status: 'COMPLETED',
    diagnosis: {
      code: 'ICD-10: I10',
      condition_en: 'Primary Essential Hypertension (Stage 1)',
      condition_km: 'ជំងឺលើសឈាមបឋមដំណាក់កាលទី១',
    },
    clinical_notes: {
      notes_en:
        'Patient reports intermittent mild morning headaches over past 3 weeks. Resting blood pressure recorded at 138/88 mmHg. Heart sounds S1/S2 normal without murmur. Advised DASH diet, reduced sodium intake, and 30 mins brisk walking daily.',
      notes_km:
        'អ្នកជំងឺរាយការណ៍ពីការឈឺក្បាលស្រាលៗនៅពេលព្រឹកក្នុងរយៈពេល ៣ សប្តាហ៍កន្លងមកនេះ។ សម្ពាធឈាមវាស់បាន 138/88 mmHg។ សំឡេងបេះដូងធម្មតា។ បានណែនាំរបបអាហារ DASH កាត់បន្ថយជាតិប្រៃ និងដើរហាត់ប្រាណ ៣០ នាទីជារៀងរាល់ថ្ងៃ។',
    },
    prescriptions: [
      {
        id: 'rx-01',
        medication_name: 'Amlodipine Besylate 5mg',
        dosage: '1 tablet once daily in the morning',
        frequency: 'Daily after breakfast',
        duration: '30 Days (30 Tablets)',
        dispensed: true,
      },
      {
        id: 'rx-02',
        medication_name: 'Omega-3 Fish Oil 1000mg',
        dosage: '1 softgel once daily with food',
        frequency: 'Daily with lunch',
        duration: '30 Days (30 Softgels)',
        dispensed: true,
      },
    ],
    diagnostics: [
      {
        id: 'diag-01',
        test_name: '12-Lead Electrocardiogram (ECG)',
        category: 'Cardiology Diagnostics',
        status: 'NORMAL',
        notes: 'Normal sinus rhythm, heart rate 72 bpm. No ST-T wave abnormalities.',
      },
      {
        id: 'diag-02',
        test_name: 'Lipid Panel & Fasting Glucose',
        category: 'Clinical Pathology',
        status: 'COMPLETED',
        notes: 'Cholesterol within acceptable range; fasting sugar 96 mg/dL.',
      },
    ],
    billing: {
      consultation_fee: 15.0,
      pharmacy_fee: 8.5,
      diagnostics_fee: 0.0,
      total_paid: 23.5,
      payment_method: 'ABA KHQR',
      invoice_number: 'INV-2026-0825-014',
      paid_at: '2026-08-25 09:42 AM',
    },
    follow_up: {
      recommended_date: '2026-09-22',
      advice: 'Blood pressure reassessment and medication tolerance check.',
      days_from_visit: 28,
    },
  },
  {
    id: 'hist-rec-002',
    ticket_number: 'PEDS-098',
    hospital_id: '11c80144-bc31-4ed1-8529-f25db3a203d3',
    hospital_name: 'Royal City General Hospital',
    hospital_logo_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200',
    hospital_address: 'Building 12, Monivong Blvd, Phnom Penh',
    department_name: 'Pediatrics',
    doctor_name: 'Dr. Chenda Voeun, MD',
    doctor_specialty: 'Pediatric Specialist',
    room_number: 'Room 104',
    patient_name: 'Sophea Rath (Child)',
    patient_phone: '+85512999003',
    visited_date: '2026-08-04',
    consultation_start: '10:00 AM',
    consultation_end: '10:20 AM',
    duration_minutes: 20,
    status: 'COMPLETED',
    diagnosis: {
      code: 'ICD-10: J00',
      condition_en: 'Acute Upper Respiratory Infection (Common Cold)',
      condition_km: 'ការរលាកផ្លូវដង្ហើមផ្នែកខាងលើស្រួចស្រាវ (ផ្ដាសាយ)',
    },
    clinical_notes: {
      notes_en:
        'Throat shows mild erythema without tonsillar exudates. Clear lungs bilaterally. Mild low-grade fever resolved. Advised saline nasal drops, rest, and honey lemon warm drinks.',
      notes_km:
        'បំពង់កមានសភាពក្រហមស្រាលដោយគ្មានខ្ទុះ។ សួតដំណើរការល្អ។ បានណែនាំឱ្យបន្តក់ទឹកអំបិលលាងច្រមុះ សម្រាកឱ្យបានច្រើន និងពិសាទឹកក្តៅឧណ្ហៗ។',
    },
    prescriptions: [
      {
        id: 'rx-03',
        medication_name: 'Cetirizine Syrup 5mg/5mL',
        dosage: '2.5 mL once daily before bedtime',
        frequency: 'Evening before sleep',
        duration: '5 Days (60 mL bottle)',
        dispensed: true,
      },
      {
        id: 'rx-04',
        medication_name: 'Saline Nasal Spray 0.9%',
        dosage: '1-2 sprays into each nostril 3 times daily',
        frequency: 'As needed for congestion',
        duration: '7 Days',
        dispensed: true,
      },
    ],
    diagnostics: [],
    billing: {
      consultation_fee: 12.0,
      pharmacy_fee: 6.0,
      diagnostics_fee: 0.0,
      total_paid: 18.0,
      payment_method: 'Cash',
      invoice_number: 'INV-2026-0804-089',
      paid_at: '2026-08-04 10:22 AM',
    },
    follow_up: {
      recommended_date: '2026-08-18',
      advice: 'Return only if fever recurs or breathing difficulty occurs.',
      days_from_visit: 14,
    },
  },
  {
    id: 'hist-rec-003',
    ticket_number: 'SURG-012',
    hospital_id: '11c80144-bc31-4ed1-8529-f25db3a203d3',
    hospital_name: 'Royal City General Hospital',
    hospital_logo_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200',
    hospital_address: 'Building 12, Monivong Blvd, Phnom Penh',
    department_name: 'General Surgery',
    doctor_name: 'Dr. Rithy Som, MD',
    doctor_specialty: 'General Surgeon',
    room_number: 'Room 302',
    patient_name: 'Sophea Rath',
    patient_phone: '+85512999003',
    visited_date: '2026-07-15',
    duration_minutes: 0,
    status: 'CANCELLED',
    diagnosis: {
      condition_en: 'Consultation Cancelled by Patient',
      condition_km: 'ការណាត់ជួបត្រូវបានលុបចោលដោយអ្នកជំងឺ',
    },
    clinical_notes: {
      notes_en: 'Scheduled appointment was cancelled by patient prior to consultation.',
      notes_km: 'ការណាត់ជួបត្រូវបានលុបចោលដោយអ្នកជំងឺមុនពេលម៉ោងពិគ្រោះ។',
    },
    prescriptions: [],
    diagnostics: [],
    billing: {
      consultation_fee: 0.0,
      pharmacy_fee: 0.0,
      diagnostics_fee: 0.0,
      total_paid: 0.0,
      payment_method: 'N/A',
      invoice_number: 'INV-CANCELLED',
      paid_at: '2026-07-15',
    },
  },
];
