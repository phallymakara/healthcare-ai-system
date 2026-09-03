import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';

const API_BASE = '/api/v1';

export const HospitalProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Inline Field Errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setAddress(data.address || '');
        setCity(data.city || '');
        setContactPhone(data.contact_phone || '');
        setContactEmail(data.contact_email || '');
        setEmergencyPhone(data.emergency_phone || '');
        setLatitude(data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : '');
        setLongitude(data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : '');
      }
    } catch {
      // Quiet background failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setEmailError(null);
    setSubmitError(null);
    setSuccessMessage(null);

    let hasError = false;

    if (!name.trim()) {
      setNameError('Please enter the hospital name.');
      hasError = true;
    }

    if (contactEmail.trim() && !contactEmail.includes('@')) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }

    if (hasError) return;

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
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
        setSubmitError(errData.detail || 'Unable to update profile. Please try again.');
        return;
      }

      setSuccessMessage('Hospital profile updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      setSubmitError('Connection issue saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Controls: Save Changes button aligned to the left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '0.55rem 1.1rem',
            background: 'transparent',
            border: '1px solid var(--text-main)',
            borderRadius: '4px',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: 'none',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {successMessage && (
          <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 500 }}>
            {successMessage}
          </span>
        )}

        {submitError && (
          <span style={{ fontSize: '0.85rem', color: '#dc2626' }}>
            {submitError}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Loading clinic profile...
        </div>
      ) : (
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '1.5rem',
          boxShadow: 'none',
          flex: 1,
        }}>
          {/* Section 1: Facility Identity */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Facility Identity
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Hospital / Clinic Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: nameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {nameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                    {nameError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  City / Region
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Phnom Penh"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                About Facility / Mission
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Section 2: Contact & Emergency Communications */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact & Emergency Lines
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Public Reception Phone
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="023 888 999"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Official Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="info@hospital.kh"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: emailError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {emailError && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                    {emailError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  24/7 Emergency Hotline
                </label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="119 / 012 999 119"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location & Coordinates */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Physical Address & Coordinates
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="No. 128, Preah Norodom Blvd, Daun Penh"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  GPS Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="11.5564"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  GPS Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="104.9282"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
