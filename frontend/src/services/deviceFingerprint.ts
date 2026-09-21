/**
 * Client Device Identification Service
 * Generates and persists a unique client device UUID across localStorage and cookies.
 */

const DEVICE_ID_KEY = 'carequeue_device_id';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_side_anon';

  // 1. Check localStorage
  let deviceId: string | null = null;
  try {
    deviceId = localStorage.getItem(DEVICE_ID_KEY);
  } catch { }

  // 2. Check Cookie fallback
  if (!deviceId) {
    deviceId = getCookie(DEVICE_ID_KEY);
  }

  // 3. Generate new if missing
  if (!deviceId || deviceId.length < 16) {
    deviceId = `dev_${generateUUID()}`;
    try {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch { }
    setCookie(DEVICE_ID_KEY, deviceId);
  } else {
    // Ensure cookie is in sync with localStorage
    setCookie(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

export function getDeviceHeaders(): Record<string, string> {
  return {
    'X-Device-Id': getDeviceId(),
  };
}
