import { HealthCheckResponse } from '../types';

export const getApiBase = (): string => {
  // 1. Explicit env var (dev mode with custom backend URL)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // 2. Production: use same origin (Nginx reverse proxy handles routing)
  //    No hardcoded ports — works on any domain/IP automatically
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    return `${window.location.origin}/api/v1`;
  }
  // 3. Dev fallback
  return 'http://localhost:8000/api/v1';
};

export const getWsBase = (): string => {
  // 1. Explicit env var
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  // 2. Production: derive WebSocket URL from current page origin
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws`;
  }
  // 3. Dev fallback
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
