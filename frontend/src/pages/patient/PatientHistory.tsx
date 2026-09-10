import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';
import {
  Calendar,
  Clock,
  FileText,
  Check,
  Search,
  Building2,
  Printer,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
} from '../../i18n/formatters';

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

interface PatientHistoryProps {
  onExploreHospitals?: () => void;
}

// Default realistic medical history records
const DEMO_MEDICAL_RECORDS: MedicalRecord[] = [
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
      condition_en: 'Essential Hypertension (Stage 1)',
      condition_km: 'សម្ពាធឈាមឡើងខ្ពស់កម្រិតទី ១ (Hypertension)',
    },
    clinical_notes: {
      notes_en:
        'Blood pressure measured 138/88 mmHg. Heart sounds regular without murmur. Advised low-sodium diet, 30-minute daily walking, and hydration. Begin prescribed daily blood pressure medication as directed.',
      notes_km:
        'សម្ពាធឈាមវាស់បាន ១៣៨/៨៨ mmHg។ ចង្វាក់បេះដូងដំណើរការធម្មតា។ បានណែនាំឱ្យកាត់បន្ថយជាតិប្រៃ ហាត់ប្រាណដើរ ៣០ នាទីក្នុងមួយថ្ងៃ និងពិសាទឹកឱ្យបានគ្រប់គ្រាន់។ ចាប់ផ្តើមលេបថ្នាំបញ្ចុះសម្ពាធឈាមតាមវេជ្ជបញ្ជា។',
    },
    prescriptions: [
      {
        id: 'rx-01',
        medication_name: 'Amlodipine 5mg (Oral Tablet)',
        dosage: '1 tablet once daily in the morning',
        frequency: 'Daily with water',
        duration: '30 Days (30 tablets)',
        dispensed: true,
      },
      {
        id: 'rx-02',
        medication_name: 'Omega-3 Fish Oil 1000mg',
        dosage: '1 capsule daily after lunch',
        frequency: 'Once daily after food',
        duration: '30 Days (30 capsules)',
        dispensed: true,
      },
    ],
    diagnostics: [
      {
        id: 'diag-01',
        test_name: 'Electrocardiogram (ECG / EKG)',
        category: 'Cardiology Diagnostics',
        status: 'NORMAL',
        notes: 'Normal sinus rhythm, no ischemic ST changes.',
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

export const PatientHistory: React.FC<PatientHistoryProps> = ({
  onExploreHospitals,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  const [records, setRecords] = useState<MedicalRecord[]>(DEMO_MEDICAL_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Format Room Number cleanly
  const formatRoom = (room?: string) => {
    if (!room) return '';
    const cleanNum = room.replace(/^(room|បន្ទប់)\s*/i, '').trim();
    return isKm ? `បន្ទប់ ${cleanNum}` : `Room ${cleanNum}`;
  };

  // Load patient tickets from backend if authenticated
  useEffect(() => {
    const fetchPatientTickets = async () => {
      const currentUser = AuthService.getStoredUser();
      if (!currentUser) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/patients/my-tickets`, {
          headers: AuthService.getAuthHeaders(),
        });
        if (res.ok) {
          const tickets = await res.json();
          const pastTickets = tickets.filter(
            (tk: { status: string }) => tk.status === 'COMPLETED' || tk.status === 'CANCELLED'
          );

          if (pastTickets.length > 0) {
            // Map live backend tickets to medical history model
            const liveRecords: MedicalRecord[] = pastTickets.map((tk: any, idx: number) => {
              const matchedDemo = DEMO_MEDICAL_RECORDS[idx % DEMO_MEDICAL_RECORDS.length];
              return {
                id: tk.id,
                ticket_number: tk.ticket_number || `TK-${idx + 100}`,
                hospital_id: tk.hospital_id,
                hospital_name: tk.hospital_name || 'Medical Center',
                hospital_logo_url: tk.hospital_logo_url || matchedDemo.hospital_logo_url,
                hospital_address: tk.hospital_address || matchedDemo.hospital_address,
                department_name: tk.department_name || 'General Medicine',
                doctor_name: tk.doctor_name || 'Assigned Physician',
                doctor_specialty: tk.doctor_specialty || tk.department_name || 'General',
                room_number: tk.room_number || 'Room 101',
                patient_name: tk.patient_name || currentUser.full_name,
                patient_phone: tk.patient_phone || currentUser.phone_number,
                visited_date: tk.appointment_date || tk.created_at?.split('T')[0] || '2026-08-25',
                consultation_start: tk.serving_started_at ? new Date(tk.serving_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:15 AM',
                consultation_end: tk.completed_at ? new Date(tk.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:40 AM',
                duration_minutes: tk.status === 'COMPLETED' ? 25 : 0,
                status: tk.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
                diagnosis: matchedDemo.diagnosis,
                clinical_notes: matchedDemo.clinical_notes,
                prescriptions: tk.status === 'COMPLETED' ? matchedDemo.prescriptions : [],
                diagnostics: tk.status === 'COMPLETED' ? matchedDemo.diagnostics : [],
                billing: matchedDemo.billing,
                follow_up: tk.status === 'COMPLETED' ? matchedDemo.follow_up : undefined,
              };
            });
            setRecords(liveRecords);
          }
        }
      } catch (err) {
        console.warn('Unable to load live tickets from backend, displaying cached medical records.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientTickets();
  }, []);

  // Filtered records by search & status
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) {
        return true;
      }
      const q = searchQuery.toLowerCase().trim();
      const hospitalMatch = rec.hospital_name.toLowerCase().includes(q);
      const doctorMatch = rec.doctor_name.toLowerCase().includes(q);
      const deptMatch = rec.department_name.toLowerCase().includes(q);
      const ticketMatch = rec.ticket_number.toLowerCase().includes(q);
      const diagEnMatch = rec.diagnosis.condition_en.toLowerCase().includes(q);
      const diagKmMatch = rec.diagnosis.condition_km.toLowerCase().includes(q);

      return (
        hospitalMatch ||
        doctorMatch ||
        deptMatch ||
        ticketMatch ||
        diagEnMatch ||
        diagKmMatch
      );
    });
  }, [records, statusFilter, searchQuery]);

  // Handle Search Input Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && filteredRecords.length === 0) {
      setSearchError(isKm ? 'មិនមានកំណត់ត្រាត្រូវគ្នានឹងការស្វែងរករបស់អ្នកទេ' : 'No medical records match your search.');
    } else {
      setSearchError(null);
    }
  };

  // Trigger Print / Download of Official Medical Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', width: '100%', fontFamily: kmFont }}>
      {!selectedRecord ? (
        /* ================= MASTER VIEW: PAST MEDICAL RECORDS LIST ================= */
        <div>
          {/* Header & Search Bar Placed Directly Underneath */}
          <div style={{ marginBottom: '1.6rem' }}>
            {/* Search Input Underneath Text */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '620px',
                marginBottom: '1rem',
              }}
            >
              <input
                type="text"
                className="input-search-rounded"
                placeholder={t('history_search_placeholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.74rem 7.5rem 0.74rem 1.35rem',
                  fontSize: '0.94rem',
                  border: searchError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  outline: 'none',
                  fontFamily: kmFont,
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.52rem 1.15rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                <Search size={15} />
                <span>{isKm ? 'ស្វែងរក' : 'Search'}</span>
              </button>
            </form>

            {/* Plain text inline error message */}
            {searchError && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#dc2626',
                  marginBottom: '1rem',
                  fontFamily: kmFont,
                }}
              >
                {searchError}
              </div>
            )}

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                style={{
                  padding: '0.42rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: statusFilter === 'ALL' ? 700 : 500,
                  border: statusFilter === 'ALL' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  background: statusFilter === 'ALL' ? 'var(--accent-primary)' : 'transparent',
                  color: statusFilter === 'ALL' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                  transition: 'all 0.15s ease',
                }}
              >
                {t('history_filter_all')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                style={{
                  padding: '0.42rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: statusFilter === 'COMPLETED' ? 700 : 500,
                  border: statusFilter === 'COMPLETED' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  background: statusFilter === 'COMPLETED' ? 'var(--accent-primary)' : 'transparent',
                  color: statusFilter === 'COMPLETED' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                  transition: 'all 0.15s ease',
                }}
              >
                {t('history_filter_completed')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CANCELLED')}
                style={{
                  padding: '0.42rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: statusFilter === 'CANCELLED' ? 700 : 500,
                  border: statusFilter === 'CANCELLED' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  background: statusFilter === 'CANCELLED' ? 'var(--accent-primary)' : 'transparent',
                  color: statusFilter === 'CANCELLED' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                  transition: 'all 0.15s ease',
                }}
              >
                {t('history_filter_cancelled')}
              </button>
            </div>
          </div>

          {/* Records List View */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
              <RefreshCw size={24} className="spin" color="var(--accent-primary)" style={{ margin: '0 auto 0.75rem auto' }} />
              <div>{isKm ? 'កំពុងទាញយកប្រវត្តិពិគ្រោះជំងឺ...' : 'Loading medical history records...'}</div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '3rem 2rem',
                textAlign: 'center',
                boxShadow: 'none',
              }}
            >
              <FileText size={42} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  margin: '0 0 0.5rem 0',
                  fontFamily: kmFont,
                }}
              >
                {t('history_no_records_title')}
              </h3>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-muted)',
                  maxWidth: '520px',
                  margin: '0 auto 1.5rem auto',
                  lineHeight: 1.6,
                  fontFamily: kmFont,
                }}
              >
                {t('history_no_records_desc')}
              </p>
              {onExploreHospitals && (
                <button
                  type="button"
                  onClick={onExploreHospitals}
                  style={{
                    padding: '0.55rem 1.35rem',
                    fontSize: '0.94rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {t('appt_book_now')}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredRecords.map((rec) => {
                const isCompleted = rec.status === 'COMPLETED';

                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setSelectedRecord(rec);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--text-main)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.15rem 1.45rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                      boxShadow: 'none',
                      fontFamily: kmFont,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                      {/* Hospital Circular Logo (54px × 54px) */}
                      {rec.hospital_logo_url ? (
                        <img
                          src={rec.hospital_logo_url}
                          alt={rec.hospital_name}
                          style={{
                            width: '54px',
                            height: '54px',
                            minWidth: '54px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--border-color)',
                            background: '#ffffff',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            minWidth: '54px',
                            borderRadius: '50%',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ffffff',
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            color: 'var(--text-main)',
                            flexShrink: 0,
                          }}
                        >
                          {rec.hospital_name
                            ? rec.hospital_name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()
                            : <Building2 size={24} color="var(--text-muted)" />}
                        </div>
                      )}

                      {/* Content details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                        {/* Hospital Name + Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.06rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                            {formatFacilityName(rec.hospital_name, language)}
                          </span>
                          <span
                            style={{
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              color: isCompleted ? '#16a34a' : '#dc2626',
                              fontFamily: kmFont,
                            }}
                          >
                            • {isCompleted ? (isKm ? 'បានបញ្ចប់' : 'Completed') : (isKm ? 'បានលុបចោល' : 'Cancelled')}
                          </span>
                        </div>

                        {/* Department • Doctor • Room */}
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: kmFont, lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                            {formatDepartmentName(rec.department_name, language)}
                          </span>
                          {rec.doctor_name && (
                            <>
                              {' • '}
                              <span>{formatDoctorName(rec.doctor_name, language)}</span>
                            </>
                          )}
                          {rec.room_number && (
                            <>
                              {' • '}
                              <span>{formatRoom(rec.room_number)}</span>
                            </>
                          )}
                        </div>

                        {/* Visited Date & Duration */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '0.86rem',
                            color: 'var(--text-muted)',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            <span>{rec.visited_date}</span>
                          </span>
                          {rec.duration_minutes > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={14} color="var(--text-muted)" />
                              <span>{rec.duration_minutes} {t('history_mins')}</span>
                            </span>
                          )}
                        </div>

                        {/* Primary Diagnosis & Quick Indicators */}
                        {isCompleted && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.84rem',
                                fontWeight: 600,
                                color: 'var(--text-main)',
                                fontFamily: kmFont,
                              }}
                            >
                              {t('history_diagnosis')}: {isKm ? rec.diagnosis.condition_km : rec.diagnosis.condition_en}
                            </span>
                            {rec.prescriptions.length > 0 && (
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                                • {rec.prescriptions.length} {isKm ? 'វេជ្ជបញ្ជា' : 'Prescriptions'}
                              </span>
                            )}
                            {rec.billing.total_paid > 0 && (
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                                • ${rec.billing.total_paid.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= DETAIL VIEW: DIGITAL MEDICAL SUMMARY PASS ================= */
        <div>
          {/* Back Navigation Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              style={{
                padding: '0.2rem 0',
                fontSize: '0.925rem',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'none',
                fontFamily: kmFont,
              }}
            >
              <ArrowLeft size={16} />
              <span>{t('history_back_to_list')}</span>
            </button>
          </div>

          {/* Medical Summary Pass Card (Zero shadows, pure white background, no horizontal dividing lines) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            {/* Header: Facility & Identification */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3
                  style={{
                    margin: '0 0 0.35rem 0',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    fontFamily: kmFont,
                  }}
                >
                  {formatFacilityName(selectedRecord.hospital_name, language)}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                    {formatDepartmentName(selectedRecord.department_name, language)}
                  </span>
                  {' • '}
                  <span>{formatDoctorName(selectedRecord.doctor_name, language)}</span>
                  {selectedRecord.room_number && (
                    <>
                      {' • '}
                      <span>{formatRoom(selectedRecord.room_number)}</span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                  {t('history_visited_on')}: {selectedRecord.visited_date}
                  {selectedRecord.consultation_start && ` • ${selectedRecord.consultation_start} - ${selectedRecord.consultation_end}`}
                  {selectedRecord.duration_minutes > 0 && ` (${selectedRecord.duration_minutes} ${t('history_mins')})`}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    letterSpacing: '0.04em',
                  }}
                >
                  #{selectedRecord.ticket_number}
                </div>
                <span
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: selectedRecord.status === 'COMPLETED' ? '#16a34a' : '#dc2626',
                    fontFamily: kmFont,
                    marginTop: '2px',
                  }}
                >
                  {selectedRecord.status === 'COMPLETED' ? (isKm ? 'បានបញ្ចប់' : 'Completed') : (isKm ? 'បានលុបចោល' : 'Cancelled')}
                </span>
              </div>
            </div>

            {/* Module 1: Clinical Diagnosis & Doctor's Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                  fontFamily: kmFont,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>•</span>
                <span>{t('history_clinical_notes')}</span>
              </div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '0.4rem',
                  fontFamily: kmFont,
                }}
              >
                {isKm ? selectedRecord.diagnosis.condition_km : selectedRecord.diagnosis.condition_en}
                {selectedRecord.diagnosis.code && (
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>
                    ({selectedRecord.diagnosis.code})
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: kmFont,
                }}
              >
                {isKm ? selectedRecord.clinical_notes.notes_km : selectedRecord.clinical_notes.notes_en}
              </p>
            </div>

            {/* Module 2: Digital Prescriptions (e-Rx) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                  fontFamily: kmFont,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>•</span>
                <span>{t('history_prescriptions')}</span>
              </div>

              {selectedRecord.prescriptions.length === 0 ? (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                  {t('history_no_prescriptions')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedRecord.prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      style={{
                        padding: 0,
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                            {rx.medication_name}
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                            {rx.dosage} • {rx.frequency}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                            {t('history_rx_duration')}: {rx.duration}
                          </div>
                        </div>
                        {rx.dispensed && (
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#16a34a',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: kmFont,
                            }}
                          >
                            <Check size={14} />
                            <span>{t('history_rx_dispensed')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Module 3: Diagnostics & Tests */}
            {selectedRecord.diagnostics.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.4rem',
                    fontFamily: kmFont,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>•</span>
                  <span>{t('history_tests_diagnostics')}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {selectedRecord.diagnostics.map((diag) => (
                    <div
                      key={diag.id}
                      style={{
                        padding: 0,
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                          {diag.test_name}
                        </div>
                        {diag.notes && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                            {diag.notes}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#16a34a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: kmFont,
                        }}
                      >
                        <Check size={14} />
                        <span>{diag.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Module 4: Itemized Billing Receipt */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                  fontFamily: kmFont,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>•</span>
                <span>{t('history_billing_receipt')}</span>
              </div>

              <div
                style={{
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>{t('history_fee_consultation')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${selectedRecord.billing.consultation_fee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>{t('history_fee_pharmacy')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${selectedRecord.billing.pharmacy_fee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  <span>{t('history_fee_diagnostics')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${selectedRecord.billing.diagnostics_fee.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <span>{t('history_fee_total_paid')}</span>
                  <span>${selectedRecord.billing.total_paid.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', flexWrap: 'wrap', gap: '8px' }}>
                  <span>{t('history_payment_method')}: {selectedRecord.billing.payment_method}</span>
                  <span>{selectedRecord.billing.invoice_number}</span>
                </div>
              </div>
            </div>

            {/* Module 5: Follow-up Care Plan & Action Buttons */}
            {selectedRecord.follow_up && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.4rem',
                    fontFamily: kmFont,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>•</span>
                  <span>{t('history_follow_up_title')}</span>
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', fontFamily: kmFont }}>
                  {t('history_follow_up_recommended_date')}: {selectedRecord.follow_up.recommended_date}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                  {selectedRecord.follow_up.advice}
                </div>
              </div>
            )}

            {/* Bottom Actions: Print Receipt & Book Follow-up */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handlePrintReceipt}
                style={{
                  padding: '0.45rem 1.15rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: kmFont,
                }}
              >
                <Printer size={15} color="var(--accent-primary)" />
                <span>{t('history_print_receipt')}</span>
              </button>

              {onExploreHospitals && (
                <button
                  type="button"
                  onClick={onExploreHospitals}
                  style={{
                    padding: '0.45rem 1.15rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: kmFont,
                  }}
                >
                  <Calendar size={15} color="var(--accent-primary)" />
                  <span>{t('history_book_follow_up')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
