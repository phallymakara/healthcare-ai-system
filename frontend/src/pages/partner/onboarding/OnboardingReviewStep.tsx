import React from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../../services/auth';

export interface OnboardingReviewStepProps {
  hospitalName: string;
  logoUrl: string;
  currentUser: UserProfile;
  hospitalPhone: string;
  hospitalEmail: string;
  website: string;
  emergencyAvailable: boolean;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  onEditStep: (stepNumber: 1 | 2 | 3) => void;
  isKm: boolean;
  kmFont: string;
  t: (key: string) => string;
}

export const OnboardingReviewStep: React.FC<OnboardingReviewStepProps> = ({
  hospitalName,
  logoUrl,
  currentUser,
  hospitalPhone,
  hospitalEmail,
  website,
  emergencyAvailable,
  address,
  city,
  latitude,
  longitude,
  onEditStep,
  isKm,
  kmFont,
  t,
}) => {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: '0 0 0.35rem 0',
          }}
        >
          {t('onboard_step_4_title')}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
          {t('onboard_step_4_desc')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Section 1: Facility Identity & Logo */}
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-primary, #ffffff)',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              1. {t('onboard_section_identity')}
            </span>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: kmFont,
                padding: '2px 4px',
              }}
            >
              {t('btn_edit_step')}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-secondary, #f8fafc)',
                flexShrink: 0,
              }}
            >
              {logoUrl.trim() ? (
                <img
                  src={logoUrl.trim()}
                  alt="Hospital Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Building2 size={32} color="var(--accent-primary)" strokeWidth={1.5} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '0.2rem',
                }}
              >
                {hospitalName || '-'}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {currentUser.full_name || currentUser.email || 'Admin'} ({currentUser.role || 'HOSPITAL_ADMIN'})
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contacts & Operations */}
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-primary, #ffffff)',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.85rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              2. {t('onboard_section_operations')}
            </span>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: kmFont,
                padding: '2px 4px',
              }}
            >
              {t('btn_edit_step')}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.95rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.86rem' }}>
                {t('facility_phone_label')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {hospitalPhone || '-'}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.86rem' }}>
                {t('facility_email_label')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {hospitalEmail || '-'}
              </span>
            </div>

            {website && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.86rem' }}>
                  {t('facility_website_label')}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{website}</span>
              </div>
            )}

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.86rem' }}>
                {t('emergency_service_label')}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: emergencyAvailable ? '#16a34a' : 'var(--text-muted)',
                }}
              >
                {emergencyAvailable
                  ? t('emergency_service_badge_yes')
                  : t('emergency_service_badge_no')}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Facility Location & Map */}
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-primary, #ffffff)',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.85rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              3. {t('onboard_section_location')}
            </span>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: kmFont,
                padding: '2px 4px',
              }}
            >
              {t('btn_edit_step')}
            </button>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.86rem' }}>
              {t('facility_address_label')}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>
              {address || '-'} {city ? `(${city})` : ''}
            </span>
          </div>

          {latitude && longitude && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.86rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  <strong>{t('facility_coordinates_label')}:</strong> {latitude}, {longitude}
                </span>
                <a
                  href={`https://maps.google.com/?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <span>{t('btn_open_google_maps')}</span>
                  <ExternalLink size={13} />
                </a>
              </div>
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md, 8px)',
                  overflow: 'hidden',
                }}
              >
                <iframe
                  title="Google Maps Location Verified"
                  width="100%"
                  height="180"
                  style={{ border: 'none', display: 'block' }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=${isKm ? 'km' : 'en'}&z=15&output=embed`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingReviewStep;
