import { Capacitor } from '@capacitor/core';

/**
 * Single Source of Truth for Dynamic Backend Connectivity
 *
 * Implements 12-Factor App principles (Factor III: Config) with zero hardcoded URLs:
 * 1. Runtime Mobile / Device Override (localStorage: HEALTHCARE_API_ENDPOINT)
 * 2. Environment Variables (VITE_API_BASE_URL, VITE_WS_BASE_URL)
 * 3. Dynamic Web / PWA Origin Resolution (auto-adapts to any hostname/port/proxy)
 * 4. Native Emulator Fallback (Android 10.0.2.2 / iOS localhost)
 */

export const STORAGE_KEY_API = 'HEALTHCARE_API_ENDPOINT';
export const STORAGE_KEY_WS = 'HEALTHCARE_WS_ENDPOINT';
export const LEGACY_KEY_API = 'CUSTOM_API_BASE';
export const LEGACY_KEY_WS = 'CUSTOM_WS_BASE';

/**
 * Dynamically derives a WebSocket URL (ws:// or wss://) from an HTTP(S) API endpoint
 */
export function deriveWebSocketUrl(apiUrl: string): string {
  try {
    const parsed = new URL(apiUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    // If apiUrl ends with /api/v1 or /api, replace with /ws; otherwise append /ws
    const cleanPath = parsed.pathname.replace(/\/api(\/v\d+)?\/?$/, '');
    return `${wsProtocol}//${parsed.host}${cleanPath}/ws`;
  } catch {
    return apiUrl.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '/ws');
  }
}

/**
 * Resolves the active backend API base URL with full dynamic fallbacks
 */
export function getApiBase(): string {
  // 1. Runtime user / tester override from local device storage
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_KEY_API) || localStorage.getItem(LEGACY_KEY_API);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  // 2. Explicit build-time or runtime environment variable
  const envApi = import.meta.env.VITE_API_BASE_URL;
  if (envApi && typeof envApi === 'string' && envApi.trim()) {
    return envApi.trim().replace(/\/+$/, '');
  }

  // 3. Native mobile app (Capacitor on Android / iOS)
  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    // In local development mode on emulator:
    if (import.meta.env.DEV) {
      return platform === 'android'
        ? 'http://10.0.2.2:8000/api/v1'
        : 'http://localhost:8000/api/v1';
    }
    // In production native build without explicit env, fall back to device storage or emulator default
    return platform === 'android'
      ? 'http://10.0.2.2:8000/api/v1'
      : 'http://localhost:8000/api/v1';
  }

  // 4. Local Vite browser development
  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Accessing via LAN IP (e.g. 192.168.x.x on mobile browser)
      return `${window.location.protocol}//${window.location.hostname}:9000/api/v1`;
    }
    return 'http://127.0.0.1:8000/api/v1';
  }

  // 5. Deployed Web & PWA: Dynamically use current host origin
  // Nginx reverse-proxies /api/v1 to backend:9000 regardless of the public domain/IP
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/api/v1`;
  }

  return '/api/v1';
}

/**
 * Resolves the active WebSocket URL with full dynamic fallbacks
 */
export function getWsBase(): string {
  // 1. Runtime user / tester override
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_KEY_WS) || localStorage.getItem(LEGACY_KEY_WS);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  // 2. Explicit environment variable
  const envWs = import.meta.env.VITE_WS_BASE_URL;
  if (envWs && typeof envWs === 'string' && envWs.trim()) {
    return envWs.trim().replace(/\/+$/, '');
  }

  // 3. Automatically derive from the resolved API base
  const apiBase = getApiBase();
  if (apiBase && !apiBase.startsWith('/')) {
    return deriveWebSocketUrl(apiBase);
  }

  // 4. Deployed Web & PWA: Dynamically construct from current window host
  if (typeof window !== 'undefined' && window.location.host) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  return 'ws://127.0.0.1:8000/ws';
}

/**
 * Set a custom server endpoint dynamically at runtime (for mobile or testing)
 */
export function setCustomServerEndpoint(apiUrl: string, wsUrl?: string): void {
  if (typeof window === 'undefined') return;
  const cleanApi = apiUrl.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY_API, cleanApi);

  const cleanWs = (wsUrl && wsUrl.trim()) ? wsUrl.trim().replace(/\/+$/, '') : deriveWebSocketUrl(cleanApi);
  localStorage.setItem(STORAGE_KEY_WS, cleanWs);
}

/**
 * Reset server endpoint back to default dynamic resolution
 */
export function resetServerEndpoint(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_API);
  localStorage.removeItem(STORAGE_KEY_WS);
  localStorage.removeItem(LEGACY_KEY_API);
  localStorage.removeItem(LEGACY_KEY_WS);
}

/**
 * Check if the active connection is currently using a custom user override
 */
export function isUsingCustomEndpoint(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    localStorage.getItem(STORAGE_KEY_API) ||
    localStorage.getItem(LEGACY_KEY_API)
  );
}

export interface ConnectionMetadata {
  apiUrl: string;
  wsUrl: string;
  source: 'override' | 'env' | 'native_platform' | 'browser_origin' | 'fallback';
  isNative: boolean;
  platform: string;
}

/**
 * Returns diagnostic metadata about how the connection endpoint was resolved
 */
export function getConnectionMetadata(): ConnectionMetadata {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const hasOverride = isUsingCustomEndpoint();
  const hasEnv = Boolean(import.meta.env.VITE_API_BASE_URL);

  let source: ConnectionMetadata['source'] = 'fallback';
  if (hasOverride) source = 'override';
  else if (hasEnv) source = 'env';
  else if (isNative) source = 'native_platform';
  else if (typeof window !== 'undefined' && window.location.origin) source = 'browser_origin';

  return {
    apiUrl: getApiBase(),
    wsUrl: getWsBase(),
    source,
    isNative,
    platform,
  };
}
