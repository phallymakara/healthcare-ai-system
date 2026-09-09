import React, { useEffect, useState, useMemo } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { Building2, Search, ExternalLink } from 'lucide-react';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
  formatSpecialty,
  formatCategory,
} from '../../i18n/formatters';
import { API_BASE } from '../../services/api';
import { AppointmentSlotPicker } from '../../components/AppointmentSlotPicker';

const getGoogleMapsUrl = (facility: any) => {
  if (facility?.latitude && facility?.longitude) {
    return `https://maps.google.com/?q=${facility.latitude},${facility.longitude}`;
  }
  const query = facility?.address || facility?.name || 'Phnom Penh';
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
};

const getGoogleMapsEmbedUrl = (facility: any, isKm: boolean) => {
  const q = facility?.latitude && facility?.longitude
    ? `${facility.latitude},${facility.longitude}`
    : encodeURIComponent(facility?.address || facility?.name || 'Phnom Penh');
  return `https://maps.google.com/maps?q=${q}&hl=${isKm ? 'km' : 'en'}&z=16&output=embed`;
};

const SimulatedHospitalLogo: React.FC<{ name: string; logoUrl?: string; size?: number }> = ({
  name,
  logoUrl,
  size = 68,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const initials = useMemo(() => {
    if (!name) return 'HP';
    const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (clean.slice(0, 2) || 'HP').toUpperCase();
  }, [name]);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '50%',
        border: '1px solid var(--border-color)',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        gap: '2px',
        boxSizing: 'border-box',
      }}
    >
      <Building2 size={Math.round(size * 0.42)} color="var(--accent-primary, #185339)" strokeWidth={1.8} />
      <span
        style={{
          fontSize: size >= 60 ? '0.75rem' : '0.6rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
    </div>
  );
};

