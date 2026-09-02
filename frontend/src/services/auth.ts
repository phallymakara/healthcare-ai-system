import { API_BASE } from './api';

export interface UserProfile {
  id: string;
  email?: string;
  phone_number?: string;
  full_name: string;
  role: 'PATIENT' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'NURSE' | 'SUPER_ADMIN';
  is_active: boolean;
  is_verified: boolean;
  hospital_id?: string;
  branch_id?: string;
  patient_profile?: {
    blood_type?: string;
    gender?: string;
    emergency_contact_name?: string;
  };
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

const STORAGE_KEY_TOKEN = 'carequeue_token';
const STORAGE_KEY_REFRESH = 'carequeue_refresh';
const STORAGE_KEY_USER = 'carequeue_user';

export class AuthService {
  static getStoredUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static setSession(data: AuthTokens) {
    localStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEY_REFRESH, data.refresh_token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
  }

  static clearSession() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  static async login(account: string, password: string): Promise<AuthTokens> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let msg = 'Login failed';
      if (typeof errorData.detail === 'string') {
        msg = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        msg = errorData.detail[0]?.msg || 'Invalid login details';
      }
      throw new Error(msg);
    }

    const data: AuthTokens = await res.json();
    this.setSession(data);
    return data;
  }

  static async registerPatient(payload: {
    full_name: string;
    phone_number: string;
    email?: string;
    password: string;
    gender?: string;
    blood_type?: string;
  }): Promise<AuthTokens> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let msg = 'Registration failed';
      if (typeof errorData.detail === 'string') {
        msg = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        msg = errorData.detail[0]?.msg || 'Invalid registration details';
      }
      throw new Error(msg);
    }

    const data: AuthTokens = await res.json();
    this.setSession(data);
    return data;
  }

  static async fetchMe(): Promise<UserProfile | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.clearSession();
        return null;
      }
      const user = await res.json();
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  }
}
