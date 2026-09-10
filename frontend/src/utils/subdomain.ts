/**
 * Utility functions for dynamic subdomain and portal routing
 * Detects whether the user is accessing the patient app or hospital partner portal
 *
 * Production domains:
 *   Patient  → health-ai-system.bcietech.com
 *   Partner  → partner-health-ai-system.bcietech.com  (VITE_PARTNER_URL)
 */

/** Hostname of the configured partner portal (derived from VITE_PARTNER_URL). */
function getPartnerHostname(): string {
  const partnerUrl = import.meta.env.VITE_PARTNER_URL as string | undefined;
  if (!partnerUrl) return '';
  try {
    return new URL(partnerUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function isPartnerPortal(): boolean {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname.toLowerCase();

  // 1. Exact match against the configured VITE_PARTNER_URL hostname
  //    e.g. partner-health-ai-system.bcietech.com
  const partnerHostname = getPartnerHostname();
  if (partnerHostname && host === partnerHostname) {
    return true;
  }

  // 2. Subdomain patterns: partner.x.com, hospital.x.com, clinic.x.com
  if (
    host.startsWith('partner.') ||
    host.startsWith('hospital.') ||
    host.startsWith('clinic.')
  ) {
    return true;
  }

  // 3. Dash-prefix patterns: partner-*.x.com, hospital-*.x.com
  if (host.startsWith('partner-') || host.startsWith('hospital-')) {
    return true;
  }

  // 4. Local development subdomains (e.g. partner.localhost, hospital.localhost)
  if (host === 'partner.localhost' || host === 'hospital.localhost') {
    return true;
  }

  // 5. Query parameter fallback for development/testing: ?portal=partner or ?portal=hospital
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal')?.toLowerCase();
  if (portalParam === 'partner' || portalParam === 'hospital' || portalParam === 'clinic') {
    return true;
  }

  return false;
}

export function getPortalSwitchUrl(target: 'partner' | 'patient'): string {
  if (typeof window === 'undefined') return '/';

  const host = window.location.hostname.toLowerCase();
  const protocol = window.location.protocol;

  // --- Partner URL ---
  if (target === 'partner') {
    // Always prefer the explicitly configured VITE_PARTNER_URL
    const partnerUrl = import.meta.env.VITE_PARTNER_URL as string | undefined;
    if (partnerUrl) return partnerUrl.replace(/\/$/, '') + '/';

    // Local development fallback
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host === '127.0.0.1' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host)
    ) {
      return `${protocol}//${window.location.host}/?portal=partner`;
    }

    // Generic subdomain fallback: prepend "partner."
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//partner.${host}${port}/`;
  }

  // --- Patient URL ---
  const patientUrl = import.meta.env.VITE_PATIENT_URL as string | undefined;
  if (patientUrl) return patientUrl.replace(/\/$/, '') + '/';

  // Local development fallback
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  ) {
    return `${protocol}//${window.location.host}/`;
  }

  // Strip known partner prefixes to derive the patient domain
  const port = window.location.port ? `:${window.location.port}` : '';
  const cleanHost = host.replace(/^(partner[-.]|hospital[-.]|clinic[-.])/i, '');
  return `${protocol}//${cleanHost}${port}/`;
}

