import { HealthCheckResponse } from '../types';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.hostname;
    return `${protocol}//${host}:8000/api/v1`;
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
};

export const getWsBase = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    return `${protocol}//${host}:8000/ws`;
  }
  return import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws';
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
