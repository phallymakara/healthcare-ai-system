import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plus, Mic, ArrowUp, X, Image as ImageIcon, Pencil, Trash2, Check } from 'lucide-react';
import {
  getUserConversations,
  saveUserConversation,
  deleteUserConversation,
  updateUserConversationTitle,
  updateConversationTitleAPI,
  deleteConversationAPI,
  formatChatDuration,
  syncUserConversations,
  fetchConversationDetailAPI,
  getActiveConversationId,
  setActiveConversationId,
  ConversationItem,
  StoredMessage,
} from '../../services/chatHistoryService';
import { AuthService, UserProfile } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { useUserLocation } from '../../hooks/useUserLocation';
import { getDeviceHeaders } from '../../services/deviceFingerprint';

interface HealthcareAssistantProps {
  onTicketBooked: (ticket: any) => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToTracker?: () => void;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  triage?: any;
  bookedTicket?: any;
  suggestedActions?: string[];
  requiresDisclaimer?: boolean;
  timestamp: Date;
}

const serializeMessage = (m: ChatMessage): StoredMessage => ({
  id: m.id,
  role: m.role,
  text: m.text,
  imageUrl: m.imageUrl,
  triage: m.triage,
  bookedTicket: m.bookedTicket,
  suggestedActions: m.suggestedActions,
  requiresDisclaimer: m.requiresDisclaimer,
  timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
});

const deserializeMessage = (m: StoredMessage): ChatMessage => ({
  id: m.id,
  role: m.role,
  text: m.text,
  imageUrl: m.imageUrl,
  triage: m.triage,
  bookedTicket: m.bookedTicket,
  suggestedActions: m.suggestedActions,
  requiresDisclaimer: m.requiresDisclaimer ?? Boolean(m.triage?.requires_disclaimer),
  timestamp: new Date(m.timestamp),
});

const isKhmer = (text?: string): boolean => {
  if (!text) return false;
  return /[\u1780-\u17FF]/.test(text);
};

const shouldShowMedicalDisclaimer = (msg: ChatMessage, userQuestion?: string): boolean => {
  if (msg.role !== 'assistant' || msg.id === 'welcome') {
    return false;
  }

  // 1. Structured triage, hospital matches, or booked ticket always requires disclaimer
  if (
    (msg.triage && (msg.triage.matching_hospitals?.length > 0 || msg.triage.urgency_level || msg.triage.requires_disclaimer)) ||
    msg.bookedTicket
  ) {
    return true;
  }

  // 2. Guardrail security/programming refusals never require medical disclaimer
  const resp = (msg.text || '').toLowerCase();
  if (
    resp.includes('i can only assist with healthcare') ||
    resp.includes('only assist with healthcare, medical') ||
    resp.includes('ខ្ញុំអាចជួយផ្ដល់ព័ត៌មានបានតែលើប្រធានបទសុខភាព') ||
    resp.includes('សេវាកម្មវេជ្ជសាស្ត្រតែប៉ុណ្ណោះ')
  ) {
    return false;
  }

  // 3. If explicitly declared by the backend LLM metadata, honor it
  if (typeof msg.requiresDisclaimer === 'boolean') {
    return msg.requiresDisclaimer;
  }

  // 4. Evaluate the chat question asked by the user (covers restored chat history)
  const question = (userQuestion || '').toLowerCase().trim();
  const isGreetingOrIntro =
    /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|night)|thanks|thank\s*you|ok|okay|bye|goodbye|who\s*are\s*you|what\s*can\s*you\s*do|how\s*are\s*you)[\s!.,?]*$/i.test(question) ||
    /^(សួស្តី|ជំរាបសួរ|សួស្ដី|ជម្រាបសួរ|អរគុណ|មិនអីទេ|បាទ|ចាស|យល់ព្រម|អូខេ|លាហើយ|សុខសប្បាយទេ|តើអ្នកជាអ្នកណា|តើអ្នកអាចធ្វើអ្វីបាន)[\s!.,?]*$/u.test(question);

  if (isGreetingOrIntro) {
    return false;
  }

  // 5. If the chat question or assistant response discusses health, symptoms, clinics, or treatments
  const isHealthQuestion =
    /(symptom|doctor|hospital|clinic|pain|ache|fever|cough|sick|ill|disease|treatment|medicine|pill|infection|hurt|injury|bleed|emergency|specialist|health|medical|consult|care)/i.test(question) ||
    /(ឈឺ|គ្រូពេទ្យ|ពេទ្យ|មន្ទីរពេទ្យ|គ្លីនិក|ក្អក|ក្តៅខ្លួន|រោគសញ្ញា|អាការៈ|ព្យាបាល|ថ្នាំ|របួស|ជំងឺ|សុខភាព|ពិគ្រោះ|ពិនិត្យ)/u.test(question);

  const isHealthResponse =
    /(symptom|doctor|hospital|clinic|treatment|diagnos|prescri|medication|fever|cough|pain|infection|blood pressure|heart|disease|injury|wound|dose|emergency)/i.test(resp) ||
    /(ឈឺ|គ្រូពេទ្យ|ពេទ្យ|មន្ទីរពេទ្យ|គ្លីនិក|ក្អក|ក្តៅខ្លួន|រោគសញ្ញា|អាការៈ|ព្យាបាល|ថ្នាំ|រាគ|ក្អួត|វិលមុខ|ដង្ហើម|របួស|សម្ពាធឈាម|បេះដូង|ជំងឺ)/u.test(resp);

  return isHealthQuestion || isHealthResponse;
};


