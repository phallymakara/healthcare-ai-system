import React from 'react';
import { Phone, Mail, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface HospitalContactSectionProps {
  contactPhone: string;
  setContactPhone: (val: string) => void;
  phoneError: string | null;
  setPhoneError: (val: string | null) => void;
  contactEmail: string;
  setContactEmail: (val: string) => void;
  emailError: string | null;
  setEmailError: (val: string | null) => void;
  emergencyPhone: string;
  setEmergencyPhone: (val: string) => void;
  emergencyPhoneError: string | null;
  setEmergencyPhoneError: (val: string | null) => void;
  saving?: boolean;
  loading?: boolean;
  successMessage?: string | null;
  submitError?: string | null;
}

export const HospitalContactSection: React.FC<HospitalContactSectionProps> = ({
  contactPhone,
  setContactPhone,
  phoneError,
  setPhoneError,
  contactEmail,
  setContactEmail,
  emailError,
  setEmailError,
  emergencyPhone,
  setEmergencyPhone,
  emergencyPhoneError,
  setEmergencyPhoneError,
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
          {t('prof_contact_emergency')}
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {/* Reception Phone */}
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
            {t('prof_reception_phone')} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => {
                setContactPhone(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              placeholder="023 888 999"
              style={{
                width: '100%',
                padding: '0.62rem 1.05rem 0.62rem 2.6rem',
                fontSize: '0.95rem',
                borderRadius: 'var(--radius-full)',
                border: phoneError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-main)',
                boxSizing: 'border-box',
                outline: 'none',
                boxShadow: 'none',
                fontFamily: kmFont,
              }}
            />
            <Phone
              size={16}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
          {phoneError && (
            <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '3px', fontFamily: kmFont }}>
              {phoneError}
            </div>
          )}
        </div>

        {/* Official Email */}
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
            {t('prof_official_email')} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => {
                setContactEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              placeholder="info@hospital.kh"
              style={{
                width: '100%',
                padding: '0.62rem 1.05rem 0.62rem 2.6rem',
                fontSize: '0.95rem',
                borderRadius: 'var(--radius-full)',
                border: emailError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-main)',
                boxSizing: 'border-box',
                outline: 'none',
                boxShadow: 'none',
                fontFamily: kmFont,
              }}
            />
            <Mail
              size={16}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
          {emailError && (
            <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '3px', fontFamily: kmFont }}>
              {emailError}
            </div>
          )}
        </div>

        {/* 24/7 Emergency Hotline */}
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
            {t('prof_emergency_hotline')} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => {
                setEmergencyPhone(e.target.value);
                if (emergencyPhoneError) setEmergencyPhoneError(null);
              }}
              placeholder="119 / 012 999 119"
              style={{
                width: '100%',
                padding: '0.62rem 1.05rem 0.62rem 2.6rem',
                fontSize: '0.95rem',
                borderRadius: 'var(--radius-full)',
                border: emergencyPhoneError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-main)',
                boxSizing: 'border-box',
                outline: 'none',
                boxShadow: 'none',
                fontFamily: kmFont,
              }}
            />
            <Phone
              size={16}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
          {emergencyPhoneError && (
            <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '3px', fontFamily: kmFont }}>
              {emergencyPhoneError}
            </div>
          )}
        </div>
      </div>

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
