import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { Search, Building2, Clock, X, Users, MapPin, Phone } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface HospitalDiscoveryProps {
  onTicketBooked: (ticket: any) => void;
}

export const HospitalDiscovery: React.FC<HospitalDiscoveryProps> = ({ onTicketBooked }) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const loadHospitals = async (query = '') => {
    setLoading(true);
    try {
      const url = query
        ? `${API_BASE}/patients/discovery/hospitals?q=${encodeURIComponent(query)}`
        : `${API_BASE}/patients/discovery/hospitals`;
      const res = await fetch(url);
      if (res.ok) {
        setHospitals(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHospitals(searchQuery);
  };

  const handleOpenBooking = (hosp: any, dept: any) => {
    const user = AuthService.getStoredUser();
    setSelectedHospital(hosp);
    setSelectedDept(dept);
    setPatientName(user?.full_name || '');
    setPatientPhone(user?.phone_number || '');
    setBookingError(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingLoading(true);

    try {
      const res = await fetch(`${API_BASE}/tickets/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({
          hospital_id: selectedHospital.id,
          department_id: selectedDept.id,
          patient_name: patientName.trim() || undefined,
          patient_phone: patientPhone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setBookingError('Unable to reserve ticket for this queue. Please try again.');
        return;
      }

      const ticket = await res.json();
      setBookingModalOpen(false);
      onTicketBooked(ticket);
    } catch (err: any) {
      setBookingError('Network connection issue. Please check your connection and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div>
      {/* Search Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Find Hospitals & Live Queues
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Search partner clinics, compare real-time waiting times, and reserve your place in line before arriving.
        </p>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '640px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search by hospital name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            />
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Hospitals List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          Loading hospital queues...
        </div>
      ) : hospitals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          No hospitals found matching your search.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {hospitals.map((hosp) => (
            <div key={hosp.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Building2 size={20} color="var(--accent-primary)" />
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{hosp.name}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {hosp.address && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {hosp.address}
                      </span>
                    )}
                    {hosp.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={14} /> {hosp.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Department Queues Grid */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
                  Available Outpatient Departments & Wait Times
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {hosp.departments.map((dept: any) => (
                    <div
                      key={dept.id}
                      style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{dept.name}</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {dept.code}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={14} /> {dept.waiting_count} waiting
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                            <Clock size={14} /> ~{dept.estimated_wait_minutes} mins
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenBooking(hosp, dept)}
                        className="btn btn-outline"
                        style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                      >
                        Reserve Ticket
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {bookingModalOpen && selectedHospital && selectedDept && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.75)',
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
              Reserve Queue Ticket
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {selectedHospital.name} • <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{selectedDept.name}</span>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Patient Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dararith Ken"
                  value={patientName}
                  onChange={(e) => { setPatientName(e.target.value); setBookingError(null); }}
                  required
                  className={bookingError ? 'input-error' : ''}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+855..."
                  value={patientPhone}
                  onChange={(e) => { setPatientPhone(e.target.value); setBookingError(null); }}
                  required
                  className={bookingError ? 'input-error' : ''}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
                {/* Inline Error at field location */}
                {bookingError && <span className="error-text">{bookingError}</span>}
              </div>

              <div style={{
                padding: '0.85rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}>
                ⏱️ Current estimated wait: <strong style={{ color: 'var(--accent-primary)' }}>~{selectedDept.estimated_wait_minutes} mins</strong> ({selectedDept.waiting_count} patients in queue).
              </div>

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
