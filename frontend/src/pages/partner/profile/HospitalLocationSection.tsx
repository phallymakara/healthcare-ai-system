import React from 'react';
import { ExternalLink } from 'lucide-react';
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
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '1.75rem',
        boxShadow: 'none',
      }}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
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
      <div style={{ marginBottom: '1.15rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '1.02rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: '6px',
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
            padding: '0.72rem 1.25rem',
            fontSize: '1.05rem',
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
          <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
            {addressError}
          </div>
        )}
      </div>

      {/* Google Maps Auto-Fill Input */}
      <div style={{ marginBottom: '1.15rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '1.02rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: '6px',
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
            padding: '0.72rem 1.25rem',
            fontSize: '1.05rem',
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
          <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
            {mapError}
          </div>
        )}
      </div>

      {/* Lat / Lng inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.15rem',
          marginBottom: '1.15rem',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '1.02rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '6px',
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
              padding: '0.72rem 1.25rem',
              fontSize: '1.05rem',
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
              fontSize: '1.02rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '6px',
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
              padding: '0.72rem 1.25rem',
              fontSize: '1.05rem',
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
              marginBottom: '0.65rem',
            }}
          >
            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
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
                fontSize: '0.98rem',
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
              height="240"
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
