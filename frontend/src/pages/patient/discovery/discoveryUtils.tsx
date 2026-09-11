import React, { useState, useEffect, useMemo } from 'react';
import { Building2 } from 'lucide-react';

export const getGoogleMapsUrl = (facility: any) => {
  if (facility?.latitude && facility?.longitude) {
    return `https://maps.google.com/?q=${facility.latitude},${facility.longitude}`;
  }
  const query = facility?.address || facility?.name || 'Phnom Penh';
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
};

export const getGoogleMapsEmbedUrl = (facility: any, isKm: boolean) => {
  const q = facility?.latitude && facility?.longitude
    ? `${facility.latitude},${facility.longitude}`
    : encodeURIComponent(facility?.address || facility?.name || 'Phnom Penh');
  return `https://maps.google.com/maps?q=${q}&hl=${isKm ? 'km' : 'en'}&z=16&output=embed`;
};

export const SimulatedHospitalLogo: React.FC<{ name: string; logoUrl?: string; size?: number }> = ({
  name,
  logoUrl,
  size = 68,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const initials = useMemo(() => {
    if (!name) return 'HP';
    const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (clean.slice(0, 2) || 'HP').toUpperCase();
  }, [name]);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '50%',
        border: '1px solid var(--border-color)',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        gap: '2px',
        boxSizing: 'border-box',
      }}
    >
      <Building2 size={Math.round(size * 0.42)} color="var(--accent-primary, #185339)" strokeWidth={1.8} />
      <span
        style={{
          fontSize: size >= 60 ? '0.75rem' : '0.6rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
    </div>
  );
};

export const SimulatedDoctorAvatar: React.FC<{ name: string; photoUrl?: string; size?: number }> = ({
  name,
  photoUrl,
  size = 38,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const initials = useMemo(() => {
    if (!name) return 'DR';
    const clean = name.replace(/^(Dr\.|Doctor|Dr)\s+/i, '').replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (clean.slice(0, 2) || 'DR').toUpperCase();
  }, [name]);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '50%',
        border: '1px solid var(--border-color)',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--accent-primary, #185339)',
        fontWeight: 600,
        fontSize: '0.72rem',
        letterSpacing: '0.04em',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
      title={name}
    >
      {initials}
    </div>
  );
};
