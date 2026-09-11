import React from 'react';

export interface OnboardingContactStepProps {
  hospitalPhone: string;
  setHospitalPhone: (v: string) => void;
  hospitalEmail: string;
  setHospitalEmail: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  emergencyAvailable: boolean;
  setEmergencyAvailable: (v: boolean) => void;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  t: (key: string) => string;
}

export const OnboardingContactStep: React.FC<OnboardingContactStepProps> = ({
  hospitalPhone,
  setHospitalPhone,
  hospitalEmail,
  setHospitalEmail,
  website,
  setWebsite,
  emergencyAvailable,
  setEmergencyAvailable,
  errors,
  setErrors,
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
          {t('onboard_step_2_title')}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
          {t('onboard_step_2_desc')}
        </p>
      </div>

      {/* Reception Phone & Official Email */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.35rem',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '1.02rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '0.5rem',
            }}
          >
            {t('facility_phone_label')} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            value={hospitalPhone}
            onChange={(e) => {
              setHospitalPhone(e.target.value);
              if (errors.hospitalPhone) setErrors((p) => ({ ...p, hospitalPhone: '' }));
            }}
            placeholder="023 888 999"
            style={{
              width: '100%',
              padding: '0.85rem 1.1rem',
              border: `1px solid ${errors.hospitalPhone ? '#dc2626' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '1.05rem',
              color: 'var(--text-main)',
              background: 'var(--bg-primary, #ffffff)',
              boxSizing: 'border-box',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          {errors.hospitalPhone && (
            <span
              style={{
                color: '#dc2626',
                fontSize: '0.88rem',
                marginTop: '4px',
                display: 'block',
              }}
            >
              {errors.hospitalPhone}
            </span>
          )}
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '1.02rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '0.5rem',
            }}
          >
            {t('facility_email_label')} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="email"
            value={hospitalEmail}
            onChange={(e) => {
              setHospitalEmail(e.target.value);
              if (errors.hospitalEmail) setErrors((p) => ({ ...p, hospitalEmail: '' }));
            }}
            placeholder="info@hospital.kh"
            style={{
              width: '100%',
              padding: '0.85rem 1.1rem',
              border: `1px solid ${errors.hospitalEmail ? '#dc2626' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '1.05rem',
              color: 'var(--text-main)',
              background: 'var(--bg-primary, #ffffff)',
              boxSizing: 'border-box',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          {errors.hospitalEmail && (
            <span
              style={{
                color: '#dc2626',
                fontSize: '0.88rem',
                marginTop: '4px',
                display: 'block',
              }}
            >
              {errors.hospitalEmail}
            </span>
          )}
        </div>
      </div>

      {/* Official Website */}
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
          {t('facility_website_label')}
        </label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t('facility_website_placeholder')}
          style={{
            width: '100%',
            padding: '0.85rem 1.1rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '1.05rem',
            color: 'var(--text-main)',
            background: 'var(--bg-primary, #ffffff)',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
      </div>

      {/* 24/7 Emergency Service Toggle */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            fontSize: '1.02rem',
            fontWeight: 600,
            color: 'var(--text-main)',
          }}
        >
          <input
            type="checkbox"
            checked={emergencyAvailable}
            onChange={(e) => setEmergencyAvailable(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--accent-primary)',
              cursor: 'pointer',
            }}
          />
          <span>{t('emergency_service_label')}</span>
        </label>
      </div>
    </div>
  );
};

export default OnboardingContactStep;
