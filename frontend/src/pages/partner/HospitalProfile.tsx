import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { HospitalIdentitySection } from './profile/HospitalIdentitySection';
import { HospitalContactSection } from './profile/HospitalContactSection';
import { HospitalLocationSection } from './profile/HospitalLocationSection';

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

  // Inline Field Errors
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
        setEmergencyAvailable(data.emergency_service_available ?? false);
        setAddress(data.address || '');
        setCity(data.city || '');
        setContactPhone(data.contact_phone || '');
        setContactEmail(data.contact_email || '');
        setEmergencyPhone(data.emergency_phone || '');

        if (data.latitude != null) setLatitude(String(data.latitude));
        if (data.longitude != null) setLongitude(String(data.longitude));
        if (data.latitude != null && data.longitude != null) {
          setGoogleMapsUrl(`https://maps.google.com/?q=${data.latitude},${data.longitude}`);
        }
      }
    } catch (err) {
      console.error('Failed to load partner profile:', err);
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
        headers: AuthService.getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || 'Failed to upload logo');
      }

      const data = await res.json();
      setLogoUrl(data.url);
      window.dispatchEvent(new CustomEvent('hospital-profile-updated'));
    } catch (err: any) {
      console.error('[Logo Upload Error]:', err);
      setLogoError(isKm ? 'មិនអាចផ្ទុករូបសញ្ញាបានទេ។ សូមព្យាយាមម្តងទៀត។' : (err.message || 'Failed to upload logo.'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    setLogoError(null);
    setUploadingLogo(true);
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
            background: 'transparent',
            border: 'none',
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
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            padding: 0,
            boxShadow: 'none',
          }}
        >
          <HospitalIdentitySection
            name={name}
            setName={setName}
            nameError={nameError}
            setNameError={setNameError}
            city={city}
            setCity={setCity}
            cityError={cityError}
            setCityError={setCityError}
            website={website}
            setWebsite={setWebsite}
            emergencyAvailable={emergencyAvailable}
            setEmergencyAvailable={setEmergencyAvailable}
            description={description}
            setDescription={setDescription}
            logoUrl={logoUrl}
            uploadingLogo={uploadingLogo}
            logoError={logoError}
            fileInputRef={fileInputRef}
            onLogoFileChange={handleLogoFileChange}
            onDeleteLogo={handleDeleteLogo}
          />

          <HospitalContactSection
            contactPhone={contactPhone}
            setContactPhone={setContactPhone}
            phoneError={phoneError}
            setPhoneError={setPhoneError}
            contactEmail={contactEmail}
            setContactEmail={setContactEmail}
            emailError={emailError}
            setEmailError={setEmailError}
            emergencyPhone={emergencyPhone}
            setEmergencyPhone={setEmergencyPhone}
            emergencyPhoneError={emergencyPhoneError}
            setEmergencyPhoneError={setEmergencyPhoneError}
          />

          <HospitalLocationSection
            address={address}
            setAddress={setAddress}
            addressError={addressError}
            setAddressError={setAddressError}
            googleMapsUrl={googleMapsUrl}
            setGoogleMapsUrl={setGoogleMapsUrl}
            mapError={mapError}
            setMapError={setMapError}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            onParseGoogleMapsInput={parseGoogleMapsInput}
          />

          {/* Action Area & Error Display */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.65rem',
              paddingTop: '0.25rem',
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
                  padding: '0.7rem 1.85rem',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  border: '1px solid var(--text-main)',
                  borderRadius: 'var(--radius-full)',
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
