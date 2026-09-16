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

  // 1. Explicit query parameter override (for development, previews & testing)
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal')?.toLowerCase();
  if (portalParam === 'patient') {
    return false;
  }
  if (portalParam === 'partner' || portalParam === 'hospital' || portalParam === 'clinic') {
    return true;
  }

  // 2. Match against configured environment URLs if present
  const partnerHost = getPartnerHost();
  const patientHost = getPatientHost();

  if (patientHost && currentHost === patientHost) {
    return false;
  }
  if (partnerHost && currentHost === partnerHost) {
    return true;
  }

  // 3. Local development / IP check
  const isLocalhost =
    currentHostname === 'localhost' ||
    currentHostname === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(currentHostname);

  // Dedicated subdomains on local development (e.g. partner.localhost)
  if (currentHostname === 'partner.localhost' || currentHostname === 'hospital.localhost') {
    return true;
  }

  // On localhost / 127.0.0.1 without dedicated subdomains, default to patient portal
  if (isLocalhost) {
    return false;
  }

  // 4. Production Subdomain patterns: partner.domain.com, hospital.domain.com, clinic.domain.com
  if (
    currentHostname.startsWith('partner.') ||
    currentHostname.startsWith('hospital.') ||
    currentHostname.startsWith('clinic.')
  ) {
    return true;
  }

  // 5. Dash-prefix patterns in production: partner-*.domain.com, hospital-*.domain.com
  if (currentHostname.startsWith('partner-') || currentHostname.startsWith('hospital-')) {
    return true;
  }

  return false;
}

export function getPortalSwitchUrl(target: 'partner' | 'patient'): string {
  if (typeof window === 'undefined') return '/';

  const host = window.location.hostname.toLowerCase();
  const protocol = window.location.protocol;

  const isLocal =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host);

  // --- Target: Partner Portal ---
  if (target === 'partner') {
    const partnerUrl = import.meta.env.VITE_PARTNER_URL as string | undefined;
    if (partnerUrl && partnerUrl.trim()) {
      return partnerUrl.trim().replace(/\/$/, '') + '/';
    }

    // In local development, maintain current host:port with query parameter
    if (isLocal) {
      return `${protocol}//${window.location.host}/?portal=partner`;
    }

    // Generic dynamic subdomain prefixing: partner.<domain>
    const port = window.location.port ? `:${window.location.port}` : '';
    if (host.startsWith('partner.') || host.startsWith('partner-')) {
      return `${protocol}//${window.location.host}/`;
    }
    return `${protocol}//partner.${host}${port}/`;
  }

  // --- Target: Patient Portal ---
  const patientUrl = import.meta.env.VITE_PATIENT_URL as string | undefined;
  if (patientUrl && patientUrl.trim()) {
    return patientUrl.trim().replace(/\/$/, '') + '/';
  }

  if (isLocal) {
    return `${protocol}//${window.location.host}/`;
  }

  // Strip known partner prefixes to dynamically return to the parent patient domain
  const port = window.location.port ? `:${window.location.port}` : '';
  const cleanHost = host.replace(/^(partner[-.]|hospital[-.]|clinic[-.])/i, '');
  return `${protocol}//${cleanHost}${port}/`;
}
