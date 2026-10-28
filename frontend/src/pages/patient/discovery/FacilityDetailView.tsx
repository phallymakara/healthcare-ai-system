import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  formatFacilityName,
  formatDepartmentName,
} from '../../../i18n/formatters';
import {
  calculateDistanceKm,
  getGoogleMapsDirectionsUrl,
  getGoogleMapsEmbedUrl,
} from './discoveryUtils';

interface FacilityDetailViewProps {
  selectedFacility: any;
  onBack: () => void;
  onOpenBooking?: (hosp: any, dept: any, service?: any) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const FacilityDetailView: React.FC<FacilityDetailViewProps> = ({
  selectedFacility,
  onBack,
  onOpenBooking,
  userLocation,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const liveDistance =
    typeof selectedFacility?.distance_km === 'number'
      ? selectedFacility.distance_km
      : calculateDistanceKm(
          userLocation?.latitude,
          userLocation?.longitude,
          selectedFacility?.latitude,
          selectedFacility?.longitude
        );

  return (
    <div className="facility-detail-animate" style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: '1060px', margin: '0 auto' }}>
      {/* Back Navigation Button (direct, no outer container) */}
      <button
        type="button"
        onClick={onBack}
        className="btn-back-nav"
        style={{
          padding: '0.2rem 0',
          fontSize: '0.95rem',
          fontWeight: 600,
          background: 'none',
          border: 'none',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          boxShadow: 'none',
          marginBottom: '1.25rem',
          alignSelf: 'flex-start',
          fontFamily: kmFont,
        }}
      >
        <span className="arrow-icon" style={{ fontSize: '1.1rem' }}>←</span>
        <span>{language === 'km' ? 'ត្រឡប់ទៅបញ្ជីមន្ទីរពេទ្យ & គ្លីនិក' : 'Back to Facilities'}</span>
      </button>

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
            borderRadius: '16px',
            padding: '1.4rem 1.65rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: 'none',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                {formatFacilityName(selectedFacility.name, language)}
              </span>
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
              {typeof liveDistance === 'number' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', color: '#0284c7', fontWeight: 600, fontFamily: kmFont }}>
                  <MapPin size={15} />
                  <span>
                    ~{liveDistance} {t('distance_km_away')} ({t('from_your_location')})
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.98rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                <span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {t('location_label')}{' '}
                  </span>
                  {selectedFacility.address || selectedFacility.city || (language === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh')}
                </span>
                <a
                  href={getGoogleMapsDirectionsUrl(userLocation, selectedFacility)}
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

        {/* Section 1: Clinical Departments */}
        <div style={{ padding: 0, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', fontFamily: kmFont }}>
              {t('active_departments')} ({(selectedFacility?.departments || []).length})
            </div>
          </div>

          {(!selectedFacility?.departments || selectedFacility.departments.length === 0) ? (
            <div
              style={{
                padding: '2rem 1.5rem',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              {language === 'km' ? 'មិនទាន់មានផ្នែកវេជ្ជសាស្ត្រដែលបានចុះបញ្ជីនៅឡើយទេ' : 'No clinical departments registered yet for this facility.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {selectedFacility.departments.map((dept: any) => (
                <div
                  key={dept.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.2rem 1.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.9rem',
                    boxShadow: 'none',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                        {formatDepartmentName(dept.name, language)}
                      </span>
                      {dept.code && (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.15rem 0.5rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {dept.code}
                        </span>
                      )}
                    </div>
                    {dept.floor_room && (
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: kmFont }}>
                        {dept.floor_room}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: kmFont }}>
                      <span>
                        <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{dept.waiting_count || 0}</strong> {t('waiting_in_line')}
                      </span>
                      <span>•</span>
                      <span>
                        ~<strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{dept.estimated_wait_minutes || dept.avg_consultation_minutes || 15}</strong> {t('mins_wait')}
                      </span>
                    </div>
                    {dept.doctors && dept.doctors.length > 0 && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontFamily: kmFont }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                          {language === 'km' ? 'វេជ្ជបណ្ឌិត៖ ' : 'Doctor(s): '}
                        </span>
                        {dept.doctors.map((doc: any) => doc.full_name).join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      type="button"
                      onClick={() => onOpenBooking?.(selectedFacility, dept)}
                      style={{
                        padding: '0.55rem 1.15rem',
                        background: 'transparent',
                        border: '1px solid var(--text-main)',
                        borderRadius: '4px',
                        color: 'var(--text-main)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: kmFont,
                        whiteSpace: 'nowrap',
                        boxShadow: 'none',
                      }}
                    >
                      {t('take_ticket')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Services Roster */}
        <div style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', fontFamily: kmFont }}>
              {t('services_offered')} ({(selectedFacility?.services || []).length})
            </div>
          </div>

          {(!selectedFacility?.services || selectedFacility.services.length === 0) ? (
            <div
              style={{
                padding: '2rem 1.5rem',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              {language === 'km' ? 'មិនទាន់មានសេវាកម្មវេជ្ជសាស្ត្រដែលបានចុះបញ្ជីនៅឡើយទេ' : 'No medical services listed yet for this facility.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {selectedFacility.services.map((srv: any) => {
                const targetDept = (selectedFacility?.departments || []).find((d: any) => d.id === srv.department_id) || selectedFacility?.departments?.[0];
                return (
                  <div
                    key={srv.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1.2rem 1.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.9rem',
                      boxShadow: 'none',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                          {srv.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {srv.price > 0 ? `$${Number(srv.price).toFixed(2)}` : (language === 'km' ? 'ឥតគិតថ្លៃ' : 'Free')}
                        </span>
                      </div>
                      {srv.department_name && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontFamily: kmFont }}>
                          {language === 'km' ? 'ផ្នែក៖ ' : 'Department: '}
                          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {formatDepartmentName(srv.department_name, language)}
                          </span>
                        </div>
                      )}
                      {srv.description && (
                        <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.4rem', fontFamily: kmFont }}>
                          {srv.description}
                        </div>
                      )}
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                        {language === 'km' ? 'រយៈពេលពិគ្រោះ៖ ' : 'Duration: '}
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                          {srv.duration_minutes || 20} {language === 'km' ? 'នាទី' : 'mins'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => onOpenBooking?.(selectedFacility, targetDept, srv)}
                        style={{
                          padding: '0.55rem 1.15rem',
                          background: 'transparent',
                          border: '1px solid var(--text-main)',
                          borderRadius: '4px',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          whiteSpace: 'nowrap',
                          boxShadow: 'none',
                        }}
                      >
                        {language === 'km' ? 'កក់សេវាកម្ម' : 'Book Service'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
