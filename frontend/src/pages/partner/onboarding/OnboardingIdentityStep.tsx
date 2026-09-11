import React, { useRef } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

export interface OnboardingIdentityStepProps {
  hospitalName: string;
  setHospitalName: (val: string) => void;
  logoUrl: string;
  uploadingLogo: boolean;
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteLogo: () => void;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  isKm: boolean;
  kmFont: string;
  t: (key: string) => string;
}

export const OnboardingIdentityStep: React.FC<OnboardingIdentityStepProps> = ({
  hospitalName,
  setHospitalName,
  logoUrl,
  uploadingLogo,
  onLogoFileChange,
  onDeleteLogo,
  errors,
  setErrors,
  isKm,
  kmFont,
  t,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
          {t('onboard_step_1_title')}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
          {t('onboard_step_1_desc')}
        </p>
      </div>

      {/* 1. Circular Logo Upload at the TOP */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={onLogoFileChange}
          style={{ display: 'none' }}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '2px dashed var(--border-color)',
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'none',
          }}
          title={isKm ? 'ចុចដើម្បីជ្រើសរើសរូបសញ្ញា' : 'Click to select logo'}
        >
          {uploadingLogo ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.45rem',
                color: 'var(--accent-primary)',
              }}
            >
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {isKm ? 'កំពុងផ្ទុកឡើង...' : 'Uploading...'}
              </span>
            </div>
          ) : logoUrl.trim() ? (
            <>
              <img
                src={logoUrl.trim()}
                alt="Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '32px',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Camera size={16} strokeWidth={2} />
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--text-muted)',
              }}
            >
              <Camera size={32} strokeWidth={1.5} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                {isKm ? 'រូបសញ្ញា' : 'Logo'}
              </span>
            </div>
          )}
        </div>

        {logoUrl && !uploadingLogo && (
          <button
            type="button"
            onClick={onDeleteLogo}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              marginTop: '0.45rem',
              padding: '2px 6px',
              fontFamily: kmFont,
              textDecoration: 'underline',
            }}
          >
            {isKm ? 'លុបរូបចេញ' : 'Remove'}
          </button>
        )}

        {errors.logo && (
          <span
            style={{
              color: '#dc2626',
              fontSize: '0.88rem',
              marginTop: '4px',
              display: 'block',
              textAlign: 'center',
            }}
          >
            {errors.logo}
          </span>
        )}
      </div>

      {/* 2. Hospital Legal Name */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '1.02rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            marginBottom: '0.5rem',
          }}
        >
          {t('facility_name_label')}
        </label>
        <input
          type="text"
          value={hospitalName}
          onChange={(e) => {
            setHospitalName(e.target.value);
            if (errors.hospitalName) setErrors((p) => ({ ...p, hospitalName: '' }));
          }}
          placeholder={isKm ? 'ឧ. មន្ទីរពេទ្យរ៉ូយ៉ាល់ ភ្នំពេញ' : 'e.g. Royal City Hospital'}
          style={{
            width: '100%',
            padding: '0.85rem 1.1rem',
            border: `1px solid ${errors.hospitalName ? '#dc2626' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '1.05rem',
            color: 'var(--text-main)',
            background: 'var(--bg-primary, #ffffff)',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
        {errors.hospitalName && (
          <span
            style={{
              color: '#dc2626',
              fontSize: '0.88rem',
              marginTop: '4px',
              display: 'block',
            }}
          >
            {errors.hospitalName}
          </span>
        )}
      </div>
    </div>
  );
};

export default OnboardingIdentityStep;
