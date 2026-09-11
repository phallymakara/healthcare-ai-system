import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
  formatSpecialty,
  formatCategory,
} from '../../../i18n/formatters';
import {
  getGoogleMapsUrl,
  getGoogleMapsEmbedUrl,
  SimulatedDoctorAvatar,
} from './discoveryUtils';

interface FacilityDetailViewProps {
  selectedFacility: any;
  onBack: () => void;
  onOpenBooking: (hosp: any, dept: any) => void;
}

export const FacilityDetailView: React.FC<FacilityDetailViewProps> = ({
  selectedFacility,
  onBack,
  onOpenBooking,
}) => {
  const { language, t } = useLanguage();
  const kmFont = language === 'km' ? 'var(--font-khmer)' : 'inherit';

  return (
    <div className="facility-detail-animate" style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: '1060px', margin: '0 auto' }}>
      {/* Back Navigation Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn-back-nav"
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            fontFamily: kmFont,
          }}
        >
          <span className="arrow-icon" style={{ fontSize: '1.1rem' }}>←</span>
          <span>{language === 'km' ? 'ត្រឡប់ទៅបញ្ជីមន្ទីរពេទ្យ & គ្លីនិក' : 'Back to Facilities'}</span>
        </button>
      </div>

      <div
        style={{
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
        }}
      >
        {/* Facility Header Card Container */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.4rem 1.65rem',
            display: 'flex',
            alignItems: 'center',
            boxShadow: 'none',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                {formatFacilityName(selectedFacility.name, language)}
              </span>
              {selectedFacility.category && (
                <span
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontFamily: kmFont,
                  }}
                >
                  {formatCategory(selectedFacility.category, language)}
                </span>
              )}
              {selectedFacility.emergency_service_available && (
                <span
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid #059669',
                    color: '#059669',
                    fontWeight: 600,
                    fontFamily: kmFont,
                  }}
                >
                  {t('emergency_247')}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <div style={{ fontSize: '0.98rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  {t('hotline_contact')}{' '}
                </span>
                {selectedFacility.phone || (language === 'km' ? 'មិនមាន' : 'N/A')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.98rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
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
                    fontFamily: kmFont,
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

        {/* Section 1: Clinical Departments */}
        <div style={{ padding: 0, borderBottom: 'none' }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1.1rem', fontFamily: kmFont }}>
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
                fontFamily: kmFont,
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
                      <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                        {formatDepartmentName(dept.name, language)}
                      </div>
                      <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                        {language === 'km' ? 'កូដផ្នែក' : 'Code'}: {dept.code || 'DEPT'} • {dept.floor_room || 'Room 101'}
                      </div>
                      {uniqueDoctors.length > 0 && (
                        <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {uniqueDoctors.map((doc: any, dIdx: number) => (
                            <div key={doc.id || dIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <SimulatedDoctorAvatar name={doc.full_name} photoUrl={doc.photo_url} size={44} />
                              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                                <span style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                                  {formatDoctorName(doc.full_name, language)}
                                </span>
                                {doc.specialty && (
                                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
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
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          fontFamily: kmFont,
                        }}
                      >
                        {language === 'km' ? 'ម៉ោងពិគ្រោះជំងឺ' : 'Consultation Hours'}
                      </div>
                      <div
                        style={{
                          fontSize: '1.02rem',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          marginTop: '4px',
                          fontFamily: kmFont,
                        }}
                      >
                        {language === 'km' ? '០៨:០០ ព្រឹក - ០៥:៣០ ល្ងាច' : '08:00 AM – 05:30 PM'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: '#059669',
                          fontWeight: 500,
                          marginTop: '3px',
                          fontFamily: kmFont,
                        }}
                      >
                        {language === 'km' ? 'ទទួលការកក់តាម App & មកផ្ទាល់' : 'App Booking & Walk-In Accepted'}
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenBooking(selectedFacility, dept)}
                        className="btn-book-action"
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

        {/* Section 2: Services Roster */}
        <div style={{ padding: 0 }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1.1rem', fontFamily: kmFont }}>
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
                fontFamily: kmFont,
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', fontFamily: kmFont }}>
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

        {/* Section 3: Location Map */}
        <div style={{ padding: 0 }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1.1rem', fontFamily: kmFont }}>
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
                <div style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                  {formatFacilityName(selectedFacility.name, language)}
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5, fontFamily: kmFont }}>
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
                    fontFamily: kmFont,
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
    </div>
  );
};
