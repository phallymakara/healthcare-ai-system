import React from 'react';
import { Camera, RefreshCw, Globe } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface HospitalIdentitySectionProps {
  name: string;
  setName: (val: string) => void;
  nameError: string | null;
  setNameError: (val: string | null) => void;
  city: string;
  setCity: (val: string) => void;
  cityError: string | null;
  setCityError: (val: string | null) => void;
  website: string;
  setWebsite: (val: string) => void;
  emergencyAvailable: boolean;
  setEmergencyAvailable: (val: boolean) => void;
  description: string;
  setDescription: (val: string) => void;
  logoUrl: string;
  uploadingLogo: boolean;
  logoError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteLogo: () => void;
}

export const HospitalIdentitySection: React.FC<HospitalIdentitySectionProps> = ({
  name,
  setName,
  nameError,
  setNameError,
  city,
  setCity,
  cityError,
  setCityError,
  website,
  setWebsite,
  emergencyAvailable,
  setEmergencyAvailable,
  description,
  setDescription,
  logoUrl,
  uploadingLogo,
  logoError,
  fileInputRef,
  onLogoFileChange,
  onDeleteLogo,
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
          {t('prof_facility_identity')}
        </h2>
      </div>

      {/* Circular Logo Uploader (Centered) */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={onLogoFileChange}
            style={{ display: 'none' }}
          />

          <div
            onClick={() => !uploadingLogo && fileInputRef.current?.click()}
            style={{
              width: '124px',
              height: '124px',
              borderRadius: '50%',
              border: '1px dashed var(--border-color)',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploadingLogo ? 'not-allowed' : 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'none',
              flexShrink: 0,
              opacity: uploadingLogo ? 0.6 : 1,
            }}
            title={isKm ? 'ចុចដើម្បីផ្លាស់ប្តូររូបសញ្ញា' : 'Click to change logo'}
          >
            {uploadingLogo ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={26} className="spin" color="var(--accent-primary)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isKm ? 'កំពុងផ្ទុក...' : 'Uploading...'}
                </span>
              </div>
            ) : logoUrl.trim() ? (
              <>
                <img
                  src={logoUrl.trim()}
                  alt="Hospital Logo"
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
                    height: '30px',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Camera size={18} strokeWidth={2} />
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                <Camera size={32} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.92rem', fontWeight: 500, fontFamily: kmFont }}>
                  {isKm ? 'រូបសញ្ញា' : 'Logo'}
                </span>
              </div>
            )}
          </div>

          {(logoUrl.trim() || logoError) && (
            <div style={{ textAlign: 'center' }}>
              {logoUrl.trim() && (
                <button
                  type="button"
                  onClick={onDeleteLogo}
                  disabled={uploadingLogo}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#dc2626',
                    fontSize: '0.92rem',
                    fontWeight: 500,
                    cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                    padding: '0.25rem 0',
                    fontFamily: kmFont,
                    opacity: uploadingLogo ? 0.5 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {isKm ? 'លុបរូបចេញ' : 'Remove'}
                </button>
              )}

              {logoError && (
                <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
                  {logoError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.15rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Hospital Name */}
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
            {t('prof_facility_name')} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Clinic / Hospital Name"
            style={{
              width: '100%',
              padding: '0.72rem 1.25rem',
              fontSize: '1.05rem',
              borderRadius: 'var(--radius-full)',
              border: nameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
              background: '#ffffff',
              color: 'var(--text-main)',
              boxSizing: 'border-box',
              outline: 'none',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          />
          {nameError && (
            <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
              {nameError}
            </div>
          )}
        </div>

        {/* City / Province */}
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
            {t('prof_city_region')} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              if (cityError) setCityError(null);
            }}
            placeholder={t('prof_city_placeholder') || 'ឧ. រាជធានីភ្នំពេញ'}
            style={{
              width: '100%',
              padding: '0.72rem 1.25rem',
              fontSize: '1.05rem',
              borderRadius: 'var(--radius-full)',
              border: cityError ? '1px solid #dc2626' : '1px solid var(--border-color)',
              background: '#ffffff',
              color: 'var(--text-main)',
              boxSizing: 'border-box',
              outline: 'none',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          />
          {cityError && (
            <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
              {cityError}
            </div>
          )}
        </div>

        {/* Website */}
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
            {t('prof_website_label')}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t('prof_website_placeholder')}
              style={{
                width: '100%',
                padding: '0.72rem 1.25rem 0.72rem 2.85rem',
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
            <Globe
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
        </div>
      </div>

      {/* Emergency Service Available Toggle */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 1.25rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            background: '#ffffff',
            cursor: 'pointer',
            userSelect: 'none',
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
          <span
            style={{
              fontSize: '1.02rem',
              fontWeight: 500,
              color: 'var(--text-main)',
              fontFamily: kmFont,
            }}
          >
            {t('prof_emergency_toggle')}
          </span>
        </label>
      </div>

      {/* Description / Mission */}
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
          {t('prof_about_mission')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={
            isKm
              ? 'ការពិពណ៌នាសង្ខេបអំពីសេវាកម្ម ឯកទេសវេជ្ជសាស្ត្រ និងការថែទាំអ្នកជំងឺ...'
              : 'Overview of facility services, specialties, and patient care standards...'
          }
          style={{
            width: '100%',
            padding: '0.85rem 1.25rem',
            fontSize: '1.05rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: '#ffffff',
            color: 'var(--text-main)',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: 'none',
            resize: 'vertical',
            lineHeight: 1.5,
            fontFamily: kmFont,
          }}
        />
      </div>
    </div>
  );
};
