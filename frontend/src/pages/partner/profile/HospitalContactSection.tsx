import React from 'react';
import { Phone, Mail } from 'lucide-react';
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
          {t('prof_contact_emergency')}
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.15rem',
        }}
      >
        {/* Reception Phone */}
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
                padding: '0.72rem 1.25rem 0.72rem 2.85rem',
                fontSize: '1.05rem',
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
              size={18}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
          {phoneError && (
            <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
              {phoneError}
            </div>
          )}
        </div>

        {/* Official Email */}
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
                padding: '0.72rem 1.25rem 0.72rem 2.85rem',
                fontSize: '1.05rem',
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
              size={18}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
          {emailError && (
            <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
              {emailError}
            </div>
          )}
        </div>

        {/* 24/7 Emergency Hotline */}
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
                padding: '0.72rem 1.25rem 0.72rem 2.85rem',
                fontSize: '1.05rem',
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
              size={18}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
          {emergencyPhoneError && (
            <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
              {emergencyPhoneError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
