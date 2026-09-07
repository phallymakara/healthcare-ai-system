import { HealthCheckResponse } from '../types';

export const getApiBase = (): string => {
  // 1. Explicit env var (if custom backend host is needed)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // 2. Production or runtime server: dynamically use current window origin
  //    Works automatically on any domain, server IP, custom port, or behind reverse proxies
  if (typeof window !== 'undefined') {
    if (import.meta.env.PROD || window.location.port !== '5173') {
      return `${window.location.origin}/api/v1`;
    }
  }
  // 3. Local Vite dev server fallback
  return 'http://localhost:8000/api/v1';
};

export const getWsBase = (): string => {
  // 1. Explicit env var
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  // 2. Production or runtime server: dynamically adapt protocol (ws:// or wss://) and host
  if (typeof window !== 'undefined') {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (import.meta.env.PROD || window.location.port !== '5173') {
      return `${wsProtocol}//${window.location.host}/ws`;
    }
  }
  // 3. Local Vite dev server fallback
  return 'ws://localhost:8000/ws';
};

export const API_BASE = getApiBase();
export const WS_BASE = getWsBase();

export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    return {
      status: 'degraded',
      timestamp: Date.now() / 1000,
      services: {
        database: 'unreachable',
        redis: 'unreachable',
      },
    };
  }
}
