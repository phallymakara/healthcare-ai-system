import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const HospitalProfile: React.FC = () => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [website, setWebsite] = useState('');
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Inline Field Errors (Plain text, no container, zero shadow)
  const [nameError, setNameError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const getFriendlyErrorMessage = (rawError: any): string => {
    if (!rawError) return isKm ? 'មិនអាចរក្សាទុកការផ្លាស់ប្តូរបានទេ។ សូមពិនិត្យមើលព័ត៌មានម្តងទៀត។' : 'Unable to save changes. Please review your information.';
    const str = typeof rawError === 'string' ? rawError : (rawError?.detail || rawError?.message || '');
    const lower = String(str).toLowerCase();
    
    if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('connection')) {
      return isKm ? 'បញ្ហាការតភ្ជាប់បណ្តាញ។ សូមព្យាយាមម្តងទៀត។' : 'Network connection issue. Please check your connection and try again.';
    }
    if (lower.includes('internal') || lower.includes('500') || lower.includes('422') || lower.includes('server')) {
      return isKm ? 'មិនអាចរក្សាទុកការផ្លាស់ប្តូរបានទេ។ សូមពិនិត្យមើលទិន្នន័យម្តងទៀត។' : 'Unable to save profile. Please verify your information and try again.';
    }
    return str || (isKm ? 'មិនអាចរក្សាទុកការផ្លាស់ប្តូរបានទេ។ សូមពិនិត្យមើលព័ត៌មានម្តងទៀត។' : 'Unable to save changes. Please review your information.');
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

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partners/profile`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setDescription(data.description || '');
        setLogoUrl(data.logo_url || '');
        setWebsite(data.website || '');
        setEmergencyAvailable(Boolean(data.emergency_service_available));
        setAddress(data.address || '');
        setCity(data.city || '');
        setContactPhone(data.contact_phone || '');
        setContactEmail(data.contact_email || '');
        setEmergencyPhone(data.emergency_phone || '');
        if (data.latitude !== null && data.latitude !== undefined) {
          const latStr = String(data.latitude);
          setLatitude(latStr);
          if (data.longitude !== null && data.longitude !== undefined) {
            const lngStr = String(data.longitude);
            setLongitude(lngStr);
            setGoogleMapsUrl(`https://maps.google.com/?q=${latStr},${lngStr}`);
          }
        }
      }
    } catch (err) {
      console.error('[HospitalProfile Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLogoError(isKm ? 'ទំហំរូបភាពត្រូវតែតូចជាង 5MB' : 'Image size must be under 5MB');
      return;
    }

    setLogoError(null);
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
        window.dispatchEvent(new CustomEvent('hospital-profile-updated'));
      }
    } catch (err: any) {
      console.error('[Logo Upload Error]:', err);
      setLogoError(isKm ? 'មិនអាចផ្ទុករូបសញ្ញាឡើងបានទេ។ សូមព្យាយាមម្តងទៀត។' : (err.message || 'Failed to upload logo.'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!logoUrl) return;
    setUploadingLogo(true);
    setLogoError(null);
    try {
      const res = await fetch(`${API_BASE}/partners/profile/logo`, {
        method: 'DELETE',
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setLogoUrl('');
        window.dispatchEvent(new CustomEvent('hospital-profile-updated'));
      } else {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || 'Failed to delete logo');
      }
    } catch (err: any) {
      console.error('[Logo Delete Error]:', err);
      setLogoError(isKm ? 'មិនអាចលុបរូបសញ្ញាបានទេ។' : (err.message || 'Failed to remove logo.'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNameError(null);
    setCityError(null);
    setPhoneError(null);
    setEmailError(null);
    setEmergencyPhoneError(null);
    setAddressError(null);
    setMapError(null);
    setLogoError(null);
    setSubmitError(null);
    setSuccessMessage(null);

    let hasError = false;

    if (!name.trim()) {
      setNameError(t('prof_err_name'));
      hasError = true;
    }

    if (!city.trim()) {
      setCityError(isKm ? 'សូមបញ្ចូលរាជធានី ឬខេត្ត។' : 'Please enter city or province.');
      hasError = true;
    }

    if (!contactPhone.trim()) {
      setPhoneError(isKm ? 'សូមបញ្ចូលលេខទូរស័ព្ទផ្នែកទទួលភ្ញៀវសាធារណៈ។' : 'Please enter reception phone number.');
      hasError = true;
    }

    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setEmailError(t('prof_err_email'));
      hasError = true;
    }

    if (!emergencyPhone.trim()) {
      setEmergencyPhoneError(isKm ? 'សូមបញ្ចូលលេខទូរស័ព្ទសង្គ្រោះបន្ទាន់ 24/7។' : 'Please enter 24/7 emergency phone number.');
      hasError = true;
    }

    if (!address.trim()) {
      setAddressError(isKm ? 'សូមបញ្ចូលអាសយដ្ឋានផ្លូវ។' : 'Please enter street address.');
      hasError = true;
    }

    if (!googleMapsUrl.trim() && (!latitude || !longitude)) {
      setMapError(isKm ? 'សូមបញ្ចូលតំណភ្ជាប់ Google Maps ឬកូអរដោនេទីតាំង។' : 'Please provide a Google Maps link or coordinates.');
      hasError = true;
    }

    if (hasError) return;

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        website: website.trim() || null,
        emergency_service_available: emergencyAvailable,
        address: address.trim() || null,
        city: city.trim() || null,
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        emergency_phone: emergencyPhone.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };

      const res = await fetch(`${API_BASE}/partners/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[HospitalProfile Save Error]: Response not OK', res.status, errData);
        setSubmitError(getFriendlyErrorMessage(errData));
        return;
      }

      setSuccessMessage(t('prof_success'));
      window.dispatchEvent(new CustomEvent('hospital-profile-updated'));
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('[HospitalProfile Save Error]: Network or runtime failure', err);
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
        fontFamily: kmFont,
        paddingBottom: '3rem',
      }}
    >

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            fontFamily: kmFont,
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: 'none',
          }}
        >
          <RefreshCw
            size={26}
            color="var(--accent-primary)"
            style={{
              animation: 'spin 1s linear infinite',
              display: 'block',
              margin: '0 auto 0.75rem auto',
            }}
          />
          <span>{t('prof_loading')}</span>
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1.75rem',
            boxShadow: 'none',
          }}
        >
          {/* SECTION 1: FACILITY IDENTITY */}
          <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
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
                  onChange={handleLogoFileChange}
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
                        onClick={handleDeleteLogo}
                        disabled={uploadingLogo}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '0.95rem',
                          cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                          padding: '0.2rem 0',
                          fontFamily: kmFont,
                          textDecoration: 'underline',
                          opacity: uploadingLogo ? 0.5 : 1,
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

            {/* Inputs in 3 Rows: Name, City/Province, Website */}
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
                  placeholder="Fhddfggsdfdffgdthospiitgal Clinic"
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.95rem',
                    fontSize: '1.05rem',
                    borderRadius: '4px',
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
                    padding: '0.72rem 0.95rem',
                    fontSize: '1.05rem',
                    borderRadius: '4px',
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
                      padding: '0.72rem 0.95rem 0.72rem 2.6rem',
                      fontSize: '1.05rem',
                      borderRadius: '4px',
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
                      left: '12px',
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
                  padding: '0.65rem 0.95rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
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
                  padding: '0.72rem 0.95rem',
                  fontSize: '1.05rem',
                  borderRadius: '4px',
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

          {/* SECTION 2: COMMUNICATIONS & EMERGENCY */}
          <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
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
                      padding: '0.72rem 0.95rem 0.72rem 2.6rem',
                      fontSize: '1.05rem',
                      borderRadius: '4px',
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
                      left: '12px',
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
                      padding: '0.72rem 0.95rem 0.72rem 2.6rem',
                      fontSize: '1.05rem',
                      borderRadius: '4px',
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
                      left: '12px',
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
                      padding: '0.72rem 0.95rem 0.72rem 2.6rem',
                      fontSize: '1.05rem',
                      borderRadius: '4px',
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
                      left: '12px',
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

          {/* SECTION 3: PHYSICAL ADDRESS & GOOGLE MAPS */}
          <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
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
                  padding: '0.72rem 0.95rem',
                  fontSize: '1.05rem',
                  borderRadius: '4px',
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
                  parseGoogleMapsInput(e.target.value);
                  if (mapError) setMapError(null);
                }}
                placeholder={t('prof_map_paste_placeholder')}
                style={{
                  width: '100%',
                  padding: '0.72rem 0.95rem',
                  fontSize: '1.05rem',
                  borderRadius: '4px',
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
                    padding: '0.72rem 0.95rem',
                    fontSize: '1.05rem',
                    borderRadius: '4px',
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
                    padding: '0.72rem 0.95rem',
                    fontSize: '1.05rem',
                    borderRadius: '4px',
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
                    borderRadius: '4px',
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

          {/* Action Area & Error Display (Directly at place of action, no container box, plain text) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.65rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {submitError && (
              <div
                style={{
                  color: '#dc2626',
                  fontSize: '0.95rem',
                  fontFamily: kmFont,
                  textAlign: 'right',
                }}
              >
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {successMessage && (
                <span style={{ color: '#16a34a', fontSize: '0.95rem', fontWeight: 600, fontFamily: kmFont }}>
                  ✓ {successMessage}
                </span>
              )}

              <button
                type="submit"
                disabled={saving || loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem 1.6rem',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  border: '1px solid var(--text-main)',
                  borderRadius: '4px',
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  cursor: saving || loading ? 'not-allowed' : 'pointer',
                  opacity: saving || loading ? 0.7 : 1,
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {saving && (
                  <RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} />
                )}
                <span>{saving ? t('prof_saving') : t('prof_save_btn')}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
