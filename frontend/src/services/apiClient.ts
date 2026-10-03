import { API_BASE } from './api';
import { AuthService } from './auth';
import { getDeviceHeaders } from './deviceFingerprint';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  requiresAuth?: boolean;
}

export interface StreamEvent {
  event: string;
  data: string;
  parsed?: any;
}

export interface StreamOptions extends RequestOptions {
  method?: HttpMethod;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onMetadata?: (metadata: any) => void;
  onEvent?: (event: StreamEvent) => void;
}

export interface StreamResult {
  fullText: string;
  metadata: any;
  events: StreamEvent[];
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = { requiresAuth: true }
): Promise<T> {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getDeviceHeaders(),
    ...(options.headers || {}),
  };

  if (options.requiresAuth !== false) {
    const authHeaders = AuthService.getAuthHeaders() as Record<string, string>;
    Object.assign(headers, authHeaders);
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (isFormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let errorData: unknown = null;
    try {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
        errorDetail = (errorData as { detail: string }).detail;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorDetail = text;
      } catch {
        // Fallback to generic message
      }
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  // Handle 204 No Content or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return (await response.text()) as unknown as T;
}

async function streamRequest(
  path: string,
  body?: unknown,
  options: StreamOptions = { requiresAuth: true }
): Promise<StreamResult> {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getDeviceHeaders(),
    ...(options.headers || {}),
  };

  if (options.requiresAuth !== false) {
    const authHeaders = AuthService.getAuthHeaders() as Record<string, string>;
    Object.assign(headers, authHeaders);
  }

  const response = await fetch(url.toString(), {
    method: options.method || 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    let errorDetail = `Stream failed with status ${response.status}`;
    let errorData: unknown = null;
    try {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
        errorDetail = (errorData as { detail: string }).detail;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorDetail = text;
      } catch {
        // Fallback
      }
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  if (!response.body) {
    throw new ApiError(500, 'ReadableStream not supported on this response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let metadata: any = null;
  const events: StreamEvent[] = [];

  const processChunk = (chunk: string) => {
    const parts = chunk.split(/\r?\n\r?\n/);
    buffer = parts.pop() || '';

    for (const part of parts) {
      if (!part.trim()) continue;
      let eventType = 'message';
      let dataStr = '';
      const lines = part.split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr += (dataStr ? '\n' : '') + line.slice(5).trim();
        }
      }
      if (dataStr) {
        let parsed: any = null;
        try {
          parsed = JSON.parse(dataStr);
        } catch {
          // Plain text data
        }

        const streamEvent: StreamEvent = {
          event: eventType,
          data: dataStr,
          parsed,
        };
        events.push(streamEvent);
        options.onEvent?.(streamEvent);

        if (eventType === 'token') {
          const delta = parsed?.delta || '';
          if (delta) {
            fullText += delta;
            options.onToken?.(delta);
          }
        } else if (eventType === 'metadata') {
          metadata = parsed;
          options.onMetadata?.(parsed);
        }
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      processChunk(buffer);
    }

    if (buffer.trim()) {
      processChunk(buffer + '\n\n');
    }
  } finally {
    reader.releaseLock();
  }

  return { fullText, metadata, events };
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),

  stream: (path: string, body?: unknown, options?: StreamOptions) =>
    streamRequest(path, body, options),
};

export default apiClient;

