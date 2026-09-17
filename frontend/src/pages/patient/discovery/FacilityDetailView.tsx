import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  formatFacilityName,
} from '../../../i18n/formatters';
import {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsEmbedUrl,
} from './discoveryUtils';

interface FacilityDetailViewProps {
  selectedFacility: any;
  onBack: () => void;
  onOpenBooking?: (hosp: any, dept: any) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const FacilityDetailView: React.FC<FacilityDetailViewProps> = ({
  selectedFacility,
  onBack,
  userLocation,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  return (
    <div className="facility-detail-animate" style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: '1060px', margin: '0 auto' }}>
      {/* Back Navigation Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
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
          <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1.1rem', fontFamily: kmFont }}>
            {t('active_departments')}
          </div>

          <div
            style={{
              padding: '2rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: isKm ? 'clamp(1.05rem, 1.8vw, 1.2rem)' : 'clamp(0.95rem, 1.6vw, 1.1rem)',
                fontWeight: 400,
                color: 'var(--text-main)',
                lineHeight: 1.5,
                marginBottom: '0.45rem',
                fontFamily: kmFont,
              }}
            >
              {t('coming_soon_title')}
            </div>
            <p
              style={{
                fontSize: isKm ? '0.95rem' : '0.9rem',
                color: '#475569',
                lineHeight: isKm ? 1.75 : 1.65,
                maxWidth: '480px',
                margin: '0 auto',
                fontFamily: kmFont,
              }}
            >
              {t('coming_soon_desc')}
            </p>
          </div>
        </div>

        {/* Section 2: Services Roster */}
        <div style={{ padding: 0 }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1.1rem', fontFamily: kmFont }}>
            {t('services_offered')}
          </div>

          <div
            style={{
              padding: '2rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: isKm ? 'clamp(1.05rem, 1.8vw, 1.2rem)' : 'clamp(0.95rem, 1.6vw, 1.1rem)',
                fontWeight: 400,
                color: 'var(--text-main)',
                lineHeight: 1.5,
                marginBottom: '0.45rem',
                fontFamily: kmFont,
              }}
            >
              {t('coming_soon_title')}
            </div>
            <p
              style={{
                fontSize: isKm ? '0.95rem' : '0.9rem',
                color: '#475569',
                lineHeight: isKm ? 1.75 : 1.65,
                maxWidth: '480px',
                margin: '0 auto',
                fontFamily: kmFont,
              }}
            >
              {t('coming_soon_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
