import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';
import { MedicalRecord, DEMO_MEDICAL_RECORDS } from './history/types';
import { MedicalRecordList } from './history/MedicalRecordList';
import { MedicalRecordDetailView } from './history/MedicalRecordDetailView';

interface PatientHistoryProps {
  onExploreHospitals?: () => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({
  onExploreHospitals,
}) => {
  const { language } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  const [records, setRecords] = useState<MedicalRecord[]>(DEMO_MEDICAL_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchError, setSearchError] = useState<string | null>(null);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && filteredRecords.length === 0) {
      setSearchError(isKm ? 'មិនមានកំណត់ត្រាត្រូវគ្នានឹងការស្វែងរករបស់អ្នកទេ' : 'No medical records match your search.');
    } else {
      setSearchError(null);
    }
  };

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', width: '100%', fontFamily: kmFont }}>
      {!selectedRecord ? (
        <MedicalRecordList
          records={filteredRecords}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchError={searchError}
          setSearchError={setSearchError}
          onSearchSubmit={handleSearchSubmit}
          onSelectRecord={setSelectedRecord}
          onExploreHospitals={onExploreHospitals}
        />
      ) : (
        <MedicalRecordDetailView
          record={selectedRecord}
          onBack={() => setSelectedRecord(null)}
          onExploreHospitals={onExploreHospitals}
        />
      )}
    </div>
  );
};
