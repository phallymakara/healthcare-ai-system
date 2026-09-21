/**
 * Chat History Service
 * Stores and manages AI consultation conversations per user (guest or authenticated user ID).
 * Synchronizes with PostgreSQL backend via REST API for authenticated users and maintains
 * an offline-first localStorage backup.
 */

import { API_BASE } from './api';
import { AuthService } from './auth';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  triage?: any;
  bookedTicket?: any;
  suggestedActions?: string[];
  requiresDisclaimer?: boolean;
  timestamp: string; // ISO string
}

export interface ConversationItem {
  id: string;
  userId: string;
  title: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  messageCount: number;
  messages: StoredMessage[];
}

const STORAGE_PREFIX = 'carequeue_chat_convs_';

/**
 * Retrieve all saved conversations from localStorage for a specific user ID.
 */
export const getUserConversations = (userId: string = 'guest'): ConversationItem[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const list: ConversationItem[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (err) {
    console.error('Failed to load user conversations from storage:', err);
    return [];
  }
};

/**
 * Save or update a conversation in localStorage.
 */
export const saveUserConversation = (
  userId: string = 'guest',
  conv: ConversationItem
): void => {
  try {
    const list = getUserConversations(userId);
    const existingIndex = list.findIndex((c) => c.id === conv.id);
    if (existingIndex >= 0) {
      list[existingIndex] = conv;
    } else {
      list.unshift(conv);
    }
    // Cap stored history to 40 conversations per user
    const capped = list.slice(0, 40);
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(capped));
  } catch (err) {
    console.error('Failed to save user conversation to storage:', err);
  }
};

/**
 * Remove a specific conversation from localStorage.
 */
export const deleteUserConversation = (
  userId: string = 'guest',
  convId: string
): void => {
  try {
    const list = getUserConversations(userId).filter((c) => c.id !== convId);
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to delete conversation from storage:', err);
  }
};

const ACTIVE_CONV_KEY = 'carequeue_active_conv_';

/**
 * Get last active conversation ID for a user.
 */
export const getActiveConversationId = (userId: string = 'guest'): string | null => {
  try {
    return localStorage.getItem(`${ACTIVE_CONV_KEY}${userId}`);
  } catch {
    return null;
  }
};

/**
 * Set or clear the active conversation ID for a user.
 */
export const setActiveConversationId = (userId: string = 'guest', convId: string | null): void => {
  try {
    if (convId) {
      localStorage.setItem(`${ACTIVE_CONV_KEY}${userId}`, convId);
    } else {
      localStorage.removeItem(`${ACTIVE_CONV_KEY}${userId}`);
    }
  } catch {}
};

// ---------------------------------------------------------------------------
// Backend Database API Synchronization
// ---------------------------------------------------------------------------

/**
 * Fetch conversation list from backend API for logged-in user.
 */
export const fetchUserConversationsAPI = async (): Promise<ConversationItem[]> => {
  const token = AuthService.getAccessToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE}/assistant/conversations`, {
      headers: {
        ...AuthService.getAuthHeaders(),
      },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data || []).map((item: any) => ({
      id: item.id,
      userId: AuthService.getStoredUser()?.id || '',
      title: item.title,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      messageCount: item.message_count || 0,
      messages: [],
    }));
  } catch (err) {
    console.warn('Could not fetch conversations from backend API, using local storage:', err);
    return [];
  }
};

/**
 * Fetch full conversation with messages from backend API.
 */
export const fetchConversationDetailAPI = async (convId: string): Promise<ConversationItem | null> => {
  const token = AuthService.getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/assistant/conversations/${convId}`, {
      headers: {
        ...AuthService.getAuthHeaders(),
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      id: data.id,
      userId: AuthService.getStoredUser()?.id || '',
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      messageCount: data.messages?.length || 0,
      messages: (data.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        text: m.content,
        imageUrl: m.image_url,
        triage: m.triage_data,
        bookedTicket: m.booked_ticket,
        suggestedActions: m.suggested_actions,
        requiresDisclaimer: Boolean(m.triage_data?.requires_disclaimer),
        timestamp: m.created_at,
      })),
    };
  } catch (err) {
    console.warn('Could not fetch conversation detail from API:', err);
    return null;
  }
};

