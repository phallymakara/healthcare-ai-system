import { HealthCheckResponse } from '../types';
import {
  getApiBase as resolveApiBase,
  getWsBase as resolveWsBase,
  setCustomServerEndpoint,
  resetServerEndpoint,
  isUsingCustomEndpoint,
  getConnectionMetadata,
  deriveWebSocketUrl,
} from '../config/connection';

export {
  setCustomServerEndpoint,
  resetServerEndpoint,
  isUsingCustomEndpoint,
  getConnectionMetadata,
  deriveWebSocketUrl,
};
export type { ConnectionMetadata } from '../config/connection';

export const getApiBase = (): string => resolveApiBase();
export const getWsBase = (): string => resolveWsBase();

/**
 * Dynamic accessor for API_BASE and WS_BASE.
 * Implements Symbol.toPrimitive and toString so string concatenation and
 * template literals (`${API_BASE}/path`) always dynamically resolve the current endpoint.
 */
export const API_BASE = {
  toString: () => getApiBase(),
  valueOf: () => getApiBase(),
  [Symbol.toPrimitive]: () => getApiBase(),
} as unknown as string;

export const WS_BASE = {
  toString: () => getWsBase(),
  valueOf: () => getWsBase(),
  [Symbol.toPrimitive]: () => getWsBase(),
} as unknown as string;

/**
 * Checks backend health at the active or specified API base URL.
 * Includes a 4-second timeout to prevent UI hang when testing unreachable endpoints.
 */
export async function checkBackendHealth(targetBase?: string): Promise<HealthCheckResponse> {
  const base = targetBase ? targetBase.trim().replace(/\/+$/, '') : getApiBase();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${base}/health`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return await res.json();
  } catch {
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
