import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { AuthService, UserProfile } from '../../services/auth';
import { apiClient } from '../../services/apiClient';
import { useLanguage } from '../../context/LanguageContext';
import prosethLogo from '../../assets/ProsethBot.png';

import { OnboardingStepIndicator } from './onboarding/OnboardingStepIndicator';
import { OnboardingIdentityStep } from './onboarding/OnboardingIdentityStep';
import { OnboardingContactStep } from './onboarding/OnboardingContactStep';
import { OnboardingLocationStep } from './onboarding/OnboardingLocationStep';
import { OnboardingReviewStep } from './onboarding/OnboardingReviewStep';

interface HospitalOnboardingProps {
  currentUser: UserProfile;
  onComplete: (user?: UserProfile) => void;
}

export const HospitalOnboarding: React.FC<HospitalOnboardingProps> = ({
  currentUser,
  onComplete,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Hospital Identity & Logo
  const [hospitalName, setHospitalName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Step 2: Information & Operations
  const [hospitalPhone, setHospitalPhone] = useState(currentUser.phone_number || '');
  const [hospitalEmail, setHospitalEmail] = useState(currentUser.email || '');
  const [website, setWebsite] = useState('');
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);

  // Step 3: Location & Google Maps
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Inline Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let isMounted = true;
    const fetchHospitalProfile = async () => {
      try {
        const data = await apiClient.get<any>('/partners/profile');
        if (!isMounted || !data) return;
        if (data.logo_url) setLogoUrl(data.logo_url);
        if (data.name && !hospitalName) setHospitalName(data.name);
        if (data.contact_phone && !hospitalPhone) setHospitalPhone(data.contact_phone);
        if (data.contact_email && !hospitalEmail) setHospitalEmail(data.contact_email);
        if (data.website && !website) setWebsite(data.website);
        if (data.emergency_service_available !== undefined) {
          setEmergencyAvailable(Boolean(data.emergency_service_available));
        }
        if (data.address && !address) setAddress(data.address);
        if (data.city && !city) setCity(data.city);
        if (data.latitude) setLatitude(String(data.latitude));
        if (data.longitude) {
          setLongitude(String(data.longitude));
          if (data.latitude) {
            setGoogleMapsUrl(`https://maps.google.com/?q=${data.latitude},${data.longitude}`);
          }
        }
      } catch (err) {
        console.warn('[HospitalOnboarding] Failed to load hospital profile:', err);
      }
    };

    fetchHospitalProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({
        ...p,
        logo: isKm ? 'ទំហំរូបភាពត្រូវតែតូចជាង 5MB' : 'Image size must be under 5MB',
      }));
      return;
    }

    setErrors((p) => ({ ...p, logo: '' }));
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiClient.post<any>('/partners/profile/logo', formData);
      if (data?.url) {
        setLogoUrl(data.url);
      }
    } catch (err: any) {
      console.error('[Onboarding Logo Upload Error]:', err);
      setErrors((p) => ({
        ...p,
        logo: isKm ? 'មិនអាចផ្ទុករូបសញ្ញាឡើងបានទេ។ សូមព្យាយាមម្តងទៀត។' : (err.message || 'Failed to upload logo.'),
      }));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!logoUrl) return;
    try {
      if (logoUrl.includes('blob.core.windows.net') || logoUrl.includes('/logo/')) {
        await apiClient.delete('/partners/profile/logo');
      }
    } catch (err) {
      console.warn('Failed to delete blob from storage:', err);
    }
    setLogoUrl('');
  };

  const parseGoogleMapsInput = (input: string) => {
    setGoogleMapsUrl(input);
    const trimmed = input.trim();
    if (!trimmed) return;

    const coordMatch = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)\s*,\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      setLatitude(coordMatch[1]);
      setLongitude(coordMatch[2]);
      return;
    }

    const atMatch = trimmed.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
    if (atMatch) {
      setLatitude(atMatch[1]);
      setLongitude(atMatch[2]);
      return;
    }

    const queryMatch = trimmed.match(/[?&](?:q|ll)=([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
    if (queryMatch) {
      setLatitude(queryMatch[1]);
      setLongitude(queryMatch[2]);
      return;
    }
  };

  const validateStep = (step: number): boolean => {
    const errs: { [key: string]: string } = {};

    if (step === 1) {
      if (!hospitalName.trim()) {
        errs.hospitalName = t('err_facility_name');
      }
    } else if (step === 2) {
      if (!hospitalPhone.trim()) {
        errs.hospitalPhone = isKm ? 'សូមបញ្ចូលលេខទូរស័ព្ទផ្នែកទទួលភ្ញៀវសាធារណៈ។' : 'Please enter reception phone number.';
      }
      if (!hospitalEmail.trim() || !hospitalEmail.includes('@')) {
        errs.hospitalEmail = t('err_facility_email');
      }
    } else if (step === 3) {
      if (!address.trim()) {
        errs.address = isKm ? 'សូមបញ្ចូលអាសយដ្ឋានផ្លូវ។' : 'Please enter street address.';
      }
      if (!city.trim()) {
        errs.city = isKm ? 'សូមបញ្ចូលរាជធានី ឬខេត្ត។' : 'Please enter city or province.';
      }
      if (!googleMapsUrl.trim() && (!latitude || !longitude)) {
        errs.map = isKm ? 'សូមបញ្ចូលតំណភ្ជាប់ Google Maps ឬកូអរដោនេទីតាំង។' : 'Please provide a Google Maps link or coordinates.';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : 4));
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : 1));
  };

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrors({});

    const cleanLogo = (logoUrl && !logoUrl.startsWith('data:') && logoUrl.length <= 512) ? logoUrl.trim() : null;

    if (
      hospitalName.trim() ||
      cleanLogo ||
      address.trim() ||
      city.trim() ||
      hospitalPhone.trim() ||
      hospitalEmail.trim() ||
      latitude ||
      longitude
    ) {
      apiClient.put('/partners/profile', {
        name: hospitalName.trim() || undefined,
        logo_url: cleanLogo,
        address: address.trim() || null,
        city: city.trim() || null,
        contact_phone: hospitalPhone.trim() || null,
        contact_email: hospitalEmail.trim() || null,
        website: website.trim() || null,
        emergency_service_available: emergencyAvailable,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      }).catch(() => {});
    }

    const targetUser = currentUser || AuthService.getStoredUser();
    onComplete(targetUser || undefined);
  };

  const handleFinishOnboarding = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const cleanLogo = (logoUrl && !logoUrl.startsWith('data:') && logoUrl.length <= 512) ? logoUrl.trim() : null;

      const profilePayload: any = {
        name: hospitalName.trim(),
        logo_url: cleanLogo,
        address: address.trim() || null,
        city: city.trim() || null,
        contact_phone: hospitalPhone.trim() || null,
        contact_email: hospitalEmail.trim() || null,
        website: website.trim() || null,
        emergency_service_available: emergencyAvailable,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };

      await apiClient.put('/partners/profile', profilePayload);

      const freshUser = await AuthService.fetchMe();
      onComplete(freshUser || currentUser);
    } catch (err: any) {
      setErrors({ general: err.message || t('prof_err_save') });
    } finally {
      setLoading(false);
    }
  };

  const stepsMetadata = [
    { number: 1, title: t('onboard_step_1_title') },
    { number: 2, title: t('onboard_step_2_title') },
    { number: 3, title: t('onboard_step_3_title') },
    { number: 4, title: t('onboard_step_4_title') },
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-primary, #ffffff)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg, 10px)',
        padding: '2.5rem 2.5rem',
        boxShadow: 'none',
        boxSizing: 'border-box',
        fontFamily: kmFont,
      }}
    >
      {/* Onboarding Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.85rem',
          }}
        >
          {logoUrl.trim() ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '1.5px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary, #f8fafc)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none',
              }}
            >
              <img
                src={logoUrl.trim()}
                alt={hospitalName || 'Hospital Logo'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = prosethLogo;
                }}
              />
            </div>
          ) : (
            <img
              src={prosethLogo}
              alt="Proseth Logo"
              style={{
                width: '52px',
                height: '52px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
        </div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {t('onboard_welcome_title')}
        </h1>
        {hospitalName.trim() && (
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              margin: '0.35rem 0 0 0',
            }}
          >
            {hospitalName}
          </p>
        )}
      </div>

      {/* Stepper Indicator */}
      <OnboardingStepIndicator currentStep={currentStep} steps={stepsMetadata} t={t} />

      {/* Step Views */}
      {currentStep === 1 && (
        <OnboardingIdentityStep
          hospitalName={hospitalName}
          setHospitalName={setHospitalName}
          logoUrl={logoUrl}
          uploadingLogo={uploadingLogo}
          onLogoFileChange={handleLogoFileChange}
          onDeleteLogo={handleDeleteLogo}
          errors={errors}
          setErrors={setErrors}
          isKm={isKm}
          kmFont={kmFont}
          t={t}
        />
      )}

      {currentStep === 2 && (
        <OnboardingContactStep
          hospitalPhone={hospitalPhone}
          setHospitalPhone={setHospitalPhone}
          hospitalEmail={hospitalEmail}
          setHospitalEmail={setHospitalEmail}
          website={website}
          setWebsite={setWebsite}
          emergencyAvailable={emergencyAvailable}
          setEmergencyAvailable={setEmergencyAvailable}
          errors={errors}
          setErrors={setErrors}
          t={t}
        />
      )}

      {currentStep === 3 && (
        <OnboardingLocationStep
          address={address}
          setAddress={setAddress}
          city={city}
          setCity={setCity}
          googleMapsUrl={googleMapsUrl}
          latitude={latitude}
          longitude={longitude}
          parseGoogleMapsInput={parseGoogleMapsInput}
          errors={errors}
          setErrors={setErrors}
          isKm={isKm}
          t={t}
        />
      )}

      {currentStep === 4 && (
        <OnboardingReviewStep
          hospitalName={hospitalName}
          logoUrl={logoUrl}
          currentUser={currentUser}
          hospitalPhone={hospitalPhone}
          hospitalEmail={hospitalEmail}
          website={website}
          emergencyAvailable={emergencyAvailable}
          address={address}
          city={city}
          latitude={latitude}
          longitude={longitude}
          onEditStep={(step) => setCurrentStep(step)}
          isKm={isKm}
          kmFont={kmFont}
          t={t}
        />
      )}

      {/* General Submission Error */}
      {errors.general && (
        <div
          style={{
            color: '#dc2626',
            fontSize: '0.92rem',
            marginBottom: '1.25rem',
          }}
        >
          {errors.general}
        </div>
      )}

      {/* Stepper Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          marginTop: '1.75rem',
        }}
      >
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.9rem 1.25rem',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md, 8px)',
              color: 'var(--text-main)',
              fontSize: '1.06rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            <ArrowLeft size={18} />
            <span>{t('btn_prev_step')}</span>
          </button>
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            disabled={loading}
            style={{
              flex: 2,
              padding: '0.9rem 1.35rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            <span>{t('btn_next_step')}</span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinishOnboarding}
            disabled={loading}
            style={{
              flex: 2,
              padding: '0.95rem 1.35rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            <span>{loading ? t('chat_processing') : t('btn_complete_onboard')}</span>
            <Check size={20} />
          </button>
        )}
      </div>

      {/* Skip Onboarding Option */}
      <div
        style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={handleSkip}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: kmFont,
            padding: '6px 12px',
            display: 'inline-block',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
          }}
        >
          {t('onboard_skip_btn')}
        </button>
      </div>
    </div>
  );
};

export default HospitalOnboarding;
