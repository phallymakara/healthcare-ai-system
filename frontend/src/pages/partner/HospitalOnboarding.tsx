import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Camera,
  MapPin,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { AuthService, UserProfile } from '../../services/auth';
import { API_BASE } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import prosethLogo from '../../assets/ProsethBot.svg';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch recently updated hospital profile and logo on mount
  useEffect(() => {
    let isMounted = true;
    const fetchHospitalProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/partners/profile`, {
          headers: AuthService.getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
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

      const res = await fetch(`${API_BASE}/partners/profile/logo`, {
        method: 'POST',
        headers: {
          ...AuthService.getAuthHeaders(),
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || 'Failed to upload hospital logo');
      }

      const data = await res.json();
      if (data.url) {
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!logoUrl) return;
    try {
      if (logoUrl.includes('blob.core.windows.net') || logoUrl.includes('/logo/')) {
        await fetch(`${API_BASE}/partners/profile/logo`, {
          method: 'DELETE',
          headers: AuthService.getAuthHeaders(),
        });
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

    // Direct coordinates: "11.5564, 104.9282"
    const coordMatch = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)\s*,\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      setLatitude(coordMatch[1]);
      setLongitude(coordMatch[2]);
      return;
    }

    // Google Maps @lat,lng e.g. /@11.5564,104.9282,17z
    const atMatch = trimmed.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
    if (atMatch) {
      setLatitude(atMatch[1]);
      setLongitude(atMatch[2]);
      return;
    }

    // Google Maps query param ?q=lat,lng or &ll=lat,lng
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

    // If user filled in anything, save in background
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
      fetch(`${API_BASE}/partners/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({
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
        }),
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

      // Update Hospital Profile
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

      const resProfile = await fetch(`${API_BASE}/partners/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify(profilePayload),
      });

      if (!resProfile.ok) {
        const errData = await resProfile.json().catch(() => ({}));
        setErrors({ general: errData.detail || t('prof_err_save') });
        setLoading(false);
        return;
      }

      // Refresh user and transition to dashboard
      const freshUser = await AuthService.fetchMe();
      onComplete(freshUser || currentUser);
    } catch {
      setErrors({ general: t('err_partner_network') });
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {stepsMetadata.map((step, idx) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div
              key={step.number}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
              }}
            >
              {idx > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '-50%',
                    right: '50%',
                    height: '1px',
                    backgroundColor:
                      currentStep >= step.number
                        ? 'var(--accent-primary)'
                        : 'var(--border-color)',
                    zIndex: 1,
                  }}
                />
              )}

              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  backgroundColor: isActive
                    ? 'var(--accent-primary)'
                    : isCompleted
                    ? 'var(--bg-secondary)'
                    : 'transparent',
                  color: isActive
                    ? '#ffffff'
                    : isCompleted
                    ? 'var(--text-main)'
                    : 'var(--text-muted)',
                  border: `1px solid ${
                    isActive
                      ? 'var(--accent-primary)'
                      : isCompleted
                      ? 'var(--accent-primary)'
                      : 'var(--border-color)'
                  }`,
                  zIndex: 2,
                  boxShadow: 'none',
                  marginBottom: '0.45rem',
                }}
              >
                {isCompleted ? <Check size={16} /> : step.number}
              </div>

              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Counter */}
      <div
        style={{
          fontSize: '0.88rem',
          color: 'var(--accent-primary)',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        {t('onboard_step_of')
          .replace('{current}', String(currentStep))
          .replace('{total}', '4')}
      </div>

      {/* STEP 1: HOSPITAL IDENTITY & LOGO */}
      {currentStep === 1 && (
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
              onChange={handleLogoFileChange}
              style={{ display: 'none' }}
            />

            {/* Circular Logo Area */}
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
                  <RefreshCw
                    size={28}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
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

            {/* Remove Action (Only shown when an image is present) */}
            {logoUrl && !uploadingLogo && (
              <button
                type="button"
                onClick={handleDeleteLogo}
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
      )}

      {/* STEP 2: INFORMATION & OPERATIONS */}
      {currentStep === 2 && (
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
      )}

      {/* STEP 3: FACILITY LOCATION */}
      {currentStep === 3 && (
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
      )}

      {/* STEP 4: REVIEW & VERIFY SUMMARY */}
      {currentStep === 4 && (
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
                  onClick={() => setCurrentStep(1)}
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
                    {currentUser.full_name || currentUser.email || 'Admin'} (
                    {currentUser.role || 'HOSPITAL_ADMIN'})
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
                  onClick={() => setCurrentStep(2)}
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
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {website}
                    </span>
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
                  onClick={() => setCurrentStep(3)}
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
