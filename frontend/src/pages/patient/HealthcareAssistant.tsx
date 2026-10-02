import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plus, Mic, ArrowUp, X, Image as ImageIcon, Pencil, Trash2, Check, Clock, Loader2, Sparkles } from 'lucide-react';
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
  CitedSource,
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
  citedSources?: CitedSource[];
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
  citedSources: m.citedSources,
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
  citedSources: m.citedSources || m.triage?.cited_sources || [],
  requiresDisclaimer: m.requiresDisclaimer ?? Boolean(m.triage?.requires_disclaimer),
  timestamp: new Date(m.timestamp),
});

const isKhmer = (text?: string): boolean => {
  if (!text) return false;
  return /[\u1780-\u17FF]/.test(text);
};

const getDefaultWelcomeActions = (isKm: boolean): string[] =>
  isKm
    ? ['ពិគ្រោះរោគសញ្ញាជំងឺ', 'ស្វែងរកមន្ទីរពេទ្យនៅជិតខ្ញុំ', 'សេវាសង្គ្រោះបន្ទាន់ ២៤/៧']
    : ['Check My Symptoms', 'Find Hospitals Near Me', '24/7 Emergency Services'];

const cleanActionText = (action: string): string => {
  if (!action) return '';
  return action
    .replace(/\[([^\]]+)\](?:\([^)]*\))?/g, '$1')
    .replace(/\(#[^)]*\)/g, '')
    .replace(/[\[\]#]/g, '')
    .replace(/^[-\s*•]+/, '')
    .trim();
};

const shouldShowMedicalDisclaimer = (msg: ChatMessage, userQuestion?: string): boolean => {
  if (msg.role !== 'assistant' || msg.id === 'welcome') {
    return false;
  }

  // 1. Structured triage, hospital matches, cited official sources, or booked ticket always requires disclaimer
  if (
    (msg.triage && (msg.triage.matching_hospitals?.length > 0 || msg.triage.urgency_level || msg.triage.requires_disclaimer)) ||
    (msg.citedSources && msg.citedSources.length > 0) ||
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

interface MessageBubbleProps {
  msg: ChatMessage;
  idx: number;
  prevUserMsgText?: string;
  language: string;
  streamingMsgId: string | null;
  loading: boolean;
  onEnlargeImage: (url: string) => void;
  onActionClick: (action: string, msg: ChatMessage) => void;
}

const MessageBubble = React.memo<MessageBubbleProps>(({
  msg,
  idx,
  prevUserMsgText,
  language,
  streamingMsgId,
  loading,
  onEnlargeImage,
  onActionClick,
}) => {
  const isKm = isKhmer(msg.text);
  const isUser = msg.role === 'user';
  const isResponseKhmer = isKm || (prevUserMsgText ? isKhmer(prevUserMsgText) : language === 'km');

  const markdownComponents = useMemo(() => ({
    p: ({ children }: any) => <p style={{ margin: isUser ? '0' : '0.4rem 0', fontSize: 'inherit', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</p>,
    h1: ({ children }: any) => <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.65rem 0 0.35rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h3>,
    h2: ({ children }: any) => <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0.6rem 0 0.35rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h3>,
    h3: ({ children }: any) => <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.55rem 0 0.25rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h4>,
    h4: ({ children }: any) => <h5 style={{ fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0.25rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h5>,
    ul: ({ children }: any) => <ul style={{ margin: '0.4rem 0', paddingLeft: '1.25rem' }}>{children}</ul>,
    ol: ({ children }: any) => <ol style={{ margin: '0.4rem 0', paddingLeft: '1.25rem' }}>{children}</ol>,
    li: ({ children }: any) => <li style={{ margin: '0.2rem 0', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</li>,
    strong: ({ children }: any) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
    code: ({ children }: any) => (
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
    a: ({ href, children }: any) => {
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
            wordBreak: 'break-word',
          }}
        >
          {children}
        </a>
      );
    },
  }), [isUser, isKm]);

  return (
    <div
      className="chat-bubble-animate"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        width: '100%',
      }}
    >
      {(isUser || idx > 0) && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '0.25rem',
          fontWeight: 500,
          fontFamily: isKm ? 'var(--font-khmer)' : 'inherit',
        }}>
          {isUser ? (language === 'km' ? 'អ្នក' : 'You') : (language === 'km' ? 'ជំនួយការ AI វេជ្ជសាស្ត្រ' : 'Healthcare Assistant')}
        </div>
      )}

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
        {msg.imageUrl && (
          <div style={{ marginBottom: '0.45rem' }}>
            <img
              src={msg.imageUrl}
              alt="Attachment"
              onClick={() => onEnlargeImage(msg.imageUrl || '')}
              style={{
                maxWidth: '240px',
                maxHeight: '180px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '1px solid var(--border-color)',
                display: 'block',
                cursor: 'pointer',
                transition: 'opacity var(--transition-fast)',
              }}
              title={language === 'km' ? 'ចុចដើម្បីមើលរូបធំ' : 'Click to enlarge'}
            />
          </div>
        )}

        <div style={{ color: 'var(--text-main)', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>
          <ReactMarkdown components={markdownComponents}>
            {msg.text}
          </ReactMarkdown>
          {streamingMsgId === msg.id && (
            <span className="streaming-cursor" aria-hidden="true" />
          )}
        </div>

        {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '0.85rem',
            paddingTop: '0.5rem',
          }}>
            {msg.suggestedActions.map((action, aIdx) => {
              const cleanAction = cleanActionText(action);
              if (!cleanAction) return null;
              const isActionKm = isKhmer(cleanAction);
              return (
                <button
                  key={aIdx}
                  onClick={() => onActionClick(cleanAction, msg)}
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
                  {cleanAction} →
                </button>
              );
            })}
          </div>
        )}

        {shouldShowMedicalDisclaimer(msg, prevUserMsgText) && (
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
});

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

  // Restore an active conversation on component mount ONLY if one was explicitly active in this browser session
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const lastActiveId = getActiveConversationId(activeUserId);
      if (lastActiveId && lastActiveId !== 'new') {
        const localConvs = getUserConversations(activeUserId);
        const targetConv = localConvs.find((c) => c.id === lastActiveId);
        if (targetConv && targetConv.messages && targetConv.messages.length > 0) {
          return targetConv.messages.map(deserializeMessage);
        }
      }
    } catch (err) {
      console.warn('Could not restore active conversation:', err);
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: t('chat_welcome'),
        suggestedActions: getDefaultWelcomeActions(language === 'km'),
        timestamp: new Date(),
      },
    ];
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    try {
      const lastActiveId = getActiveConversationId(activeUserId);
      if (lastActiveId && lastActiveId !== 'new') {
        const localConvs = getUserConversations(activeUserId);
        const targetConv = localConvs.find((c) => c.id === lastActiveId);
        return targetConv ? targetConv.id : null;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Sync welcome message on language switch
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          ...prev[0],
          text: t('chat_welcome'),
          suggestedActions: getDefaultWelcomeActions(language === 'km'),
        }];
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
  const [hostedImageUrl, setHostedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAnalyzingImageQuestions, setIsAnalyzingImageQuestions] = useState(false);
  const [imagePredictedQuestions, setImagePredictedQuestions] = useState<string[]>([]);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const [conversationList, setConversationList] = useState<ConversationItem[]>([]);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const slashListRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [selectionPopup, setSelectionPopup] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
    placement: 'top' | 'bottom';
  }>({ visible: false, text: '', x: 0, y: 0, placement: 'top' });
  const [quotedText, setQuotedText] = useState<string | null>(null);

  // Sync conversation list from backend API (authenticated) or localStorage (guest/offline)
  // Only restore an existing conversation if one was explicitly active in the current session
  useEffect(() => {
    let isMounted = true;
    syncUserConversations(activeUserId).then(async (list) => {
      if (!isMounted) return;
      setConversationList(list);

      const lastActiveId = getActiveConversationId(activeUserId);
      if (!lastActiveId || lastActiveId === 'new') {
        // Fresh open or New Chat: remain on new chat so user can immediately begin
        return;
      }

      const targetConv = list.find((c) => c.id === lastActiveId);

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
            suggestedActions: getDefaultWelcomeActions(language === 'km'),
            timestamp: new Date(),
          },
        ]
    );
    setCurrentConversationId(conv.id);
    setActiveConversationId(activeUserId, conv.id);
    setInputText('');
    setQuotedText(null);
    setSlashSelectedIndex(0);
    setIsHistoryOpen(false);
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
        suggestedActions: getDefaultWelcomeActions(language === 'km'),
        timestamp: new Date(),
      },
    ]);
    setCurrentConversationId(null);
    setActiveConversationId(activeUserId, 'new');
    setInputText('');
    setQuotedText(null);
    setSlashSelectedIndex(0);
    setIsHistoryOpen(false);
  };

  // Close history list on click outside
  useEffect(() => {
    if (!isHistoryOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (slashListRef.current && !slashListRef.current.contains(e.target as Node)) {
        setIsHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHistoryOpen]);

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

  const compressImage = (file: File, maxDim: number = 1200, quality: number = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const fetchQuestionsForBase64 = async (imgDataUrl: string, lang = language) => {
    try {
      const res = await fetch(`${API_BASE}/assistant/predict-image-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
          ...getDeviceHeaders(),
        },
        body: JSON.stringify({
          image_url: imgDataUrl,
          language: lang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.predicted_questions) && data.predicted_questions.length > 0) {
          setImagePredictedQuestions(data.predicted_questions);
        }
      }
    } catch {
      // LLM unavailable or error - no mock questions
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setInputError(language === 'km' ? 'សូមជ្រើសរើសឯកសាររូបភាព (.png, .jpg, .jpeg, .webp)' : 'Please select a valid image file (.png, .jpg, .jpeg, .webp).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setInputError(language === 'km' ? 'ទំហំរូបភាពមិនត្រូវលើសពី 10MB ទេ' : 'Image size cannot exceed 10MB.');
      return;
    }
    setSelectedImage(file);
    setInputError(null);
    setIsAttachMenuOpen(false);
    setImagePredictedQuestions([]);

    // Fast local preview with compression
    const compressedDataUrl = await compressImage(file, 1200, 0.85);
    setImagePreviewUrl(compressedDataUrl);

    // Upload to server and run LLM vision analysis to predict real questions
    setIsUploadingImage(true);
    setIsAnalyzingImageQuestions(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      const res = await fetch(`${API_BASE}/assistant/upload-image`, {
        method: 'POST',
        headers: {
          ...AuthService.getAuthHeaders(),
          ...getDeviceHeaders(),
        },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setHostedImageUrl(data.image_url);
        if (Array.isArray(data.predicted_questions) && data.predicted_questions.length > 0) {
          setImagePredictedQuestions(data.predicted_questions);
        } else {
          // If server didn't run questions or returned empty, query with compressed base64
          await fetchQuestionsForBase64(compressedDataUrl, language);
        }
      } else {
        // Fallback to predict via compressed preview
        await fetchQuestionsForBase64(compressedDataUrl, language);
      }
    } catch {
      // Fallback to local base64 data URL prediction
      await fetchQuestionsForBase64(compressedDataUrl, language);
    } finally {
      setIsUploadingImage(false);
      setIsAnalyzingImageQuestions(false);
    }
  };

  // Re-predict questions if language changes while an image is selected
  useEffect(() => {
    if (imagePreviewUrl) {
      setImagePredictedQuestions([]);
      setIsAnalyzingImageQuestions(true);
      fetchQuestionsForBase64(imagePreviewUrl, language).finally(() => {
        setIsAnalyzingImageQuestions(false);
      });
    }
  }, [language]);

  const handleTextSelection = useCallback(() => {
    requestAnimationFrame(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const selectedStr = selection.toString().trim();
      if (!selectedStr || selectedStr.length < 2) {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const container = messagesContainerRef.current;
      if (!container || selection.rangeCount === 0) {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const range = selection.getRangeAt(0);

      // Verify that selection starts inside the chat messages container
      const startNode = range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as HTMLElement);
      if (!startNode || !container.contains(startNode)) {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Avoid triggering when selecting inside input fields or interactive buttons
      if (startNode.closest('button, input, textarea')) {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Retrieve precise line-level client rects for first-line top positioning
      const clientRects = range.getClientRects();
      const firstRect = clientRects.length > 0 ? clientRects[0] : range.getBoundingClientRect();
      const entireRect = range.getBoundingClientRect();

      if (firstRect.width === 0 && firstRect.height === 0) {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const containerRect = container.getBoundingClientRect();

      // If selection is scrolled out of the container's visible bounds, hide
      if (entireRect.bottom < containerRect.top || entireRect.top > containerRect.bottom) {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Determine placement: above the first selected line, or below if too close to top edge
      const spaceAbove = firstRect.top - containerRect.top;
      const placement: 'top' | 'bottom' = spaceAbove >= 38 ? 'top' : 'bottom';

      // Precise Y coordinate: 6px gap above top edge (or 6px below bottom edge)
      const popupY = placement === 'top' ? firstRect.top - 6 : firstRect.bottom + 6;

      // Align horizontally with the beginning of the selected text area, clamped inside chat container
      const rawStartX = firstRect.left;
      const popupX = Math.max(containerRect.left + 8, Math.min(containerRect.right - 95, rawStartX));

      setSelectionPopup({
        visible: true,
        text: selectedStr,
        x: popupX,
        y: popupY,
        placement,
      });
    });
  }, []);

  const handleAskAboutSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = selectionPopup.text;
    setSelectionPopup({ visible: false, text: '', x: 0, y: 0, placement: 'top' });
    window.getSelection()?.removeAllRanges();

    setQuotedText(text);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-selection-popup="true"]')) {
        return;
      }
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        }
      }, 30);
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [handleTextSelection]);

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setHostedImageUrl(null);
    setIsUploadingImage(false);
    setIsAnalyzingImageQuestions(false);
    setImagePredictedQuestions([]);
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
      text: query || (language === 'km' ? 'សូមវិភាគរោគសញ្ញារូបភាពនេះ' : 'Please analyze this symptom image'),
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
      let streamStarted = false;
      let metadata: any = null;

      const processEvent = (eventType: string, dataStr: string) => {
        try {
          const parsed = JSON.parse(dataStr);
          if (eventType === 'token') {
            const delta = parsed.delta || '';
            if (delta) {
              rawTargetText += delta;
              if (!streamStarted) {
                streamStarted = true;
                setStreamingMsgId(streamMsgId);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: streamMsgId,
                    role: 'assistant',
                    text: rawTargetText,
                    timestamp: new Date(),
                  },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) => (m.id === streamMsgId ? { ...m, text: rawTargetText } : m))
                );
              }
              messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }
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
      } finally {
        // Stream reading completed
      }

      // Stream completed - finalize conversation state and metadata
      setStreamingMsgId(null);

      if (metadata?.conversation_id) {
        setCurrentConversationId(metadata.conversation_id);
        baseConvItem.id = metadata.conversation_id;
        setActiveConversationId(activeUserId, metadata.conversation_id);
      }

      const hasMatchingHospitals = metadata?.matching_hospitals && metadata.matching_hospitals.length > 0;
      const rawActions = (metadata?.suggested_actions || []) as string[];
      const cleanedActions = rawActions.map(cleanActionText).filter(Boolean);

      const finalAssistantMsg: ChatMessage = {
        id: streamMsgId,
        role: 'assistant',
        text: rawTargetText || (isKhmer(query) ? 'ខ្ញុំនៅទីនេះដើម្បីជួយសម្រួលការសាកសួរសុខភាពរបស់អ្នក។' : 'I am here to assist with your healthcare inquiries.'),
        triage: hasMatchingHospitals ? {
          urgency_level: metadata?.urgency_level || 'STANDARD',
          recommended_specialty: metadata?.recommended_specialty || 'General Care',
          matching_hospitals: metadata.matching_hospitals,
          requires_disclaimer: Boolean(metadata?.requires_disclaimer),
        } : (metadata?.requires_disclaimer ? { requires_disclaimer: true } : undefined),
        bookedTicket: metadata?.booked_ticket || undefined,
        suggestedActions: cleanedActions,
        citedSources: metadata?.cited_sources || [],
        requiresDisclaimer: Boolean(metadata?.requires_disclaimer) || (metadata?.cited_sources && metadata.cited_sources.length > 0),
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
    if (loading || isUploadingImage) return;
    if (e) e.preventDefault();
    if (hasReachedLimit) {
      onOpenAuth?.();
      return;
    }
    const currentImg = hostedImageUrl || imagePreviewUrl;
    const rawText = inputText.trim();
    if (!rawText && !currentImg && !quotedText) return;

    let textToSend = '';
    if (quotedText) {
      if (rawText) {
        textToSend = `${rawText}\n\n> "${quotedText}"`;
      } else {
        textToSend = language === 'km'
          ? `សូមពន្យល់បន្ថែមអំពី "${quotedText}"`
          : `Explain more about "${quotedText}"`;
      }
    } else {
      textToSend = rawText || (
        language === 'km'
          ? 'សូមវិភាគរោគសញ្ញារូបភាពនេះ'
          : 'Please analyze this symptom image'
      );
    }

    handleSendQuery(textToSend, currentImg || undefined);
    removeSelectedImage();
    setQuotedText(null);
  };

  const handleChipClick = (chipText: string) => {
    if (loading || isUploadingImage) return;
    const currentImg = hostedImageUrl || imagePreviewUrl;
    handleSendQuery(chipText, currentImg || undefined);
    removeSelectedImage();
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

  const handleEnlargeImage = useCallback((url: string) => {
    setEnlargedImageUrl(url);
  }, []);

  const handleActionClick = useCallback((actionText: string, msg?: ChatMessage) => {
    if (hasReachedLimit) {
      onOpenAuth?.();
      return;
    }

    const clean = cleanActionText(actionText);
    if (!clean) return;

    if (clean === 'View in Live Queue' || clean === 'View Live Queue' || clean === 'View Ticket' || clean === t('view_live_queue')) {
      if (msg?.bookedTicket) {
        onTicketBooked(msg.bookedTicket);
      } else if (onNavigateToTracker) {
        onNavigateToTracker();
      }
      return;
    }

    if (clean === 'Explore All Facilities' || clean === 'Explore Hospitals & Clinics' || clean === 'Find Hospital') {
      if (onNavigateToDiscovery) {
        onNavigateToDiscovery();
        return;
      }
    }

    // Trigger the action query directly
    handleSendQuery(clean);
  }, [hasReachedLimit, onOpenAuth, onTicketBooked, onNavigateToTracker, onNavigateToDiscovery, t, handleSendQuery]);



  return (
    <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: '1060px', margin: '0 auto', fontFamily: kmFont }}>
      {/* Top Header Row: Healthcare Assistant on left, History on right (same row) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.45rem 0 0.35rem 0',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontFamily: kmFont,
          }}
        >
          {language === 'km' ? 'ជំនួយការ AI វេជ្ជសាស្ត្រ' : 'Healthcare Assistant'}
        </div>

        <button
          type="button"
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: isHistoryOpen ? 'var(--bg-hover, #f1f5f9)' : 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '0.24rem 0.7rem',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--text-main)',
            cursor: 'pointer',
            fontFamily: kmFont,
            boxShadow: 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--text-main)';
            if (!isHistoryOpen) e.currentTarget.style.background = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            if (!isHistoryOpen) e.currentTarget.style.background = 'transparent';
          }}
          title={language === 'km' ? 'ប្រវត្តិការសន្ទនា' : 'Chat History'}
          aria-label={language === 'km' ? 'ប្រវត្តិការសន្ទនា' : 'Chat History'}
        >
          <Clock size={13} />
          <span>{language === 'km' ? 'ប្រវត្តិ' : 'History'}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        className="chat-messages-scroll-area"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        onKeyUp={handleTextSelection}
        onScroll={handleTextSelection}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.15rem 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          minHeight: 0,
        }}
      >
        {messages.map((msg, idx) => {
          const prevUserMsg = messages.slice(0, idx).reverse().find((m) => m.role === 'user');
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              idx={idx}
              prevUserMsgText={prevUserMsg?.text}
              language={language}
              streamingMsgId={streamingMsgId}
              loading={loading}
              onEnlargeImage={handleEnlargeImage}
              onActionClick={handleActionClick}
            />
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
      <div
        className="chat-bottom-input-container"
        style={{
          padding: '0.5rem 0 0.35rem 0',
          background: 'var(--bg-primary, #f6faf6)',
          position: 'sticky',
          bottom: 0,
          zIndex: 30,
        }}
      >
        {/* Slash Command / Conversation History List (ONE single main container) */}
        {(isSlashActive || isHistoryOpen) && (
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
        {/* Dynamic Image Predicted Question Chips (above normal input bar) */}
        {imagePreviewUrl && (
          <>
            {isAnalyzingImageQuestions && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                  padding: '2px 4px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                <Loader2
                  size={13}
                  style={{
                    animation: 'spin 1s linear infinite',
                    color: 'var(--primary-color)',
                  }}
                />
                <span>
                  {language === 'km'
                    ? 'AI កំពុងវិភាគរូបភាព...'
                    : 'AI is analyzing the image...'}
                </span>
              </div>
            )}
            {!isAnalyzingImageQuestions && imagePredictedQuestions.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '8px',
                  padding: '0 4px',
                }}
              >
                {imagePredictedQuestions.map((chipText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChipClick(chipText)}
                    disabled={loading || isUploadingImage}
                    title={language === 'km' ? 'ចុចដើម្បីសួរភ្លាមៗ' : 'Click to ask immediately'}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      color: 'var(--text-main)',
                      fontWeight: 500,
                      cursor: (loading || isUploadingImage) ? 'not-allowed' : 'pointer',
                      fontFamily: (language === 'km' || isKhmer(chipText)) ? 'var(--font-khmer)' : 'inherit',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && !isUploadingImage) {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && !isUploadingImage) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }
                    }}
                  >
                    {chipText}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Quoted / Selected Text Reference Chip */}
        {quotedText && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '6px 12px',
              marginBottom: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              boxShadow: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontStyle: 'italic',
                  fontFamily: (language === 'km' || isKhmer(quotedText)) ? 'var(--font-khmer)' : 'inherit',
                }}
                title={quotedText}
              >
                "{quotedText}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setQuotedText(null)}
              title={language === 'km' ? 'លុបការជ្រើសរើស' : 'Remove reference'}
              aria-label={language === 'km' ? 'លុបការជ្រើសរើស' : 'Remove reference'}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <X size={14} />
            </button>
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
            padding: '8px 14px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxSizing: 'border-box',
            cursor: hasReachedLimit ? 'pointer' : 'text',
          }}
          onClick={() => {
            if (hasReachedLimit) onOpenAuth?.();
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

          {/* Inline Attached Image Thumbnail (normal height, no expansion) */}
          {imagePreviewUrl && (
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={imagePreviewUrl}
                alt="Preview"
                onClick={() => setEnlargedImageUrl(imagePreviewUrl)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  border: '1px solid var(--border-color)',
                  display: 'block',
                  cursor: 'pointer',
                }}
                title={language === 'km' ? 'ចុចដើម្បីមើលធំ' : 'Click to enlarge'}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSelectedImage();
                }}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '13px',
                  height: '13px',
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
                <X size={8} />
              </button>
            </div>
          )}

            {/* Middle: Textarea in single line */}
            <textarea
              ref={chatInputRef}
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
                  disabled={loading || (!inputText.trim() && !selectedImage && !quotedText)}
                  className="chat-send-btn"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (inputText.trim() || selectedImage || quotedText) && !loading
                      ? 'var(--accent-primary)'
                      : '#e2e8f0',
                    color: (inputText.trim() || selectedImage || quotedText) && !loading
                      ? '#ffffff'
                      : '#94a3b8',
                    cursor: (loading || (!inputText.trim() && !selectedImage && !quotedText)) ? 'not-allowed' : 'pointer',
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
        </form>

        {inputError && (
          <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.4rem', textAlign: 'center' }}>
            {inputError}
          </div>
        )}

        {/* AI Medical Disclaimer */}
        <div
          className="chat-disclaimer-text"
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '0.55rem',
            lineHeight: 1.4,
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
        >
          {t('ai_disclaimer')}
        </div>
      </div>

      {/* Lightbox Modal for Fullscreen Image Inspection */}
      {enlargedImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setEnlargedImageUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setEnlargedImageUrl(null)}
              style={{
                position: 'absolute',
                top: '-36px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85rem',
              }}
              title={language === 'km' ? 'បិទ' : 'Close'}
            >
              <X size={20} />
            </button>
            <img
              src={enlargedImageUrl}
              alt="Enlarged symptom view"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Ask AI Button for Highlighted / Selected Text */}
      {selectionPopup.visible && (
        <button
          type="button"
          data-selection-popup="true"
          onClick={handleAskAboutSelection}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          title={language === 'km' ? 'សួរ AI អំពីចំណុចដែលបានជ្រើសរើស' : 'Ask AI about selected text'}
          style={{
            position: 'fixed',
            left: `${selectionPopup.x}px`,
            top: `${selectionPopup.y}px`,
            transform: selectionPopup.placement === 'top' ? 'translate(0, -100%)' : 'translate(0, 0)',
            zIndex: 9999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 10px',
            cursor: 'pointer',
            boxShadow: 'none',
            color: 'var(--text-main)',
            transition: 'border-color var(--transition-fast), color var(--transition-fast)',
            userSelect: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.color = 'var(--primary-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--primary-color)' }} />
          <span>{language === 'km' ? 'សួរ AI' : 'Ask AI'}</span>
        </button>
      )}

    </div>
  );
};