/**
 * Delete conversation on backend API.
 */
export const deleteConversationAPI = async (convId: string): Promise<boolean> => {
  const token = AuthService.getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/assistant/conversations/${convId}`, {
      method: 'DELETE',
      headers: {
        ...AuthService.getAuthHeaders(),
      },
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Update conversation title on backend API.
 */
export const updateConversationTitleAPI = async (convId: string, title: string): Promise<boolean> => {
  const token = AuthService.getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/assistant/conversations/${convId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...AuthService.getAuthHeaders(),
      },
      body: JSON.stringify({ title: title.trim() }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Update conversation title in local storage.
 */
export const updateUserConversationTitle = (
  userId: string = 'guest',
  convId: string,
  newTitle: string
): void => {
  try {
    const list = getUserConversations(userId);
    const updated = list.map((c) =>
      c.id === convId ? { ...c, title: newTitle.trim(), updatedAt: new Date().toISOString() } : c
    );
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update conversation title in storage:', err);
  }
};

/**
 * Unified loader: Fetches from backend API if authenticated, else returns local storage.
 */
export const syncUserConversations = async (userId: string = 'guest'): Promise<ConversationItem[]> => {
  if (userId !== 'guest' && !!AuthService.getAccessToken()) {
    const apiList = await fetchUserConversationsAPI();
    if (apiList.length > 0) {
      // Merge with local list
      const localList = getUserConversations(userId);
      const mergedMap = new Map<string, ConversationItem>();
      localList.forEach((c) => mergedMap.set(c.id, c));
      apiList.forEach((c) => {
        const existing = mergedMap.get(c.id);
        mergedMap.set(c.id, {
          ...c,
          messages: existing?.messages || [],
        });
      });
      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(mergedList));
      } catch {}
      return mergedList;
    }
  }

  return getUserConversations(userId);
};

/**
 * Calculate human-readable timestamp of when the chat occurred.
 * Format: "Chatted 58m ago" or if > 1h: "Chatted 1h 25m ago"
 * Khmer: "ជជែក 58 នាទីមុន" or if > 1h: "ជជែក 1 ម៉ោង 25 នាទីមុន"
 */
export const formatChatDuration = (
  conv: ConversationItem,
  language: string = 'en'
): string => {
  const isKm = language === 'km';
  const end = new Date(conv.updatedAt || conv.createdAt).getTime();
  const now = Date.now();

  const agoMs = Math.max(0, now - end);
  const agoMins = Math.floor(agoMs / 60000);
  const agoHours = Math.floor(agoMins / 60);
  const remMins = agoMins % 60;
  const agoDays = Math.floor(agoHours / 24);

  if (isKm) {
    if (agoMins < 1) {
      return 'ជជែកអម្បាញ់មិញ';
    }
    if (agoHours < 1) {
      return `ជជែក ${agoMins} នាទីមុន`;
    }
    if (agoDays < 1) {
      return remMins > 0
        ? `ជជែក ${agoHours} ម៉ោង ${remMins} នាទីមុន`
        : `ជជែក ${agoHours} ម៉ោងមុន`;
    }
    if (agoDays === 1) {
      return 'ជជែកម្សិលមិញ';
    }
    return `ជជែក ${agoDays} ថ្ងៃមុន`;
  }

  // English:
  if (agoMins < 1) {
    return 'Chatted just now';
  }
  if (agoHours < 1) {
    return `Chatted ${agoMins}m ago`;
  }
  if (agoDays < 1) {
    return remMins > 0
      ? `Chatted ${agoHours}h ${remMins}m ago`
      : `Chatted ${agoHours}h ago`;
  }
  if (agoDays === 1) {
    return `Chatted 1d ${agoHours % 24 > 0 ? `${agoHours % 24}h ` : ''}ago`;
  }
  return `Chatted ${agoDays}d ago`;
};