export const HealthcareAssistant: React.FC<HealthcareAssistantProps> = ({
  onTicketBooked,
  onNavigateToDiscovery,
  onNavigateToTracker,
  initialQuery,
  onClearInitialQuery,
  currentUser,
  onOpenAuth,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';
  const { location: userLocation, hasLocation, requestLocation } = useUserLocation();

  const isGuest = !currentUser && !AuthService.getStoredUser();

  // Per-user conversation history state
  const activeUserId = currentUser?.id || 'guest';

  // Restore the last conversation state on component mount (e.g. returning from another page)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const lastActiveId = getActiveConversationId(activeUserId);
      if (lastActiveId === 'new') {
        return [
          {
            id: 'welcome',
            role: 'assistant',
            text: t('chat_welcome'),
            timestamp: new Date(),
          },
        ];
      }
      const localConvs = getUserConversations(activeUserId);
      const targetConv = lastActiveId
        ? localConvs.find((c) => c.id === lastActiveId) || localConvs[0]
        : localConvs[0];
      if (targetConv && targetConv.messages && targetConv.messages.length > 0) {
        return targetConv.messages.map(deserializeMessage);
      }
    } catch (err) {
      console.warn('Could not restore last active conversation:', err);
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: t('chat_welcome'),
        timestamp: new Date(),
      },
    ];
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    try {
      const lastActiveId = getActiveConversationId(activeUserId);
      if (lastActiveId === 'new') return null;
      const localConvs = getUserConversations(activeUserId);
      const targetConv = lastActiveId
        ? localConvs.find((c) => c.id === lastActiveId) || localConvs[0]
        : localConvs[0];
      return targetConv ? targetConv.id : null;
    } catch {
      return null;
    }
  });

  // Sync welcome message on language switch
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], text: t('chat_welcome') }];
      }
      return prev;
    });
  }, [language, t]);

  // Guest rate limit state tracked directly by backend database
  const [guestLimitDetails, setGuestLimitDetails] = useState<{ reached: boolean; minutesRemaining?: number }>({ reached: false });
  const hasReachedLimit = isGuest && guestLimitDetails.reached;

  // Clear guest limit details if user logs in
  useEffect(() => {
    if (!isGuest) {
      setGuestLimitDetails({ reached: false });
    }
  }, [isGuest]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const [conversationList, setConversationList] = useState<ConversationItem[]>([]);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const slashListRef = useRef<HTMLDivElement>(null);

  // Sync conversation list from backend API (authenticated) or localStorage (guest/offline)
  // and load latest conversation if returning from another page
  useEffect(() => {
    let isMounted = true;
    syncUserConversations(activeUserId).then(async (list) => {
      if (!isMounted) return;
      setConversationList(list);

      const lastActiveId = getActiveConversationId(activeUserId);
      if (lastActiveId === 'new') {
        return;
      }

      const targetConv = lastActiveId
        ? list.find((c) => c.id === lastActiveId) || list[0]
        : list[0];

      if (targetConv) {
        let msgs = targetConv.messages;
        if (!msgs || msgs.length === 0) {
          const detail = await fetchConversationDetailAPI(targetConv.id);
          if (detail && detail.messages && detail.messages.length > 0) {
            msgs = detail.messages;
          }
        }
        if (msgs && msgs.length > 0 && isMounted) {
          setMessages(msgs.map(deserializeMessage));
          setCurrentConversationId(targetConv.id);
          setActiveConversationId(activeUserId, targetConv.id);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeUserId]);

  // Handle external initial query if passed (e.g., from search)
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendQuery(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery]);

  const isSlashActive = inputText.startsWith('/');
  const slashQuery = isSlashActive ? inputText.slice(1).trim().toLowerCase() : '';
  const filteredConversations = conversationList.filter((c) => {
    if (!slashQuery) return true;
    return (
      c.title.toLowerCase().includes(slashQuery) ||
      c.messages.some((m) => m.text && m.text.toLowerCase().includes(slashQuery))
    );
  });

  useEffect(() => {
    setSlashSelectedIndex(0);
  }, [slashQuery, isSlashActive]);

  const handleSelectConversation = async (conv: ConversationItem) => {
    let messagesToRestore = conv.messages;
    if (!messagesToRestore || messagesToRestore.length === 0) {
      const detail = await fetchConversationDetailAPI(conv.id);
      if (detail && detail.messages && detail.messages.length > 0) {
        messagesToRestore = detail.messages;
      }
    }
    const restored = (messagesToRestore || []).map(deserializeMessage);
    setMessages(
      restored.length > 0
        ? restored
        : [
          {
            id: 'welcome',
            role: 'assistant',
            text: t('chat_welcome'),
            timestamp: new Date(),
          },
        ]
    );
    setCurrentConversationId(conv.id);
    setActiveConversationId(activeUserId, conv.id);
    setInputText('');
    setSlashSelectedIndex(0);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: t('chat_welcome'),
        timestamp: new Date(),
      },
    ]);
    setCurrentConversationId(null);
    setActiveConversationId(activeUserId, 'new');
    setInputText('');
    setSlashSelectedIndex(0);
  };

  // Inline editing state for conversation titles
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartEdit = (conv: ConversationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingConvId(null);
  };

  const handleSaveEdit = async (convId: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    if (e) e.preventDefault();
    const clean = editingTitle.trim();
    if (!clean) {
      setEditingConvId(null);
      return;
    }

    updateUserConversationTitle(activeUserId, convId, clean);
    if (!isGuest) {
      updateConversationTitleAPI(convId, clean).catch(() => { });
    }

    setConversationList((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: clean } : c))
    );
    setEditingConvId(null);
  };

  const handleDeleteConversation = async (convId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    deleteUserConversation(activeUserId, convId);
    if (!isGuest) {
      deleteConversationAPI(convId).catch(() => { });
    }
    setConversationList((prev) => prev.filter((c) => c.id !== convId));

    if (currentConversationId === convId) {
      handleStartNewChat();
    }
  };

  // Close attachment popup menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isAttachMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isAttachMenuOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setInputError(language === 'km' ? 'សូមជ្រើសរើសឯកសាររូបភាព (.png, .jpg, .jpeg, .webp)' : 'Please select a valid image file (.png, .jpg, .jpeg, .webp).');
      return;
    }
    setSelectedImage(file);
    setInputError(null);
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setImagePreviewUrl(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInputError(language === 'km' ? 'កម្មវិធីរុករកមិនគាំទ្រការទទួលសំឡេងទេ' : 'Voice input is not supported in your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'km' ? 'km-KH' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: loading ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendQuery = async (queryText: string, attachedImageUrl?: string) => {
    const query = queryText.trim();
    if (!query && !attachedImageUrl) {
      setInputError(language === 'km' ? 'សូមបញ្ចូលសំណួរ ឬភ្ជាប់រូបភាព' : 'Please enter a question or attach an image.');
      return;
    }

    if (hasReachedLimit) {
      onOpenAuth?.();
      return;
    }

    setInputError(null);
    setInputText('');

    // 1. Append User Message
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: query || (language === 'km' ? 'រូបភាពដែលបានភ្ជាប់' : 'Attached image'),
      imageUrl: attachedImageUrl,
      timestamp: new Date(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    // Save/update user message in conversation storage
    const convId = currentConversationId || `conv_${Date.now()}`;
    if (!currentConversationId) {
      setCurrentConversationId(convId);
    }
    setActiveConversationId(activeUserId, convId);
    const existingConv = conversationList.find((c) => c.id === convId);
    const convTitle =
      existingConv?.title ||
      query.slice(0, 48).trim() ||
      (language === 'km' ? 'ការពិគ្រោះជំងឺ' : 'Health Consultation');

    const baseConvItem: ConversationItem = {
      id: convId,
      userId: activeUserId,
      title: convTitle,
      createdAt: existingConv?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: nextMessages.length,
      messages: nextMessages.map(serializeMessage),
    };
    saveUserConversation(activeUserId, baseConvItem);
    setActiveConversationId(activeUserId, baseConvItem.id);
    setConversationList(getUserConversations(activeUserId));

    const persistAssistantReply = (assistantMsg: ChatMessage) => {
      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      const updatedConv: ConversationItem = {
        ...baseConvItem,
        updatedAt: new Date().toISOString(),
        messageCount: finalMessages.length,
        messages: finalMessages.map(serializeMessage),
      };
      saveUserConversation(activeUserId, updatedConv);
      setActiveConversationId(activeUserId, updatedConv.id);
      setConversationList(getUserConversations(activeUserId));
    };

    if (!hasLocation) {
      requestLocation();
    }

    const streamMsgId = String(Date.now() + 1);
    setStreamingMsgId(streamMsgId);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch(`${API_BASE}/assistant/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
          ...getDeviceHeaders(),
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          language: isKhmer(query) ? 'km' : (/[a-zA-Z]/.test(query) ? 'en' : language),
          user_latitude: userLocation?.latitude,
          user_longitude: userLocation?.longitude,
          conversation_id: (currentConversationId && !currentConversationId.startsWith('conv_')) ? currentConversationId : undefined,
          image_url: attachedImageUrl || undefined,
        }),
      });

      if (res.status === 401) {
        onOpenAuth?.();
        return;
      }

      if (res.status === 429) {
        const errJson = await res.json().catch(() => null);
        const minsLeft = errJson?.detail?.minutes_remaining || 60;
        setGuestLimitDetails({ reached: true, minutesRemaining: minsLeft });
        onOpenAuth?.();
        return;
      }

      if (!res.ok || !res.body) {
        const fallbackMsg: ChatMessage = {
          id: streamMsgId,
          role: 'assistant',
          text: isKhmer(query)
            ? 'សូមអភ័យទោស ខ្ញុំមិនអាចទាក់ទងជំនួយការវេជ្ជសាស្ត្របានជាបណ្តោះអាសន្នទេ។ សូមពិនិត្យមើលបណ្តាញរបស់អ្នក ឬព្យាយាមម្តងទៀតនៅបន្តិចក្រោយ។'
            : 'I apologize, I am temporarily unable to reach the medical assistant. Please check your connection or try again in a moment.',
          timestamp: new Date(),
        };
        persistAssistantReply(fallbackMsg);
        return;
      }

      // Read SSE stream with smooth progressive display queue
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let rawTargetText = '';
      let displayedText = '';
      let streamStarted = false;
      let metadata: any = null;
      let tickerInterval: any = null;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 60fps smooth progressive ticker advancing displayedText towards rawTargetText
      tickerInterval = setInterval(() => {
        const diff = rawTargetText.length - displayedText.length;
        if (diff > 0) {
          if (!streamStarted) {
            streamStarted = true;
            setMessages((prev) => [
              ...prev,
              {
                id: streamMsgId,
                role: 'assistant',
                text: '',
                timestamp: new Date(),
              },
            ]);
          }

          if (prefersReducedMotion) {
            displayedText = rawTargetText;
          } else {
            // Adaptive cadence step size:
            // diff <= 4: advance 1 char for natural smooth reading flow
            // diff 5-14: advance 2 chars
            // diff 15-30: advance 3-4 chars
            // diff > 30: catch up smoothly with diff / 5
            let step = 1;
            if (diff > 40) {
              step = Math.ceil(diff / 5);
            } else if (diff > 20) {
              step = 4;
            } else if (diff > 10) {
              step = 2;
            } else {
              step = 1;
            }
            displayedText = rawTargetText.slice(0, displayedText.length + step);
          }

          setMessages((prev) =>
            prev.map((m) => (m.id === streamMsgId ? { ...m, text: displayedText } : m))
          );
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
      }, 18);

      const processEvent = (eventType: string, dataStr: string) => {
        try {
          const parsed = JSON.parse(dataStr);
          if (eventType === 'token') {
            const delta = parsed.delta || '';
            rawTargetText += delta;
          } else if (eventType === 'metadata') {
            metadata = parsed;
          }
        } catch (e) {
          console.warn('SSE event parse error:', e);
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split(/\r?\n\r?\n/);
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
              processEvent(eventType, dataStr);
            }
          }
        }

        if (buffer.trim()) {
          const lines = buffer.split(/\r?\n/);
          let eventType = 'message';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr += (dataStr ? '\n' : '') + line.slice(5).trim();
            }
          }
          if (dataStr) {
            processEvent(eventType, dataStr);
          }
        }

        // Wait for smooth display ticker to catch up to the full response
        await new Promise<void>((resolve) => {
          const checkDone = setInterval(() => {
            if (displayedText.length >= rawTargetText.length) {
              clearInterval(checkDone);
              if (tickerInterval) clearInterval(tickerInterval);
              displayedText = rawTargetText;
              resolve();
            }
          }, 18);
        });
      } finally {
        if (tickerInterval) clearInterval(tickerInterval);
      }

      // Stream completed - finalize conversation state and metadata
      setStreamingMsgId(null);

      if (metadata?.conversation_id) {
        setCurrentConversationId(metadata.conversation_id);
        baseConvItem.id = metadata.conversation_id;
        setActiveConversationId(activeUserId, metadata.conversation_id);
      }

      const hasMatchingHospitals = metadata?.matching_hospitals && metadata.matching_hospitals.length > 0;
      const finalAssistantMsg: ChatMessage = {
        id: streamMsgId,
        role: 'assistant',
        text: displayedText || rawTargetText || (isKhmer(query) ? 'ខ្ញុំនៅទីនេះដើម្បីជួយសម្រួលការសាកសួរសុខភាពរបស់អ្នក។' : 'I am here to assist with your healthcare inquiries.'),
        triage: hasMatchingHospitals ? {
          urgency_level: metadata?.urgency_level || 'STANDARD',
          recommended_specialty: metadata?.recommended_specialty || 'General Care',
          matching_hospitals: metadata.matching_hospitals,
          requires_disclaimer: Boolean(metadata?.requires_disclaimer),
        } : (metadata?.requires_disclaimer ? { requires_disclaimer: true } : undefined),
        bookedTicket: metadata?.booked_ticket || undefined,
        suggestedActions: metadata?.suggested_actions || [],
        requiresDisclaimer: Boolean(metadata?.requires_disclaimer),
        timestamp: new Date(),
      };
      persistAssistantReply(finalAssistantMsg);
    } catch {
      const errorMsg: ChatMessage = {
        id: streamMsgId,
        role: 'assistant',
        text: isKhmer(query)
          ? 'បញ្ហាតភ្ជាប់បណ្តាញពេលដំណើរការសាររបស់អ្នក។ សូមពិនិត្យមើលបណ្តាញរបស់អ្នក ហើយព្យាយាមម្តងទៀត។'
          : 'Connection issue while processing your message. Please check your network and try again.',
        timestamp: new Date(),
      };
      persistAssistantReply(errorMsg);
    } finally {
      setLoading(false);
      setStreamingMsgId(null);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (loading) return;
    if (e) e.preventDefault();
    if (hasReachedLimit) {
      onOpenAuth?.();
      return;
    }
    const currentImg = imagePreviewUrl;
    const textToSend = inputText.trim();
    if (!textToSend && !currentImg) return;
    handleSendQuery(textToSend, currentImg || undefined);
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSlashActive) {
      const totalOptions = 1 + filteredConversations.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % totalOptions);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (slashSelectedIndex === 0) {
          handleStartNewChat();
        } else {
          const selectedConv = filteredConversations[slashSelectedIndex - 1];
          if (selectedConv) {
            handleSelectConversation(selectedConv);
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setInputText('');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Automatically send initial query if passed from landing hero input
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      const q = initialQuery.trim();
      onClearInitialQuery?.();
      handleSendQuery(q);
    }
  }, [initialQuery]);

  const handleActionClick = (actionText: string, msg?: ChatMessage) => {
    if (hasReachedLimit) {
      onOpenAuth?.();
      return;
    }

    if (actionText === 'View in Live Queue' || actionText === 'View Live Queue' || actionText === 'View Ticket' || actionText === t('view_live_queue')) {
      if (msg?.bookedTicket) {
        onTicketBooked(msg.bookedTicket);
      } else if (onNavigateToTracker) {
        onNavigateToTracker();
      }
      return;
    }

    if (actionText === 'Explore All Facilities' || actionText === 'Explore Hospitals & Clinics' || actionText === 'Find Hospital') {
      if (onNavigateToDiscovery) {
        onNavigateToDiscovery();
        return;
      }
    }

    // Trigger the action query directly
    handleSendQuery(actionText);
  };



  return (
    <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: '1060px', margin: '0 auto', fontFamily: kmFont }}>
      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.75rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: 0,
      }}>
        {messages.map((msg, idx) => {
          const isKm = isKhmer(msg.text);
          const isUser = msg.role === 'user';
          const prevUserMsg = messages.slice(0, idx).reverse().find((m) => m.role === 'user');
          const isResponseKhmer = isKhmer(msg.text) || (prevUserMsg ? isKhmer(prevUserMsg.text) : language === 'km');
          return (
            <div
              key={msg.id}
              className="chat-bubble-animate"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                width: '100%',
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '0.25rem',
                fontWeight: 500,
                fontFamily: isKm ? 'var(--font-khmer)' : 'inherit',
              }}>
                {isUser ? (language === 'km' ? 'អ្នក' : 'You') : (language === 'km' ? 'ជំនួយការ AI វេជ្ជសាស្ត្រ' : 'Healthcare Assistant')}
              </div>

              <div style={{
                maxWidth: isUser ? '85%' : '100%',
                padding: isUser ? '0.5rem 0.9rem' : '0.25rem 0',
                background: isUser ? '#ffffff' : 'transparent',
                border: isUser ? '1px solid var(--border-color)' : 'none',
                borderRadius: isUser ? '16px' : '0',
                boxShadow: 'none',
                fontSize: isKm ? '1.05rem' : '0.98rem',
                fontWeight: 400,
                fontFamily: isKm ? 'var(--font-khmer)' : 'inherit',
                color: 'var(--text-main)',
                lineHeight: isKm ? 1.75 : 1.6,
                wordBreak: 'break-word',
                boxSizing: 'border-box',
              }}>
                {/* Uploaded Image Attachment in User Message */}
                {msg.imageUrl && (
                  <div style={{ marginBottom: '0.45rem' }}>
                    <img
                      src={msg.imageUrl}
                      alt="Attachment"
                      style={{
                        maxWidth: '240px',
                        maxHeight: '180px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1px solid var(--border-color)',
                        display: 'block',
                      }}
                    />
                  </div>
                )}

                {/* Markdown Formatted Text */}
                <div style={{ color: 'var(--text-main)', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: isUser ? '0' : '0.4rem 0', fontSize: 'inherit', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</p>,
                      h1: ({ children }) => <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.65rem 0 0.35rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h3>,
                      h2: ({ children }) => <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0.6rem 0 0.35rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h3>,
                      h3: ({ children }) => <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.55rem 0 0.25rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h4>,
                      h4: ({ children }) => <h5 style={{ fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0.25rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h5>,
                      ul: ({ children }) => <ul style={{ margin: '0.4rem 0', paddingLeft: '1.25rem' }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: '0.4rem 0', paddingLeft: '1.25rem' }}>{children}</ol>,
                      li: ({ children }) => <li style={{ margin: '0.2rem 0', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                      code: ({ children }) => (
                        <code style={{
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                          background: 'rgba(0,0,0,0.04)',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '3px',
                          border: '1px solid var(--border-color)',
                        }}>
                          {children}
                        </code>
                      ),
                      a: ({ href, children }) => {
                        const isMapLink = href?.includes('maps.google') || href?.includes('google.com/maps');
                        if (isMapLink) {
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '0.35rem 0.85rem',
                                margin: '0.35rem 0 0.15rem 0',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: 'var(--text-main)',
                                background: '#f8fafc',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-full)',
                                textDecoration: 'none',
                                boxShadow: 'none',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--text-main)';
                                e.currentTarget.style.background = '#f1f5f9';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.background = '#f8fafc';
                              }}
                            >
                              <span>📍</span>
                              <span>{children}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>↗</span>
                            </a>
                          );
                        }
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#2563eb',
                              textDecoration: 'underline',
                              fontWeight: 500,
                            }}
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                  {streamingMsgId === msg.id && (
                    <span className="streaming-cursor" aria-hidden="true" />
                  )}
                </div>



                {/* Contextual Next Action Buttons */}
                {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.85rem',
                    paddingTop: '0.5rem',
                  }}>
                    {msg.suggestedActions.map((action, aIdx) => {
                      const isActionKm = isKhmer(action);
                      return (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(action, msg)}
                          disabled={loading}
                          style={{
                            padding: isActionKm ? '0.4rem 0.85rem' : '0.35rem 0.85rem',
                            fontSize: isActionKm ? '0.82rem' : '0.75rem',
                            fontFamily: isActionKm ? 'var(--font-khmer)' : 'inherit',
                            fontWeight: 500,
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-full)',
                            color: 'var(--text-main)',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: loading ? 0.6 : 1,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              e.currentTarget.style.borderColor = 'var(--text-main)';
                              e.currentTarget.style.background = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading) {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          {action} →
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Medical Disclaimer Alert on each AI assistant response - Only when suggesting/answering healthcare guidance */}
                {shouldShowMedicalDisclaimer(msg, prevUserMsg?.text) && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.55rem',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: isResponseKhmer ? '0.78rem' : '0.73rem',
                      color: '#64748b',
                      fontFamily: isResponseKhmer ? 'var(--font-khmer)' : 'inherit',
                      lineHeight: 1.5,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <span style={{ flexShrink: 0, fontSize: '0.85rem', lineHeight: 1.2 }}>⚠️</span>
                    <span>
                      {isResponseKhmer
                        ? 'សេចក្តីបញ្ជាក់៖ ការផ្តល់យោបល់របស់ AI គឺសម្រាប់តែព័ត៌មានបឋមប៉ុណ្ណោះ និងមិនជំនួសការធ្វើរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រឡើយ។ សូមពិគ្រោះជាមួយគ្រូពេទ្យជំនាញសម្រាប់ករណីធ្ងន់ធ្ងរ ឬបន្ទាន់។'
                        : 'Disclaimer: AI advice is for informational purposes only and does not replace professional medical diagnosis. Consult a qualified doctor for serious conditions or emergencies.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (!streamingMsgId || !messages.some((m) => m.id === streamingMsgId)) && (() => {
          const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
          const isQuestionKm = lastUserMsg ? isKhmer(lastUserMsg.text) : (language === 'km');
          const loadingFont = isQuestionKm ? 'var(--font-khmer)' : 'inherit';

          return (
            <div
              className="chat-bubble-animate"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%',
                padding: '0.2rem 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem',
                  fontWeight: 500,
                  fontFamily: loadingFont,
                }}
              >
                {isQuestionKm ? 'ជំនួយការ AI វេជ្ជសាស្ត្រ' : 'Healthcare Assistant'}
              </div>

              <div
                className="ai-loading-text"
                style={{
                  fontFamily: loadingFont,
                  lineHeight: 1.6,
                }}
              >
                <span>{isQuestionKm ? 'កំពុងដំណើរការ' : 'Processing'}</span>
                <span className="ai-dot-wrap">
                  <span className="ai-dot">.</span>
                  <span className="ai-dot">.</span>
                  <span className="ai-dot">.</span>
                </span>
              </div>
            </div>
          );
        })()}

        {/* Guest Chat Limit Reached Notice - Text only, no container, no icon */}
        {hasReachedLimit && (
          <div
            style={{
              margin: '1.25rem auto 0.5rem auto',
              textAlign: 'center',
              maxWidth: '560px',
              padding: '0.5rem 1rem',
            }}
          >
            <p
              style={{
                fontSize: isKm ? '0.98rem' : '0.92rem',
                color: '#475569',
                lineHeight: 1.65,
                fontFamily: kmFont,
                margin: 0,
              }}
            >
              {guestLimitDetails.minutesRemaining ? (
                isKm
                  ? `អ្នកបានដល់ដែនកំណត់នៃការពិគ្រោះឥតគិតថ្លៃ (៧ សារ/ម៉ោង)។ នឹងកំណត់ឡើងវិញក្នុងរយៈពេល ${guestLimitDetails.minutesRemaining} នាទី។ `
                  : `You have reached the free consultation limit (7 messages/hour). Resets in ${guestLimitDetails.minutesRemaining} min. `
              ) : (
                `${t('chat_guest_limit_notice')} `
              )}
              <button
                type="button"
                onClick={onOpenAuth}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  fontSize: 'inherit',
                  fontFamily: kmFont,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  display: 'inline',
                }}
              >
                {t('chat_guest_limit_btn')}
              </button>
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Chat Input Form Area */}
      <div style={{
        padding: '0.5rem 0 0.35rem 0',
        background: 'var(--bg-primary, #f6faf6)',
        position: 'sticky',
        bottom: 0,
        zIndex: 30,
      }}>
        {/* Slash Command / Conversation History List (ONE single main container) */}
        {isSlashActive && (
          <div
            ref={slashListRef}
            style={{
              width: '100%',
              maxHeight: '280px',
              overflowY: 'auto',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: 'none',
              padding: '5px',
              marginBottom: '0.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              boxSizing: 'border-box',
            }}
          >
            {/* Action 1: New Chat */}
            <button
              type="button"
              onClick={handleStartNewChat}
              style={{
                width: '100%',
                background: slashSelectedIndex === 0 ? 'var(--bg-hover, #f1f5f9)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                boxShadow: 'none',
                padding: '0.6rem 0.8rem',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={() => setSlashSelectedIndex(0)}
            >
              <span>+ {language === 'km' ? 'ការជជែកថ្មី' : 'New chat'}</span>
            </button>

            {filteredConversations.length > 0 && (
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 4px' }} />
            )}

            {/* Conversation History List Rows (with inline edit & delete actions) */}
            {filteredConversations.length === 0 ? (
              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {language === 'km' ? 'មិនមានប្រវត្តិសន្ទនាទេ' : 'No saved conversations'}
              </div>
            ) : (
              filteredConversations.map((conv, idx) => {
                const isSelected = slashSelectedIndex === idx + 1;
                const isEditingThis = editingConvId === conv.id;

                if (isEditingThis) {
                  return (
                    <div
                      key={conv.id}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        background: 'var(--bg-hover, #f1f5f9)',
                        border: 'none',
                        boxShadow: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.8rem',
                        gap: '0.5rem',
                        boxSizing: 'border-box',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') handleSaveEdit(conv.id, e);
                            if (e.key === 'Escape') handleCancelEdit(e as any);
                          }}
                          autoFocus
                          style={{
                            width: '100%',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            padding: '2px 0',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            background: 'transparent',
                            color: 'var(--text-main)',
                            fontFamily: (language === 'km' || isKhmer(editingTitle)) ? 'var(--font-khmer)' : 'inherit',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          flexShrink: 0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(conv.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            boxShadow: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: 'var(--accent-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e2e8f0';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                          }}
                          title={language === 'km' ? 'រក្សាទុក' : 'Save'}
                          aria-label="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          style={{
                            background: 'none',
                            border: 'none',
                            boxShadow: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e2e8f0';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                          }}
                          title={language === 'km' ? 'បោះបង់' : 'Cancel'}
                          aria-label="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={conv.id}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--bg-hover, #f1f5f9)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.8rem',
                      gap: '0.5rem',
                      transition: 'background var(--transition-fast)',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={() => setSlashSelectedIndex(idx + 1)}
                  >
                    {/* Clickable Area for Selecting Conversation */}
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conv)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: 'var(--text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: (language === 'km' || isKhmer(conv.title)) ? 'var(--font-khmer)' : 'inherit',
                        }}
                      >
                        {conv.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                        }}
                      >
                        {formatChatDuration(conv, language)}
                      </div>
                    </button>

                    {/* Action Buttons: Edit and Delete */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        flexShrink: 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(conv, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          cursor: 'pointer',
                          color: '#64748b',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color var(--transition-fast), background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-main)';
                          e.currentTarget.style.background = '#e2e8f0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#64748b';
                          e.currentTarget.style.background = 'none';
                        }}
                        title={language === 'km' ? 'កែសម្រួលឈ្មោះ' : 'Rename'}
                        aria-label="Rename"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          cursor: 'pointer',
                          color: '#64748b',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color var(--transition-fast), background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#dc2626';
                          e.currentTarget.style.background = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#64748b';
                          e.currentTarget.style.background = 'none';
                        }}
                        title={language === 'km' ? 'លុបការសន្ទនា' : 'Delete'}
                        aria-label="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        <form
          onSubmit={handleSendMessage}
          className="chat-ai-input-form"
          style={{
            width: '100%',
            background: hasReachedLimit ? '#f8fafc' : '#ffffff',
            border: hasReachedLimit ? '1px solid #cbd5e1' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '12px 14px 11px 14px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: imagePreviewUrl ? 'flex-start' : 'center',
            gap: imagePreviewUrl ? '6px' : 0,
            minHeight: '58px',
            boxSizing: 'border-box',
            cursor: hasReachedLimit ? 'pointer' : 'text',
          }}
          onClick={() => {
            if (hasReachedLimit) onOpenAuth?.();
          }}
        >
          {/* Selected Image Preview (if present) */}
          {imagePreviewUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0 2px 2px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1px solid var(--border-color)',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedImage();
                  }}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#475569',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title="Remove image"
                >
                  <X size={10} />
                </button>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {selectedImage?.name}
              </span>
            </div>
          )}

          {/* Single-Line Row: Plus Icon, Text Area, Mic & Send Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: '8px',
            }}
          >
            {/* Left: Plus button with attachment popup */}
            <div
              ref={attachMenuRef}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (loading || hasReachedLimit) return;
                  setIsAttachMenuOpen((prev) => !prev);
                }}
                disabled={loading || hasReachedLimit}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: (loading || hasReachedLimit) ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isAttachMenuOpen ? 'var(--accent-primary)' : '#64748b',
                  transition: 'color var(--transition-fast), transform var(--transition-fast)',
                  borderRadius: '4px',
                  flexShrink: 0,
                  transform: isAttachMenuOpen ? 'rotate(45deg)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !hasReachedLimit) {
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAttachMenuOpen) {
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
                aria-label={language === 'km' ? 'បន្ថែមឯកសារ ឬរូបភាព' : 'Add attachment'}
                title={language === 'km' ? 'បន្ថែមឯកសារ ឬរូបភាព' : 'Add attachment'}
                aria-expanded={isAttachMenuOpen}
              >
                <Plus size={20} strokeWidth={2.2} />
              </button>

              {/* Popup Container: Upload Image Button */}
              {isAttachMenuOpen && (
                <div
                  className="chat-attach-popup-menu"
                  role="menu"
                  aria-label="Attachment options"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAttachMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="action-popup-item"
                    style={{
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      gap: '0.6rem',
                    }}
                  >
                    <ImageIcon size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span>{language === 'km' ? 'បញ្ចូលរូបភាព' : 'Upload image'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Middle: Textarea in single line */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              }}
              placeholder={hasReachedLimit ? t('chat_guest_limit_placeholder') : (language === 'km' ? 'សួរសំណួរ ឬពិគ្រោះរោគសញ្ញា...' : 'Ask anything')}
              disabled={loading || hasReachedLimit}
              rows={1}
              className="chat-ai-textarea"
              style={{
                flex: 1,
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderWidth: 0,
                borderStyle: 'none',
                borderColor: 'transparent',
                outline: 'none',
                outlineWidth: 0,
                outlineColor: 'transparent',
                boxShadow: 'none',
                WebkitBoxShadow: 'none',
                WebkitAppearance: 'none',
                appearance: 'none',
                resize: 'none',
                padding: '4px 0',
                margin: 0,
                fontSize: (language === 'km' || isKhmer(inputText)) ? '1.02rem' : '0.96rem',
                fontFamily: (language === 'km' || isKhmer(inputText)) ? 'var(--font-khmer)' : 'inherit',
                color: 'var(--text-main)',
                lineHeight: 1.45,
                minHeight: '26px',
                maxHeight: '100px',
                boxSizing: 'border-box',
                display: 'block',
              }}
            />

            {/* Right: Mic & Send Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVoice();
                }}
                disabled={loading || hasReachedLimit}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: (loading || hasReachedLimit) ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isListening ? 'var(--accent-primary)' : '#64748b',
                  transition: 'color var(--transition-fast), transform var(--transition-fast)',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !hasReachedLimit) {
                    e.currentTarget.style.color = 'var(--accent-primary)';
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isListening) {
                    e.currentTarget.style.color = '#64748b';
                  }
                  e.currentTarget.style.transform = 'none';
                }}
                aria-label="Voice input"
                title={language === 'km' ? 'និយាយជាសំឡេង' : 'Voice input'}
              >
                <Mic size={19} />
              </button>

              {hasReachedLimit ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAuth?.();
                  }}
                  className="btn btn-primary"
                  style={{
                    padding: '0.4rem 0.9rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: kmFont,
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'none',
                  }}
                >
                  <span>{t('chat_guest_limit_btn')}</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || (!inputText.trim() && !selectedImage)}
                  className="chat-send-btn"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (inputText.trim() || selectedImage) && !loading
                      ? 'var(--accent-primary)'
                      : '#e2e8f0',
                    color: (inputText.trim() || selectedImage) && !loading
                      ? '#ffffff'
                      : '#94a3b8',
                    cursor: (loading || (!inputText.trim() && !selectedImage)) ? 'not-allowed' : 'pointer',
                    transition: 'none',
                    animation: 'none',
                    padding: 0,
                    boxShadow: 'none',
                  }}
                  aria-label={t('chat_send')}
                  title={t('chat_send')}
                >
                  <ArrowUp size={17} strokeWidth={2.4} />
                </button>
              )}
            </div>
          </div>
        </form>

        {inputError && (
          <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.4rem', textAlign: 'center' }}>
            {inputError}
          </div>
        )}

        {/* AI Medical Disclaimer */}
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: '0.55rem',
          lineHeight: 1.4,
          fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
        }}>
          {t('ai_disclaimer')}
        </div>
      </div>


    </div>
  );
};
