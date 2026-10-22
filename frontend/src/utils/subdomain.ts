/**
 * Utility functions for dynamic subdomain and portal routing
 * Detects whether the user is accessing the patient app or hospital partner portal.
 *
 * Designed according to 12-Factor App principles:
 * Zero hardcoded domain names. Driven purely by environment variables,
 * dynamic URL prefixes (e.g. partner.* or clinic.*), or query parameters.
 */

/** Full host (domain + port if specified) of the configured partner portal */
function getPartnerHost(): string {
  const partnerUrl = import.meta.env.VITE_PARTNER_URL as string | undefined;
  if (!partnerUrl) return '';
  try {
    return new URL(partnerUrl).host.toLowerCase();
  } catch {
    return '';
  }
}

/** Full host (domain + port if specified) of the configured patient portal */
function getPatientHost(): string {
  const patientUrl = import.meta.env.VITE_PATIENT_URL as string | undefined;
  if (!patientUrl) return '';
  try {
    return new URL(patientUrl).host.toLowerCase();
  } catch {
    return '';
  }
}

export function isPartnerPortal(): boolean {
  if (typeof window === 'undefined') return false;

  const currentHost = window.location.host.toLowerCase(); // includes port e.g. "localhost:5173"
  const currentHostname = window.location.hostname.toLowerCase(); // domain only e.g. "localhost"
  const currentPath = window.location.pathname.toLowerCase();

  // 1. Explicit query parameter override (for development, previews & testing)
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal')?.toLowerCase();
  if (portalParam === 'patient') {
    return false;
  }
  if (portalParam === 'partner' || portalParam === 'hospital' || portalParam === 'clinic' || portalParam === 'admin') {
    return true;
  }

  // 2. Path-based check (Single-domain support e.g. medbot.bcietech.com/partner or /admin)
  if (
    currentPath.startsWith('/partner') ||
    currentPath.startsWith('/hospital') ||
    currentPath.startsWith('/clinic') ||
    currentPath.startsWith('/admin')
  ) {
    return true;
  }

  // 3. Match against configured environment URLs if present
  const partnerHost = getPartnerHost();
  const patientHost = getPatientHost();

  if (patientHost && currentHost === patientHost) {
    // If hosts match and no /partner path, check if patient host is identical to partner host
    if (!partnerHost || partnerHost !== patientHost) {
      return false;
    }
  }
  if (partnerHost && currentHost === partnerHost && partnerHost !== patientHost) {
    return true;
  }

  // 4. Local development / IP check
  const isLocalhost =
    currentHostname === 'localhost' ||
    currentHostname === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(currentHostname);

  // Dedicated subdomains on local development (e.g. partner.localhost)
  if (currentHostname === 'partner.localhost' || currentHostname === 'hospital.localhost' || currentHostname === 'admin.localhost') {
    return true;
  }

  // On localhost / 127.0.0.1 without dedicated subdomains or path, default to patient portal
  if (isLocalhost) {
    return false;
  }

  // 5. Production Subdomain patterns: partner.domain.com, hospital.domain.com, clinic.domain.com, admin.domain.com
  if (
    currentHostname.startsWith('partner.') ||
    currentHostname.startsWith('hospital.') ||
    currentHostname.startsWith('clinic.') ||
    currentHostname.startsWith('admin.')
  ) {
    return true;
  }

  // 6. Dash-prefix patterns in production: partner-*.domain.com, hospital-*.domain.com, admin-*.domain.com
  if (
    currentHostname.startsWith('partner-') ||
    currentHostname.startsWith('hospital-') ||
    currentHostname.startsWith('admin-')
  ) {
    return true;
  }

  return false;
}

export function isAdminPortal(): boolean {
  if (typeof window === 'undefined') return false;

  const currentPath = window.location.pathname.toLowerCase();
  const currentHostname = window.location.hostname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal')?.toLowerCase();

  if (portalParam === 'admin') return true;
  if (currentPath.startsWith('/admin')) return true;
  if (currentHostname.startsWith('admin.') || currentHostname.startsWith('admin-') || currentHostname.startsWith('ops.')) {
    return true;
  }

  return false;
}

export function getPortalSwitchUrl(target: 'partner' | 'patient' | 'admin'): string {
  if (typeof window === 'undefined') return '/';

  const host = window.location.hostname.toLowerCase();
  const protocol = window.location.protocol;

  const isLocal =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host);

  // --- Target: Super Admin Portal ---
  if (target === 'admin') {
    return '/admin';
  }

  // --- Target: Partner Portal ---
  if (target === 'partner') {
    // If currently running on medbot.bcietech.com (where nested subdomains are not supported) or local dev, always use path routing
    if (host === 'medbot.bcietech.com' || isLocal) {
      return '/partner';
    }

    const partnerUrl = import.meta.env.VITE_PARTNER_URL as string | undefined;
    if (partnerUrl && partnerUrl.trim()) {
      try {
        const parsed = new URL(partnerUrl.trim());
        // If the configured URL is the unsupported nested subdomain, safely fall back to path
        if (parsed.host.toLowerCase().includes('partner.medbot.bcietech.com')) {
          return '/partner';
        }
        // If VITE_PARTNER_URL is on a completely different host (e.g. external partner domain)
        if (parsed.host.toLowerCase() !== window.location.host.toLowerCase()) {
          return partnerUrl.trim().replace(/\/$/, '') + '/';
        }
        // If it's on the same host (e.g. medbot.bcietech.com/partner), return the pathname
        return parsed.pathname || '/partner';
      } catch {
        return partnerUrl.trim();
      }
    }

    // Default to clean path routing on single domain or localhost
    if (isLocal) {
      return '/partner';
    }

    // If already on a partner subdomain, stay on host
    if (host.startsWith('partner.') || host.startsWith('partner-')) {
      return `${protocol}//${window.location.host}/`;
    }

    // Default path routing
    return '/partner';
  }

  // --- Target: Patient Portal ---
  const patientUrl = import.meta.env.VITE_PATIENT_URL as string | undefined;
  if (patientUrl && patientUrl.trim()) {
    try {
      const parsed = new URL(patientUrl.trim());
      if (parsed.host.toLowerCase() !== window.location.host.toLowerCase()) {
        return patientUrl.trim().replace(/\/$/, '') + '/';
      }
      return '/';
    } catch {
      return '/';
    }
  }

  if (isLocal) {
    return '/';
  }

  // If on a dedicated subdomain, return to base domain without the prefix
  if (host.startsWith('partner.') || host.startsWith('partner-') || host.startsWith('hospital.') || host.startsWith('clinic.') || host.startsWith('admin.')) {
    const port = window.location.port ? `:${window.location.port}` : '';
    const cleanHost = host.replace(/^(partner[-.]|hospital[-.]|clinic[-.]|admin[-.])/i, '');
    return `${protocol}//${cleanHost}${port}/`;
  }

  return '/';
}
