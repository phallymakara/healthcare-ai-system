/**
 * Utility functions for dynamic subdomain and portal routing
 * Detects whether the user is accessing the patient app or hospital partner portal
 *
 * Production domains:
 *   Patient  → https://health-ai-system.bcietech.com/  (Landing page & Patient Portal)
 *   Partner  → https://partner-health-ai-system.bcietech.com/  (Hospital / Clinic Staff Portal)
 *
 * Local development:
 *   Patient  → http://localhost:5173
 *   Partner  → http://localhost:5174  OR  http://localhost:5173/?portal=partner
 */

export const PROD_PATIENT_HOST = 'health-ai-system.bcietech.com';
export const PROD_PARTNER_HOST = 'partner-health-ai-system.bcietech.com';

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

  // 1. Explicit production domain matching (Guaranteed 100% accuracy in production)
  if (currentHostname === PROD_PARTNER_HOST) {
    return true;
  }
  if (currentHostname === PROD_PATIENT_HOST) {
    return false;
  }

  // 2. Explicit query parameter override (for development, previews & testing)
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal')?.toLowerCase();
  if (portalParam === 'patient') {
    return false;
  }
  if (portalParam === 'partner' || portalParam === 'hospital' || portalParam === 'clinic') {
    return true;
  }

  const partnerHost = getPartnerHost(); // e.g. "localhost:5174" or configured env
  const patientHost = getPatientHost(); // e.g. "localhost:5173" or configured env

  // 3. Match against configured env URLs if present
  if (patientHost && currentHost === patientHost) {
    return false;
  }
  if (partnerHost && currentHost === partnerHost) {
    return true;
  }

  // 4. Local development / IP check
  const isLocalhost =
    currentHostname === 'localhost' ||
    currentHostname === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(currentHostname);

  // Dedicated subdomains on local development (e.g. partner.localhost)
  if (currentHostname === 'partner.localhost' || currentHostname === 'hospital.localhost') {
    return true;
  }

  // On localhost / 127.0.0.1, unless explicitly matched above, default to patient portal
  if (isLocalhost) {
    return false;
  }

  // 5. Production Subdomain patterns: partner.x.com, hospital.x.com, clinic.x.com
  if (
    currentHostname.startsWith('partner.') ||
    currentHostname.startsWith('hospital.') ||
    currentHostname.startsWith('clinic.')
  ) {
    return true;
  }

  // 6. Dash-prefix patterns in production: partner-*.x.com, hospital-*.x.com
  if (currentHostname.startsWith('partner-') || currentHostname.startsWith('hospital-')) {
    return true;
  }

  return false;
}

export function getPortalSwitchUrl(target: 'partner' | 'patient'): string {
  if (typeof window === 'undefined') return '/';

  const host = window.location.hostname.toLowerCase();
  const protocol = window.location.protocol;

  // 1. Direct match for production domains
  if (host.includes('bcietech.com')) {
    if (target === 'partner') {
      return `https://${PROD_PARTNER_HOST}/`;
    }
    return `https://${PROD_PATIENT_HOST}/`;
  }

  const isLocal =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host);

  // --- Partner URL ---
  if (target === 'partner') {
    // In local development (single Vite dev server), always stay on current port with query param
    if (isLocal) {
      return `${protocol}//${window.location.host}/?portal=partner`;
    }

    const partnerUrl = import.meta.env.VITE_PARTNER_URL as string | undefined;
    if (partnerUrl) return partnerUrl.replace(/\/$/, '') + '/';

    // Generic subdomain fallback: prepend "partner."
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//partner.${host}${port}/`;
  }

  // --- Patient URL ---
  if (isLocal) {
    // Return base URL on current port without ?portal query param
    return `${protocol}//${window.location.host}/`;
  }

  const patientUrl = import.meta.env.VITE_PATIENT_URL as string | undefined;
  if (patientUrl) return patientUrl.replace(/\/$/, '') + '/';

  // Strip known partner prefixes to derive the patient domain
  const port = window.location.port ? `:${window.location.port}` : '';
  const cleanHost = host.replace(/^(partner[-.]|hospital[-.]|clinic[-.])/i, '');
  return `${protocol}//${cleanHost}${port}/`;
}
