import { HealthCheckResponse } from '../types';

export const getApiBase = (): string => {
  // 1. Explicit env var (if custom backend host is needed)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // 2. Local Vite development mode -> always target FastAPI backend
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000/api/v1';
  }
  // 3. Production or runtime server: dynamically use current window origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://127.0.0.1:8000/api/v1';
};

export const getWsBase = (): string => {
  // 1. Explicit env var
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  // 2. Local Vite development mode -> target FastAPI WebSocket
  if (import.meta.env.DEV) {
    return 'ws://127.0.0.1:8000/ws';
  }
  // 3. Production or runtime server: dynamically adapt protocol (ws:// or wss://) and host
  if (typeof window !== 'undefined') {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws`;
  }
  return 'ws://127.0.0.1:8000/ws';
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
