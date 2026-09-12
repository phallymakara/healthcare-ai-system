import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface HospitalLocationSectionProps {
  address: string;
  setAddress: (val: string) => void;
  addressError: string | null;
  setAddressError: (val: string | null) => void;
  googleMapsUrl: string;
  setGoogleMapsUrl: (val: string) => void;
  mapError: string | null;
  setMapError: (val: string | null) => void;
  latitude: string;
  setLatitude: (val: string) => void;
  longitude: string;
  setLongitude: (val: string) => void;
  onParseGoogleMapsInput: (input: string) => void;
  saving?: boolean;
  loading?: boolean;
  successMessage?: string | null;
  submitError?: string | null;
}

export const HospitalLocationSection: React.FC<HospitalLocationSectionProps> = ({
  address,
  setAddress,
  addressError,
  setAddressError,
  googleMapsUrl,
  setGoogleMapsUrl,
  mapError,
  setMapError,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  onParseGoogleMapsInput,
  saving,
  loading,
  successMessage,
  submitError,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        marginBottom: '0.85rem',
        boxShadow: 'none',
      }}
    >
      <div style={{ marginBottom: '0.75rem' }}>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: 0,
            fontFamily: kmFont,
          }}
        >
          {t('prof_address_coords')}
        </h2>
      </div>

      {/* Street Address */}
      <div style={{ marginBottom: '0.85rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.92rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: '4px',
            fontFamily: kmFont,
          }}
        >
          {t('prof_street_address')} <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (addressError) setAddressError(null);
          }}
          placeholder={t('prof_street_placeholder')}
          style={{
            width: '100%',
            padding: '0.62rem 1.05rem',
            fontSize: '0.95rem',
            borderRadius: 'var(--radius-full)',
            border: addressError ? '1px solid #dc2626' : '1px solid var(--border-color)',
            background: '#ffffff',
            color: 'var(--text-main)',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: 'none',
            fontFamily: kmFont,
          }}
        />
        {addressError && (
          <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '3px', fontFamily: kmFont }}>
            {addressError}
          </div>
        )}
      </div>

      {/* Google Maps Auto-Fill Input */}
      <div style={{ marginBottom: '0.85rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.92rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: '4px',
            fontFamily: kmFont,
          }}
        >
          {t('prof_map_paste_label')} <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          type="text"
          value={googleMapsUrl}
          onChange={(e) => {
            onParseGoogleMapsInput(e.target.value);
            if (mapError) setMapError(null);
          }}
          placeholder={t('prof_map_paste_placeholder')}
          style={{
            width: '100%',
            padding: '0.62rem 1.05rem',
            fontSize: '0.95rem',
            borderRadius: 'var(--radius-full)',
            border: mapError ? '1px solid #dc2626' : '1px solid var(--border-color)',
            background: '#ffffff',
            color: 'var(--text-main)',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: 'none',
            fontFamily: kmFont,
          }}
        />
        {mapError && (
          <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '3px', fontFamily: kmFont }}>
            {mapError}
          </div>
        )}
      </div>

      {/* Lat / Lng inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.85rem',
          marginBottom: '0.85rem',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '4px',
              fontFamily: kmFont,
            }}
          >
            {t('prof_gps_lat')}
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => {
              setLatitude(e.target.value);
              if (longitude) {
                setGoogleMapsUrl(`https://maps.google.com/?q=${e.target.value},${longitude}`);
              }
            }}
            placeholder="11.5564"
            style={{
              width: '100%',
              padding: '0.62rem 1.05rem',
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              color: 'var(--text-main)',
              boxSizing: 'border-box',
              outline: 'none',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '4px',
              fontFamily: kmFont,
            }}
          >
            {t('prof_gps_lng')}
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => {
              setLongitude(e.target.value);
              if (latitude) {
                setGoogleMapsUrl(`https://maps.google.com/?q=${latitude},${e.target.value}`);
              }
            }}
            placeholder="104.9282"
            style={{
              width: '100%',
              padding: '0.62rem 1.05rem',
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              color: 'var(--text-main)',
              boxSizing: 'border-box',
              outline: 'none',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          />
        </div>
      </div>

      {/* Coordinates info & Google Map Preview */}
      {latitude && longitude && (
        <div style={{ marginTop: '0.85rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.55rem',
            }}
          >
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
              {latitude}, {longitude}
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
                fontSize: '0.92rem',
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: kmFont,
              }}
            >
              <span>{t('btn_open_google_maps')}</span>
              <ExternalLink size={15} />
            </a>
          </div>

          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: 'none',
            }}
          >
            <iframe
              title="Hospital Location Map"
              width="100%"
              height="200"
              style={{ border: 'none', display: 'block' }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=${isKm ? 'km' : 'en'}&z=15&output=embed`}
            />
          </div>
        </div>
      )}

      {/* Container Save Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.65rem',
          marginTop: '0.85rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {successMessage && (
          <span className="save-status-badge" style={{ color: '#16a34a', fontSize: '0.82rem', fontWeight: 600, fontFamily: kmFont }}>
            ✓ {successMessage}
          </span>
        )}
        {submitError && (
          <span className="save-status-badge" style={{ color: '#dc2626', fontSize: '0.82rem', fontFamily: kmFont }}>
            {submitError}
          </span>
        )}
        <button
          type="submit"
          className="btn-save-profile"
          disabled={saving || loading}
          style={{ fontFamily: kmFont }}
        >
          {saving && (
            <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
          )}
          <span>{saving ? t('prof_saving') : t('prof_save_btn')}</span>
        </button>
      </div>
    </div>
  );
};
