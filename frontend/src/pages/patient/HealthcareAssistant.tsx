import React, { useState } from 'react';
import { AuthService } from '../../services/auth';
import { 
  Send, 
  Stethoscope, 
  Clock, 
  Building2, 
  Users, 
  X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface HealthcareAssistantProps {
  onTicketBooked: (ticket: any) => void;
}

export const HealthcareAssistant: React.FC<HealthcareAssistantProps> = ({ onTicketBooked }) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Booking Modal State from recommendation
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || symptoms.trim().length < 3) {
      setInputError('Please describe your symptoms in a few words.');
      return;
    }

    setInputError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/assistant/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptoms.trim() }),
      });

      if (!res.ok) {
        setInputError('Unable to evaluate symptoms. Please describe with different words.');
        return;
      }
      setResult(await res.json());
    } catch {
      setInputError('Connection issue. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (match: any) => {
    const user = AuthService.getStoredUser();
    setSelectedMatch(match);
    setPatientName(user?.full_name || '');
    setPatientPhone(user?.phone_number || '');
    setNameError(null);
    setPhoneError(null);
    setBookingFormError(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setBookingFormError(null);

    let hasErr = false;
    if (!patientName.trim()) {
      setNameError('Please enter your full name');
      hasErr = true;
    }
    if (!patientPhone.trim()) {
      setPhoneError('Please enter your phone number');
      hasErr = true;
    } else if (patientPhone.trim().length < 6) {
      setPhoneError('Please enter a valid phone number');
      hasErr = true;
    }

    if (hasErr) return;

    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({
          hospital_id: selectedMatch.hospital_id,
          department_id: selectedMatch.department_id,
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim(),
        }),
      });

      if (!res.ok) {
        setBookingFormError('Unable to reserve ticket right now. Please try again.');
        return;
      }

      const ticket = await res.json();
      setBookingModalOpen(false);
      onTicketBooked(ticket);
    } catch {
      setBookingFormError('Connection issue. Please check your network and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Stethoscope size={26} color="var(--accent-primary)" /> Symptom Triage & Clinic Matcher
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Describe what you are feeling to identify the right medical department and find partner clinics with the shortest waiting line today.
        </p>
      </div>

      {/* Input Form */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleTriageSubmit}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            What symptoms are you currently experiencing?
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Sharp pain in chest when taking deep breaths, dizziness and mild shortness of breath..."
            value={symptoms}
            onChange={(e) => { setSymptoms(e.target.value); setInputError(null); }}
            className={inputError ? 'input-error' : ''}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              resize: 'vertical',
              marginBottom: '4px',
            }}
          />
          {/* Inline Error at field location */}
          {inputError && <span className="error-text" style={{ marginBottom: '0.75rem' }}>{inputError}</span>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Medical disclaimer: This assessment is informational and does not replace professional clinical diagnosis.
            </span>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={15} /> {loading ? 'Analyzing...' : 'Analyze Symptoms'}
            </button>
          </div>
        </form>
      </div>

      {/* Triage Results View */}
      {result && (
        <div className="glass-card" style={{ border: '1px solid var(--border-highlight)' }}>
          {/* Header & Urgency */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Recommended Department
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }}>
                {result.recommended_specialty}
              </h2>
            </div>
            <div>
              <span className={`badge ${result.urgency_level === 'EMERGENCY' ? '' : result.urgency_level === 'URGENT' ? 'badge-degraded' : 'badge-healthy'}`} style={result.urgency_level === 'EMERGENCY' ? { border: '1px solid #ef4444', color: '#ef4444' } : {}}>
                {result.urgency_level === 'EMERGENCY' ? '⚠️ Medical Emergency' : `${result.urgency_level} Priority`}
              </span>
            </div>
          </div>

          {/* Clinical Advice */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <p style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>{result.clinical_summary}</p>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <strong>Clinical Guidance:</strong> {result.advice}
            </div>
          </div>

          {/* Shortest Wait Hospital Matches */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} color="var(--accent-cyan)" /> Clinics with Shortest Wait Times for {result.recommended_specialty}
            </h3>

            {result.matching_hospitals.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                No active clinics currently available for this specialty today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.matching_hospitals.map((m: any) => (
                  <div
                    key={m.hospital_id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.hospital_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {m.department_name} • {m.address || 'Phnom Penh'}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={13} /> {m.waiting_patients} waiting
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                          <Clock size={13} /> ~{m.estimated_wait_minutes} mins wait
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenBooking(m)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
                    >
                      Reserve Ticket
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {bookingModalOpen && selectedMatch && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              onClick={() => setBookingModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              Reserve Recommended Slot
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {selectedMatch.hospital_name} • <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{selectedMatch.department_name}</span>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Patient Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={patientName}
                  onChange={(e) => { setPatientName(e.target.value); setNameError(null); }}
                  className={nameError ? 'input-error' : ''}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                  }}
                />
                {nameError && <span className="error-text">{nameError}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={patientPhone}
                  onChange={(e) => { setPatientPhone(e.target.value); setPhoneError(null); }}
                  className={phoneError ? 'input-error' : ''}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                  }}
                />
                {phoneError && <span className="error-text">{phoneError}</span>}
              </div>

              <div style={{
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}>
                Current estimated wait: <strong style={{ color: 'var(--accent-primary)' }}>~{selectedMatch.estimated_wait_minutes} mins</strong> ({selectedMatch.waiting_count} waiting).
              </div>

              {bookingFormError && <span className="error-text">{bookingFormError}</span>}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {bookingLoading ? 'Reserving...' : 'Confirm Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