const SimulatedDoctorAvatar: React.FC<{ name: string; photoUrl?: string; size?: number }> = ({
  name,
  photoUrl,
  size = 38,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const initials = useMemo(() => {
    if (!name) return 'DR';
    const clean = name.replace(/^(Dr\.|Doctor|Dr)\s+/i, '').replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (clean.slice(0, 2) || 'DR').toUpperCase();
  }, [name]);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '50%',
        border: '1px solid var(--border-color)',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--accent-primary, #185339)',
        fontWeight: 600,
        fontSize: '0.72rem',
        letterSpacing: '0.04em',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
      title={name}
    >
      {initials}
    </div>
  );
};

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

  const TIME_SLOTS = [
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:30 PM - 02:30 PM',
    '02:30 PM - 03:30 PM',
    '03:30 PM - 04:30 PM',
    '04:30 PM - 05:30 PM',
  ];

  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  // Booking Modal State & Field Validation
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(getTodayDateStr());
  const [appointmentTime, setAppointmentTime] = useState(TIME_SLOTS[1]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
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
    setAppointmentDate(getTodayDateStr());
    setAppointmentTime(TIME_SLOTS[1]);
    setNameError(null);
    setPhoneError(null);
    setDateError(null);
    setFormError(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setDateError(null);
    setFormError(null);

    let hasError = false;
    if (!patientName.trim()) {
      setNameError(language === 'km' ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Please enter your full name.');
      hasError = true;
    }
    if (!patientPhone.trim()) {
      setPhoneError(language === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក' : 'Please enter your phone number.');
      hasError = true;
    } else if (patientPhone.trim().length < 6) {
      setPhoneError(language === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ' : 'Please enter a valid phone number.');
      hasError = true;
    }
    if (!appointmentDate) {
      setDateError(language === 'km' ? 'សូមជ្រើសរើសកាលបរិច្ឆេទ' : 'Please select an appointment date.');
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
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setFormError(
          errData?.detail ||
          (language === 'km'
            ? 'មិនអាចកក់សំបុត្របានទេនៅពេលនេះ។ សូមព្យាយាមម្តងទៀត។'
            : 'Unable to reserve a ticket at this moment. Please try again.')
        );
        return;
      }

      const ticket = await res.json();
      setBookingModalOpen(false);
      onTicketBooked(ticket);
    } catch {
      setFormError(language === 'km' ? 'បញ្ហាតភ្ជាប់បណ្តាញ។ សូមពិនិត្យមើលបណ្តាញរបស់អ្នកហើយព្យាយាមម្តងទៀត។' : 'Connection issue. Please check your network and try again.');
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
      <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: '1060px', margin: '0 auto' }}>
        {/* Back Navigation Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={() => setSelectedFacility(null)}
            style={{
              padding: '0.2rem 0',
              fontSize: '0.95rem',
              fontWeight: 500,
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            }}
          >
            {language === 'km' ? '← ត្រឡប់ទៅបញ្ជីមន្ទីរពេទ្យ & គ្លីនិក' : '← Back to Facilities'}
          </button>
        </div>

        {/* Facility Detail View - Main Container & Horizontal Lines Removed */}
        <div style={{
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}>
          {/* Facility Header Card Container */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.4rem 1.65rem',
            display: 'flex',
            alignItems: 'center',
            boxShadow: 'none',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                  {formatFacilityName(selectedFacility.name, language)}
                </span>
                {selectedFacility.category && (
                  <span style={{
                    fontSize: '0.85rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  }}>
                    {formatCategory(selectedFacility.category, language)}
                  </span>
                )}
                {selectedFacility.emergency_service_available && (
                  <span style={{
                    fontSize: '0.85rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid #059669',
                    color: '#059669',
                    fontWeight: 600,
                    fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  }}>
                    {t('emergency_247')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                <div style={{ fontSize: '0.98rem', color: 'var(--text-muted)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {t('hotline_contact')}{' '}
                  </span>
                  {selectedFacility.phone || (language === 'km' ? 'មិនមាន' : 'N/A')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.98rem', color: 'var(--text-muted)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                  <span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      {t('location_label')}{' '}
                    </span>
                    {selectedFacility.address || selectedFacility.city || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh')}
                  </span>
                  <a
                    href={getGoogleMapsUrl(selectedFacility)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.24rem 0.7rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--primary-color, #0284c7)',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-full)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-color, #0284c7)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    <ExternalLink size={13} />
                    <span>{t('btn_open_google_maps')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Clinical / Veterinary Departments & Live Queues */}
          <div style={{ padding: 0, borderBottom: 'none' }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1.1rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
              {t('active_departments')}
            </div>

            {(selectedFacility.departments || []).length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem 1.65rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  boxShadow: 'none',
                }}
              >
                {language === 'km' ? 'មិនមានផ្នែកវេជ្ជសាស្ត្រសកម្មសម្រាប់ថ្ងៃនេះទេ' : 'No active departments registered for this facility today.'}
              </div>
            ) : (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '0.5rem 1.65rem',
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {selectedFacility.departments.map((dept: any, idx: number) => {
                  const uniqueDoctors = (dept.doctors || []).filter(
                    (doc: any, i: number, arr: any[]) => arr.findIndex((d: any) => d.id === doc.id) === i
                  );
                  const isLast = idx === selectedFacility.departments.length - 1;

                  return (
                    <div
                      key={dept.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.25rem',
                        padding: '1.35rem 0',
                        borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
                        background: 'transparent',
                        transition: 'background-color 0.12s ease',
                      }}
                    >
                      <div style={{ minWidth: '260px', flex: '1.5' }}>
                        <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                          {formatDepartmentName(dept.name, language)}
                        </div>
                        <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                          {language === 'km' ? 'កូដផ្នែក' : 'Code'}: {dept.code || 'DEPT'} • {dept.floor_room || 'Room 101'}
                        </div>
                        {uniqueDoctors.length > 0 && (
                          <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {uniqueDoctors.map((doc: any, dIdx: number) => (
                              <div key={doc.id || dIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <SimulatedDoctorAvatar name={doc.full_name} photoUrl={doc.photo_url} size={44} />
                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                                  <span style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                                    {formatDoctorName(doc.full_name, language)}
                                  </span>
                                  {doc.specialty && (
                                    <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                                      {formatSpecialty(doc.specialty, language)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: '220px', flex: '1' }}>
                        <div style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                        }}>
                          {language === 'km' ? 'ម៉ោងពិគ្រោះជំងឺ' : 'Consultation Hours'}
                        </div>
                        <div style={{
                          fontSize: '1.02rem',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          marginTop: '4px',
                          fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                        }}>
                          {language === 'km' ? '០៨:០០ ព្រឹក - ០៥:៣០ ល្ងាច' : '08:00 AM – 05:30 PM'}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#059669',
                          fontWeight: 500,
                          marginTop: '3px',
                          fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                        }}>
                          {language === 'km' ? 'ទទួលការកក់តាម App & មកផ្ទាល់' : 'App Booking & Walk-In Accepted'}
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => handleOpenBooking(selectedFacility, dept)}
                          style={{
                            padding: '0.52rem 1.25rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            background: 'transparent',
                            border: '1px solid var(--text-main)',
                            borderRadius: 'var(--radius-full)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            boxShadow: 'none',
                            whiteSpace: 'nowrap',
                            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--text-main)';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-main)';
                          }}
                        >
                          {t('book_digital_ticket')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Healthcare & Veterinary Services Roster */}
          <div style={{ padding: 0 }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1.1rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
              {t('services_offered')}
            </div>

            {(selectedFacility.services || []).length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem 1.65rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  boxShadow: 'none',
                }}
              >
                {language === 'km' ? 'សេវាពិគ្រោះជំងឺទូទៅអាចរកបាននៅបញ្ជរបម្រើភ្ញៀវ' : 'Standard outpatient consultation available at facility reception.'}
              </div>
            ) : (
              <div
                className="responsive-table-wrapper"
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'none',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', background: 'transparent' }}>
                      <th style={{ padding: '0.95rem 1.35rem', fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {language === 'km' ? 'ឈ្មោះសេវាកម្ម' : 'Service Name'}
                      </th>
                      <th style={{ padding: '0.95rem 1.35rem', fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {language === 'km' ? 'ព័ត៌មានពិពណ៌នា' : 'Description'}
                      </th>
                      <th style={{ padding: '0.95rem 1.35rem', fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {language === 'km' ? 'រយៈពេល' : 'Duration'}
                      </th>
                      <th style={{ padding: '0.95rem 1.35rem', fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>
                        {language === 'km' ? 'តម្លៃ (USD)' : 'Price (USD)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFacility.services.map((srv: any, idx: number) => {
                      const isLast = idx === selectedFacility.services.length - 1;
                      return (
                        <tr
                          key={srv.id}
                          style={{
                            borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
                            transition: 'background-color 0.12s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '1rem 1.35rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '1.02rem' }}>
                            {srv.name}
                          </td>
                          <td style={{ padding: '1rem 1.35rem', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                            {srv.description || (language === 'km' ? 'សេវាកម្មវេជ្ជសាស្ត្រស្តង់ដារ' : 'Standard medical service')}
                          </td>
                          <td style={{ padding: '1rem 1.35rem', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                            ~{srv.duration_minutes} {language === 'km' ? 'នាទី' : 'mins'}
                          </td>
                          <td style={{ padding: '1rem 1.35rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.02rem', textAlign: 'right' }}>
                            ${Number(srv.price).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Facility Location & Interactive Google Map Container */}
          <div style={{ padding: 0 }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1.1rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
              {language === 'km' ? 'ទីតាំង និងផែនទី' : 'Location & Map'}
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.5rem 1.65rem',
                boxShadow: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                    {formatFacilityName(selectedFacility.name, language)}
                  </div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5, fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                    {selectedFacility.address || 'No. 3, Preah Monivong Blvd, Srah Chak, Daun Penh, Phnom Penh'}
                  </div>
                  {(selectedFacility.latitude && selectedFacility.longitude) && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {selectedFacility.latitude}, {selectedFacility.longitude}
                    </div>
                  )}
                </div>

                <div>
                  <a
                    href={getGoogleMapsUrl(selectedFacility)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.52rem 1.15rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      background: 'transparent',
                      border: '1px solid var(--text-main)',
                      borderRadius: 'var(--radius-full)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      whiteSpace: 'nowrap',
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--text-main)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>{t('btn_open_google_maps')}</span>
                  </a>
                </div>
              </div>

              {/* Interactive Google Map Embed */}
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  background: '#f8fafc',
                }}
              >
                <iframe
                  title="Facility Location Google Map"
                  width="100%"
                  height="280"
                  style={{ border: 'none', display: 'block' }}
                  loading="lazy"
                  src={getGoogleMapsEmbedUrl(selectedFacility, language === 'km')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {bookingModalOpen && selectedHospital && selectedDept && (
          <div className="responsive-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setBookingModalOpen(false); }}>
            <div className="responsive-modal-card" style={{ maxWidth: '520px', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
              <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                    {t('confirm_booking')}
                  </h3>
                  <button
                    onClick={() => setBookingModalOpen(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '1.35rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                  {formatFacilityName(selectedHospital.name, language)} • {formatDepartmentName(selectedDept.name, language)} ({selectedDept.code || 'DEPT'})
                </div>

                <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
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
                        padding: '0.72rem 0.85rem',
                        border: nameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '0.95rem',
                        boxShadow: 'none',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      }}
                    />
                    {nameError && (
                      <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                        {nameError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
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
                        padding: '0.72rem 0.85rem',
                        border: phoneError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '0.95rem',
                        boxShadow: 'none',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      }}
                    />
                    {phoneError && (
                      <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                        {phoneError}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                        {t('appointment_date')}
                      </label>
                      <input
                        type="date"
                        min={getTodayDateStr()}
                        value={appointmentDate}
                        onChange={(e) => {
                          setAppointmentDate(e.target.value);
                          setDateError(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.72rem 0.85rem',
                          border: dateError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                          borderRadius: '4px',
                          fontSize: '0.95rem',
                          boxShadow: 'none',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#ffffff',
                          color: 'var(--text-main)',
                          fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                        }}
                      />
                      {dateError && (
                        <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                          {dateError}
                        </div>
                      )}
                    </div>

                    {/* Real-time Live Appointment Time Slot Grid */}
                    <AppointmentSlotPicker
                      hospitalId={selectedHospital?.id}
                      departmentId={selectedDept?.id}
                      selectedDate={appointmentDate}
                      selectedSlot={appointmentTime}
                      onSelectSlot={(slot) => {
                        setAppointmentTime(slot);
                        if (formError) setFormError(null);
                      }}
                      onSlotError={(err) => setFormError(err)}
                    />
                  </div>

                  {formError && (
                    <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                      {formError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setBookingModalOpen(false)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        fontSize: '0.98rem',
                        fontWeight: 500,
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
                        padding: '0.75rem 1.45rem',
                        background: 'transparent',
                        border: '1px solid var(--text-main)',
                        borderRadius: '4px',
                        color: 'var(--text-main)',
                        fontSize: '0.98rem',
                        fontWeight: 600,
                        cursor: bookingLoading ? 'not-allowed' : 'pointer',
                        boxShadow: 'none',
                        fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      }}
                    >
                      {bookingLoading ? t('chat_booking_saving') : t('confirm')}
                    </button>
                  </div>
                </form>
              </div>
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
        <form
          onSubmit={handleSearchSubmit}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '640px',
            marginBottom: '1.15rem',
          }}
        >
          <input
            type="text"
            className="input-search-rounded"
            placeholder={t('discovery_search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: searchQuery
                ? '0.74rem 10.5rem 0.74rem 1.35rem'
                : '0.74rem 7.5rem 0.74rem 1.35rem',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.94rem',
              color: 'var(--text-main)',
              boxShadow: 'none',
              outline: 'none',
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              boxSizing: 'border-box',
            }}
          />

          {/* Buttons inside at the end of the search input field */}
          <div
            style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadHospitals('');
                }}
                style={{
                  padding: '0.42rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {language === 'km' ? 'សម្អាត' : 'Clear'}
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '0.52rem 1.15rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: 'var(--radius-full)',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Search size={15} />
              <span>{language === 'km' ? 'ស្វែងរក' : 'Search'}</span>
            </button>
          </div>
        </form>

        {/* Category Selection Tabs */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                padding: '0.5rem 1.15rem',
                fontSize: '0.96rem',
                fontWeight: selectedCategory === cat.value ? 700 : 500,
                background: selectedCategory === cat.value ? 'var(--accent-primary)' : 'transparent',
                border: selectedCategory === cat.value ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                color: selectedCategory === cat.value ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: 'none',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                transition: 'all 0.15s ease',
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
          borderRadius: '16px',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          boxShadow: 'none',
        }}>
          {language === 'km' ? 'មិនមានទីតាំងត្រូវនឹងការស្វែងរករបស់អ្នកឡើយ' : 'No facilities found matching your selected category or query.'}
        </div>
      ) : (
        <div className="discovery-facilities-grid">
          {filteredHospitals.map((hosp) => (
            <button
              key={hosp.id}
              className="hospital-facility-card"
              onClick={() => setSelectedFacility(hosp)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                width: '100%',
                height: '100%',
                textAlign: 'left',
                padding: '1.1rem 1.25rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: 'none',
                minWidth: 0,
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-main)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <SimulatedHospitalLogo name={hosp.name} logoUrl={hosp.logo_url} size={54} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {/* Row 1: Facility Name */}
                <div style={{
                  fontSize: '1.08rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  lineHeight: 1.35,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}>
                  {formatFacilityName(hosp.name, language)}
                </div>

                {/* Row 2: Hotline Contact */}
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {t('hotline_contact')}{' '}
                  </span>
                  {hosp.phone || (language === 'km' ? 'មិនមាន' : 'N/A')}
                </div>

                {/* Row 3: Location */}
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  }}
                  title={hosp.address || hosp.city || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh')}
                >
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {t('location_label')}{' '}
                  </span>
                  {hosp.address || hosp.city || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
