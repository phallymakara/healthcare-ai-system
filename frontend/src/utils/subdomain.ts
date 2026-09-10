/**
 * Utility functions for dynamic subdomain and portal routing
 * Detects whether the user is accessing the patient app or hospital partner portal
 */

export function isPartnerPortal(): boolean {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname.toLowerCase();

  // 1. Production subdomains (e.g. partner.carequeue.com, hospital.carequeue.com)
  if (host.startsWith('partner.') || host.startsWith('hospital.') || host.startsWith('clinic.')) {
    return true;
  }

  // 2. Local development subdomains (e.g. partner.localhost, hospital.localhost)
  if (host === 'partner.localhost' || host === 'hospital.localhost') {
    return true;
  }

  // 3. Query parameter fallback for development/testing: ?portal=partner or ?portal=hospital
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
  const port = window.location.port ? `:${window.location.port}` : '';

  // Local development or direct IP access fallback (e.g. localhost, 127.0.0.1, or VM IP like 192.168.1.50)
  if (host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (target === 'partner') {
      return `${protocol}//${window.location.host}/?portal=partner`;
    } else {
      return `${protocol}//${window.location.host}/`;
    }
  }

  // Production subdomain handling
  if (target === 'partner') {
    if (host.startsWith('partner.') || host.startsWith('hospital.')) {
      return `${protocol}//${host}${port}/`;
    }
    return `${protocol}//partner.${host}${port}/`;
  } else {
    const cleanHost = host.replace(/^(partner|hospital|clinic)\./, '');
    return `${protocol}//${cleanHost}${port}/`;
  }
}
