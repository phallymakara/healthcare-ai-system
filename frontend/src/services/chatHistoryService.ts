/**
 * Chat History Service
 * Stores and manages AI consultation conversations per user (guest or authenticated user ID).
 * Tracks message history, timestamps, and conversation duration.
 */

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  triage?: any;
  bookedTicket?: any;
  suggestedActions?: string[];
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
 * Retrieve all saved conversations for a specific user ID, sorted by most recent activity.
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
 * Save or update a conversation for a specific user.
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
 * Remove a specific conversation.
 */
export const deleteUserConversation = (
  userId: string = 'guest',
  convId: string
): void => {
  try {
    const list = getUserConversations(userId).filter((c) => c.id !== convId);
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to delete conversation:', err);
  }
};

/**
 * Calculate human-readable duration of the conversation and how long ago it occurred.
 * Format: "Chatted for 12m • 2h ago" or "ជជែកបាន 12 នាទី • 2 ម៉ោងមុន"
 */
export const formatChatDuration = (
  conv: ConversationItem,
  language: string = 'en'
): string => {
  const isKm = language === 'km';
  const start = new Date(conv.createdAt).getTime();
  const end = new Date(conv.updatedAt).getTime();
  const now = Date.now();

  // Duration between first message and last message
  const durationMs = Math.max(0, end - start);
  const durationMins = Math.round(durationMs / 60000);
  const durationHours = Math.floor(durationMins / 60);

  // How long ago the conversation concluded/had activity
  const agoMs = Math.max(0, now - end);
  const agoMins = Math.floor(agoMs / 60000);
  const agoHours = Math.floor(agoMins / 60);
  const agoDays = Math.floor(agoHours / 24);

  // Duration label
  let durationStr = '';
  if (durationMins < 1) {
    durationStr = isKm ? 'ជជែក < ១ នាទី' : 'Chatted < 1m';
  } else if (durationHours < 1) {
    durationStr = isKm ? `ជជែកបាន ${durationMins} នាទី` : `Chatted for ${durationMins}m`;
  } else {
    const remMins = durationMins % 60;
    durationStr = isKm
      ? `ជជែកបាន ${durationHours} ម៉ោង`
      : `Chatted for ${durationHours}h ${remMins > 0 ? `${remMins}m` : ''}`.trim();
  }

  // Time ago label
  let agoStr = '';
  if (agoMins < 2) {
    agoStr = isKm ? 'អម្បាញ់មិញ' : 'Just now';
  } else if (agoHours < 1) {
    agoStr = isKm ? `${agoMins} នាទីមុន` : `${agoMins}m ago`;
  } else if (agoDays < 1) {
    agoStr = isKm ? `${agoHours} ម៉ោងមុន` : `${agoHours}h ago`;
  } else if (agoDays === 1) {
    agoStr = isKm ? 'ម្សិលមិញ' : 'Yesterday';
  } else {
    agoStr = isKm ? `${agoDays} ថ្ងៃមុន` : `${agoDays}d ago`;
  }

  return `${durationStr} • ${agoStr}`;
};
