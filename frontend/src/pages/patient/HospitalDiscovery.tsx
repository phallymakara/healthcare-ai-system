import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
  formatSpecialty,
  formatCategory,
} from '../../i18n/formatters';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface HospitalDiscoveryProps {
  onTicketBooked: (ticket: any) => void;
  onNavigateToTriage?: () => void;
  onNavigateToTracker?: () => void;
}

export const HospitalDiscovery: React.FC<HospitalDiscoveryProps> = ({
  onTicketBooked,
}) => {
  const { language, t } = useLanguage();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Hospital' | 'Medical Clinic' | 'Animal Clinic'>('All');
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  // Booking Modal State & Field Validation
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadHospitals = async (query = '') => {
    setLoading(true);
    try {
      const url = query
        ? `${API_BASE}/patients/discovery/hospitals?q=${encodeURIComponent(query)}`
        : `${API_BASE}/patients/discovery/hospitals`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      }
    } catch {
      // Graceful fallback
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
    setNameError(null);
    setPhoneError(null);
    setFormError(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setFormError(null);

    let hasError = false;
    if (!patientName.trim()) {
      setNameError('Please enter your full name.');
      hasError = true;
    }
    if (!patientPhone.trim()) {
      setPhoneError('Please enter your phone number.');
      hasError = true;
    } else if (patientPhone.trim().length < 6) {
      setPhoneError('Please enter a valid phone number.');
      hasError = true;
    }

    if (hasError) return;

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
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim(),
        }),
      });

      if (!res.ok) {
        setFormError('Unable to reserve a ticket at this moment. Please try again.');
        return;
      }

      const ticket = await res.json();
      setBookingModalOpen(false);
      onTicketBooked(ticket);
    } catch {
      setFormError('Connection issue. Please check your network and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter((hosp) => {
    // 1. Category Filter
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Hospital') {
        if (hosp.category !== 'General Hospital' && hosp.category !== 'Hospital') {
          return false;
        }
      } else if (hosp.category !== selectedCategory) {
        return false;
      }
    }

    // 2. Search Query Filter
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const hospMatch = hosp.name?.toLowerCase().includes(q) || hosp.city?.toLowerCase().includes(q) || hosp.address?.toLowerCase().includes(q);
    const deptMatch = (hosp.departments || []).some(
      (d: any) => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q)
    );
    const serviceMatch = (hosp.services || []).some(
      (s: any) => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
    return hospMatch || deptMatch || serviceMatch;
  });

  // Dedicated Facility Services & Queues View
  if (selectedFacility) {
    return (
      <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Back Navigation Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={() => setSelectedFacility(null)}
            style={{
              padding: '0.4rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            }}
          >
            {language === 'km' ? '← ត្រឡប់ទៅបញ្ជីមន្ទីរពេទ្យ & គ្លីនិក' : '← Back to Facilities'}
          </button>
        </div>

        {/* Facility Detail Container */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
          boxShadow: 'none',
        }}>
          {/* Facility Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {formatFacilityName(selectedFacility.name, language)}
              </span>
              {selectedFacility.category && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}>
                  {formatCategory(selectedFacility.category, language)}
                </span>
              )}
              {selectedFacility.emergency_service_available && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '16px',
                  border: '1px solid #059669',
                  color: '#059669',
                  fontWeight: 500,
                }}>
                  {t('emergency_247')}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {selectedFacility.address || 'Phnom Penh'} {selectedFacility.phone ? `• ${selectedFacility.phone}` : ''}
            </div>
          </div>

          {/* Section 1: Clinical / Veterinary Departments & Live Queues */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.85rem' }}>
              {t('active_departments')}
            </div>

            {(selectedFacility.departments || []).length === 0 ? (
              <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {language === 'km' ? 'មិនមានផ្នែកវេជ្ជសាស្ត្រសកម្មសម្រាប់ថ្ងៃនេះទេ' : 'No active departments registered for this facility today.'}
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                {selectedFacility.departments.map((dept: any, idx: number) => (
                  <div
                    key={dept.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      padding: '0.95rem 1.25rem',
                      borderBottom: idx === selectedFacility.departments.length - 1 ? 'none' : '1px solid var(--border-color)',
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ minWidth: '240px', flex: '1.5' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {formatDepartmentName(dept.name, language)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {language === 'km' ? 'កូដផ្នែក' : 'Code'}: {dept.code || 'DEPT'} • {dept.floor_room || 'Room 101'}
                      </div>
                      {dept.doctors && dept.doctors.length > 0 && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {dept.doctors.map((doc: any, dIdx: number) => (
                            <div key={doc.id || dIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                                {formatDoctorName(doc.full_name, language)}
                              </span>
                              {doc.specialty && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                  ({formatSpecialty(doc.specialty, language)})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: '180px', flex: '1' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {language === 'km' ? 'ជួររង់ចាំផ្ទាល់' : 'Live Queue'}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-main)', marginTop: '2px' }}>
                        {language === 'km'
                          ? `${dept.waiting_count} នាក់ក្នុងជួរ • ~${dept.estimated_wait_minutes} នាទីរង់ចាំ`
                          : `${dept.waiting_count} in line • ~${dept.estimated_wait_minutes} mins wait`}
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => handleOpenBooking(selectedFacility, dept)}
                        style={{
                          padding: '0.4rem 0.95rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          background: 'transparent',
                          border: '1px solid var(--text-main)',
                          borderRadius: '16px',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          whiteSpace: 'nowrap',
                          fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                        }}
                      >
                        {t('book_digital_ticket')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Healthcare & Veterinary Services Roster */}
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.85rem' }}>
              {t('services_offered')}
            </div>

            {(selectedFacility.services || []).length === 0 ? (
              <div style={{ padding: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {language === 'km' ? 'សេវាពិគ្រោះជំងឺទូទៅអាចរកបាននៅបញ្ជរបម្រើភ្ញៀវ' : 'Standard outpatient consultation available at facility reception.'}
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', background: '#fafafa' }}>
                      <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {language === 'km' ? 'ឈ្មោះសេវាកម្ម' : 'Service Name'}
                      </th>
                      <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {language === 'km' ? 'ព័ត៌មានពិពណ៌នា' : 'Description'}
                      </th>
                      <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {language === 'km' ? 'រយៈពេល' : 'Duration'}
                      </th>
                      <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>
                        {language === 'km' ? 'តម្លៃ (USD)' : 'Price (USD)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFacility.services.map((srv: any, sIdx: number) => (
                      <tr key={srv.id} style={{ borderBottom: sIdx === selectedFacility.services.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 500, color: 'var(--text-main)' }}>
                          {srv.name}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {srv.description || (language === 'km' ? 'សេវាកម្មវេជ្ជសាស្ត្រស្តង់ដារ' : 'Standard medical service')}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          ~{srv.duration_minutes} {language === 'km' ? 'នាទី' : 'mins'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-main)', fontWeight: 400, textAlign: 'right' }}>
                          ${Number(srv.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {bookingModalOpen && selectedHospital && selectedDept && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              boxShadow: 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {t('confirm_booking')}
                </h3>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {formatFacilityName(selectedHospital.name, language)} • {formatDepartmentName(selectedDept.name, language)} ({selectedDept.code || 'DEPT'})
              </div>

              <form onSubmit={handleConfirmBooking}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                    {t('patient_full_name')}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះពេញ' : 'Enter full name'}
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      setNameError(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: nameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                    }}
                  />
                  {nameError && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                      {nameError}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                    {t('phone_number')}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'km' ? 'បញ្ចូលលេខទូរស័ព្ទ' : 'Enter phone number'}
                    value={patientPhone}
                    onChange={(e) => {
                      setPatientPhone(e.target.value);
                      setPhoneError(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: phoneError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {phoneError && (
                    <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                      {phoneError}
                    </div>
                  )}
                </div>

                <div style={{
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1.25rem',
                }}>
                  {language === 'km'
                    ? `ពេលវេលារង់ចាំប្រហែល៖ ~${selectedDept.estimated_wait_minutes} នាទី (${selectedDept.waiting_count} នាក់ក្នុងជួរ)`
                    : `Current estimated wait: ~${selectedDept.estimated_wait_minutes} mins (${selectedDept.waiting_count} in line)`}
                </div>

                {formError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    style={{
                      padding: '0.5rem 0.9rem',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                    }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    style={{
                      padding: '0.5rem 1.1rem',
                      background: 'transparent',
                      border: '1px solid var(--text-main)',
                      borderRadius: '4px',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: bookingLoading ? 'not-allowed' : 'pointer',
                      opacity: bookingLoading ? 0.6 : 1,
                      boxShadow: 'none',
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                    }}
                  >
                    {bookingLoading ? (language === 'km' ? 'កំពុងកក់...' : 'Reserving...') : t('confirm_ticket_btn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Two-Column Grid Facilities List View
  return (
    <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Top Search Controls & Category Filter Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '560px', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder={t('discovery_search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '0.55rem 0.85rem',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: 'var(--text-main)',
              boxShadow: 'none',
              outline: 'none',
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.55rem 1rem',
              background: 'transparent',
              border: '1px solid var(--text-main)',
              borderRadius: '4px',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'none',
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            }}
          >
            {language === 'km' ? 'ស្វែងរក' : 'Search'}
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadHospitals('');
              }}
              style={{
                padding: '0.55rem 0.85rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: 'none',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {language === 'km' ? 'សម្អាត' : 'Clear'}
            </button>
          )}
        </form>

        {/* Category Selection Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: t('cat_all'), value: 'All' },
            { label: t('cat_hospitals'), value: 'Hospital' },
            { label: t('cat_medical_clinics'), value: 'Medical Clinic' },
            { label: t('cat_animal_clinics'), value: 'Animal Clinic' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value as any)}
              style={{
                padding: '0.35rem 0.95rem',
                fontSize: '0.8rem',
                fontWeight: selectedCategory === cat.value ? 600 : 400,
                background: 'transparent',
                border: selectedCategory === cat.value ? '1px solid var(--text-main)' : '1px solid var(--border-color)',
                borderRadius: 0,
                color: selectedCategory === cat.value ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: 'none',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Facility 2-Column Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {language === 'km' ? 'កំពុងដំណើរការ...' : 'Loading facilities...'}
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '3rem 1rem',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          boxShadow: 'none',
        }}>
          {language === 'km' ? 'មិនមានទីតាំងត្រូវនឹងការស្វែងរករបស់អ្នកឡើយ' : 'No facilities found matching your selected category or query.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
          rowGap: '0.35rem',
          columnGap: '0.75rem',
          alignContent: 'start',
          alignItems: 'start',
          gridAutoRows: 'max-content',
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
        }}>
          {filteredHospitals.map((hosp) => (
            <button
              key={hosp.id}
              onClick={() => setSelectedFacility(hosp)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem 1rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-main)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {formatFacilityName(hosp.name, language)}
                </span>
                {hosp.category && (
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}>
                    {formatCategory(hosp.category, language)}
                  </span>
                )}
                {hosp.emergency_service_available && (
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '16px',
                    border: '1px solid #059669',
                    color: '#059669',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}>
                    {t('emergency_247')}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.3 }}>
                {hosp.address || 'Phnom Penh'} {hosp.phone ? `• ${hosp.phone}` : ''}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.3 }}>
                {language === 'km'
                  ? `${(hosp.departments || []).length} ផ្នែកវេជ្ជសាស្ត្រសកម្ម • ${(hosp.services || []).length} សេវាកម្ម`
                  : `${(hosp.departments || []).length} active departments • ${(hosp.services || []).length} medical services`}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
