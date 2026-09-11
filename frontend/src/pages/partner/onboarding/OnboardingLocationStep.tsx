import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

export interface OnboardingLocationStepProps {
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  googleMapsUrl: string;
  latitude: string;
  longitude: string;
  parseGoogleMapsInput: (input: string) => void;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  isKm: boolean;
  t: (key: string) => string;
}

export const OnboardingLocationStep: React.FC<OnboardingLocationStepProps> = ({
  address,
  setAddress,
  city,
  setCity,
  googleMapsUrl,
  latitude,
  longitude,
  parseGoogleMapsInput,
  errors,
  setErrors,
  isKm,
  t,
}) => {
  return (
    <div>
      <div style={{ marginBottom: '1.35rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: '0 0 0.35rem 0',
          }}
        >
          {t('onboard_step_3_title')}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
          {t('onboard_step_3_desc')}
        </p>
      </div>

      {/* Physical Address */}
      <div style={{ marginBottom: '1.35rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '1.02rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            marginBottom: '0.5rem',
          }}
        >
          {t('facility_address_label')} <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (errors.address) setErrors((p) => ({ ...p, address: '' }));
          }}
          placeholder={isKm ? 'ឧ. ផ្ទះលេខ ១២៨ មហាវិថីសហព័ន្ធរុស្ស៊ី' : 'e.g. No. 128, Russian Federation Blvd'}
          style={{
            width: '100%',
            padding: '0.85rem 1.1rem',
            border: `1px solid ${errors.address ? '#dc2626' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '1.05rem',
            color: 'var(--text-main)',
            background: 'var(--bg-primary, #ffffff)',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
        {errors.address && (
          <span
            style={{
              color: '#dc2626',
              fontSize: '0.88rem',
              marginTop: '4px',
              display: 'block',
            }}
          >
            {errors.address}
          </span>
        )}
      </div>

      {/* City / Province */}
      <div style={{ marginBottom: '1.35rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '1.02rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            marginBottom: '0.5rem',
          }}
        >
          {t('facility_city_label')} <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            if (errors.city) setErrors((p) => ({ ...p, city: '' }));
          }}
          placeholder={t('facility_city_placeholder')}
          style={{
            width: '100%',
            padding: '0.85rem 1.1rem',
            border: `1px solid ${errors.city ? '#dc2626' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '1.05rem',
            color: 'var(--text-main)',
            background: 'var(--bg-primary, #ffffff)',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
        {errors.city && (
          <span
            style={{
              color: '#dc2626',
              fontSize: '0.88rem',
              marginTop: '4px',
              display: 'block',
            }}
          >
            {errors.city}
          </span>
        )}
      </div>

      {/* Google Maps Location Input */}
      <div style={{ marginBottom: '1.35rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '1.02rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            marginBottom: '0.5rem',
          }}
        >
          {t('facility_map_label')} <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          type="text"
          value={googleMapsUrl}
          onChange={(e) => {
            parseGoogleMapsInput(e.target.value);
            if (errors.map) setErrors((p) => ({ ...p, map: '' }));
          }}
          placeholder={t('facility_map_placeholder')}
          style={{
            width: '100%',
            padding: '0.85rem 1.1rem',
            border: `1px solid ${errors.map ? '#dc2626' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '0.98rem',
            color: 'var(--text-main)',
            background: 'var(--bg-primary, #ffffff)',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
        {errors.map && (
          <span
            style={{
              color: '#dc2626',
              fontSize: '0.88rem',
              marginTop: '4px',
              display: 'block',
            }}
          >
            {errors.map}
          </span>
        )}

        {/* Map Action Buttons / External Link */}
        {latitude && longitude && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: '0.5rem',
            }}
          >
            <a
              href={`https://maps.google.com/?q=${latitude},${longitude}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                padding: '0.35rem 0.65rem',
              }}
            >
              <span>{t('btn_open_google_maps')}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Coordinates Pill */}
        {latitude && longitude && (
          <div
            style={{
              marginTop: '0.65rem',
              padding: '0.55rem 0.85rem',
              backgroundColor: 'var(--bg-secondary, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '0.86rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <MapPin size={15} color="var(--accent-primary)" />
            <span>
              <strong>{t('facility_coordinates_label')}:</strong> {latitude}, {longitude}
            </span>
          </div>
        )}
      </div>

      {/* Google Maps Embed Preview */}
      {latitude && longitude && (
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md, 8px)',
              overflow: 'hidden',
            }}
          >
            <iframe
              title="Google Maps Location"
              width="100%"
              height="220"
              style={{ border: 'none', display: 'block' }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=${isKm ? 'km' : 'en'}&z=15&output=embed`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingLocationStep;
