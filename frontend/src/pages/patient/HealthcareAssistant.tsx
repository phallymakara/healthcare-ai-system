import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, RefreshCw } from 'lucide-react';
import { AuthService, UserProfile } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { useUserLocation } from '../../hooks/useUserLocation';

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
  triage?: any;
  bookedTicket?: any;
  suggestedActions?: string[];
  timestamp: Date;
}

const isKhmer = (text?: string): boolean => {
  if (!text) return false;
  return /[\u1780-\u17FF]/.test(text);
};

const shouldShowMedicalDisclaimer = (msg: ChatMessage, prevUserMsg?: ChatMessage): boolean => {
  if (msg.role !== 'assistant' || msg.id === 'welcome') {
    return false;
  }

  // Always show if structured triage, hospital matches, or urgency level is present
  if (msg.triage && (msg.triage.matching_hospitals?.length > 0 || msg.triage.urgency_level)) {
    return true;
  }

  const text = (msg.text || '').toLowerCase();
  const userText = (prevUserMsg?.text || '').toLowerCase().trim();

  // Pure greeting / pleasantry patterns for user prompt
  const isUserGreetingOnly =
    /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|night)|thanks|thank\s*you|thx|ty|ok|okay|k|cool|great|awesome|got\s*it|sure|alright|fine|yes|no|bye|goodbye|who\s*are\s*you|what\s*is\s*your\s*name|how\s*are\s*you)[\s!.,?]*$/i.test(userText) ||
    /^(សួស្តី|ជំរាបសួរ|សួស្ដី|ជម្រាបសួរ|អរគុណ|អរគុណច្រើន|មិនអីទេ|បាទ|ចាស|យល់ព្រម|អូខេ|លាហើយ|សុខសប្បាយទេ|អ្នកសុខសប្បាយជាទេ|តើអ្នកជាអ្នកណា|តើអ្នកឈ្មោះអ្វី|តើអ្នកសុខសប្បាយទេ)[\s!.,?]*$/u.test(userText);

  // Pure greeting / pleasantry patterns for assistant reply
  const isPurePleasantryReply =
    /^(hello|hi|hey|you('re| are) welcome|glad to help|my pleasure|happy to help|have a (great|good|wonderful) day|let me know if you need anything else)[\s!.,?]*$/i.test(text) ||
    /^(សួស្តី|ជំរាបសួរ|មិនអីទេ|ដោយក្តីរីករាយ|សូមស្វាគមន៍|រីករាយដែលបានជួយ|សូមជូនពរឱ្យមានសុខភាពល្អ|តើខ្ញុំអាចជួយអ្វីបាន|ខ្ញុំនៅទីនេះដើម្បីជួយ)[\s!.,?]*$/u.test(text);

  if (isPurePleasantryReply) {
    return false;
  }

  // Keywords that denote medical symptoms, facilities, treatment, clinical advice, or guidance
  const medicalOrSuggestionKeywords = [
    // English keywords
    'doctor', 'hospital', 'clinic', 'physician', 'specialist',
    'symptom', 'treatment', 'treat', 'diagnos', 'prescri', 'medicine', 'medication', 'pill', 'dose',
    'pain', 'ache', 'fever', 'cough', 'cold', 'flu', 'headache', 'infection', 'bleed', 'wound', 'injury',
    'emergency', 'urgent', 'condition', 'disease', 'illness', 'therapy', 'consult', 'consultation',
    'advise', 'advice', 'recommend', 'suggestion', 'remedy', 'rest', 'hydrate', 'hydration',
    'blood pressure', 'heart', 'chest', 'stomach', 'allergy', 'allergic',
    // Khmer keywords
    'វេជ្ជបណ្ឌិត', 'គ្រូពេទ្យ', 'មន្ទីរពេទ្យ', 'គ្លីនិក', 'សង្គ្រោះបន្ទាន់', 'បន្ទាន់',
    'រោគសញ្ញា', 'អាការៈ', 'ព្យាបាល', 'រោគវិនិច្ឆ័យ', 'ថ្នាំ', 'លេបថ្នាំ', 'ចាក់ថ្នាំ',
    'ឈឺ', 'ឈឺក្បាល', 'ក្តៅខ្លួន', 'ក្អក', 'ផ្តាសាយ', 'រាគ', 'ក្អួត', 'វិលមុខ', 'ហត់', 'ដង្ហើម',
    'របួស', 'ហើម', 'សម្ពាធឈាម', 'បេះដូង', 'ក្រពះ', 'ជំងឺ', 'ពិគ្រោះ', 'ពិនិត្យ',
    'ណែនាំ', 'យោបល់', 'ការថែទាំ', 'សម្រាក', 'ផឹកទឹក', 'ជាតិទឹក', 'អាហារ'
  ];

  const hasMedicalContent = medicalOrSuggestionKeywords.some((kw) => text.includes(kw));

  // If user only gave a greeting/pleasantry and assistant didn't give medical advice, do not show
  if (isUserGreetingOnly && !hasMedicalContent) {
    return false;
  }

  // If message provides actionable advice, symptom guidance, or medical keywords
  if (hasMedicalContent) {
    return true;
  }

  // Check if response contains structured lists or advice steps
  if (/(^|\n)\s*[-*•\d.]+\s+/m.test(msg.text)) {
    return true;
  }

  return false;
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

  const MAX_GUEST_CHATS = 7;
  const isGuest = !currentUser && !AuthService.getStoredUser();

  // Guest chat count in this session
  const [guestChatCount, setGuestChatCount] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem('carequeue_guest_chat_count');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: t('chat_welcome'),
      timestamp: new Date(),
    },
  ]);

  // Sync welcome message on language switch
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], text: t('chat_welcome') }];
      }
      return prev;
    });
  }, [language, t]);

  // Clear guest count if user is authenticated
  useEffect(() => {
    if (!isGuest) {
      try {
        sessionStorage.removeItem('carequeue_guest_chat_count');
      } catch { }
    }
  }, [isGuest]);

  const userMessagesInState = messages.filter((m) => m.role === 'user').length;
  const effectiveUserChatCount = Math.max(guestChatCount, userMessagesInState);
  const hasReachedLimit = isGuest && effectiveUserChatCount >= MAX_GUEST_CHATS;

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);



  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendQuery = async (queryText: string) => {
    const query = queryText.trim();
    if (!query || query.length < 2) {
      setInputError('Please enter a question or message.');
      return;
    }

    if (isGuest && effectiveUserChatCount >= MAX_GUEST_CHATS) {
      onOpenAuth?.();
      return;
    }

    setInputError(null);
    setInputText('');

    if (isGuest) {
      const nextCount = effectiveUserChatCount + 1;
      setGuestChatCount(nextCount);
      try {
        sessionStorage.setItem('carequeue_guest_chat_count', String(nextCount));
      } catch { }
    }

    // 1. Append User Message
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    if (!hasLocation) {
      requestLocation();
    }

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch(`${API_BASE}/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          language: isKhmer(query) ? 'km' : (/[a-zA-Z]/.test(query) ? 'en' : language),
          user_latitude: userLocation?.latitude,
          user_longitude: userLocation?.longitude,
        }),
      });

      if (res.ok) {
        const chatData = await res.json();
        const hasMatchingHospitals = chatData.matching_hospitals && chatData.matching_hospitals.length > 0;
        const assistantMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          text: chatData.reply || (isKhmer(query) ? 'ខ្ញុំនៅទីនេះដើម្បីជួយសម្រួលការសាកសួរសុខភាពរបស់អ្នក។' : 'I am here to assist with your healthcare inquiries.'),
          triage: hasMatchingHospitals ? {
            urgency_level: chatData.urgency_level || 'STANDARD',
            recommended_specialty: chatData.recommended_specialty || 'General Care',
            matching_hospitals: chatData.matching_hospitals,
          } : undefined,
          bookedTicket: chatData.booked_ticket || undefined,
          suggestedActions: chatData.suggested_actions || [],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (res.status === 401) {
        onOpenAuth?.();
      } else {
        const fallbackMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          text: isKhmer(query)
            ? 'សូមអភ័យទោស ខ្ញុំមិនអាចទាក់ទងជំនួយការវេជ្ជសាស្ត្របានជាបណ្តោះអាសន្នទេ។ សូមពិនិត្យមើលបណ្តាញរបស់អ្នក ឬព្យាយាមម្តងទៀតនៅបន្តិចក្រោយ។'
            : 'I apologize, I am temporarily unable to reach the medical assistant. Please check your connection or try again in a moment.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: isKhmer(query)
          ? 'បញ្ហាតភ្ជាប់បណ្តាញពេលដំណើរការសាររបស់អ្នក។ សូមពិនិត្យមើលបណ្តាញរបស់អ្នក ហើយព្យាយាមម្តងទៀត។'
          : 'Connection issue while processing your message. Please check your network and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSendQuery(inputText);
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
                {shouldShowMedicalDisclaimer(msg, prevUserMsg) && (
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

        {loading && (() => {
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
              {t('chat_guest_limit_notice')}{' '}
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
        padding: '0.45rem 0 0.35rem 0',
        background: 'var(--bg-primary, #f6faf6)',
        position: 'sticky',
        bottom: 0,
        zIndex: 30,
      }}>
        <form
          onSubmit={handleSendMessage}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={hasReachedLimit ? t('chat_guest_limit_placeholder') : t('chat_placeholder')}
            disabled={loading || hasReachedLimit}
            onClick={() => {
              if (hasReachedLimit) onOpenAuth?.();
            }}
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                try {
                  target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
                } catch { }
              }, 250);
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            className="input-search-rounded chat-input-bar-input"
            style={{
              width: '100%',
              padding: '0.84rem 9.6rem 0.84rem 1.45rem',
              fontSize: (language === 'km' || isKhmer(inputText)) ? '1.02rem' : '0.96rem',
              fontFamily: (language === 'km' || isKhmer(inputText)) ? 'var(--font-khmer)' : 'inherit',
              border: hasReachedLimit ? '1px solid #cbd5e1' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              background: hasReachedLimit ? '#f8fafc' : '#ffffff',
              color: 'var(--text-main)',
              outline: 'none',
              boxShadow: 'none',
              boxSizing: 'border-box',
              cursor: hasReachedLimit ? 'pointer' : 'text',
            }}
          />
          {hasReachedLimit ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn btn-primary chat-input-send-btn"
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '0.6rem 1.4rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: kmFont,
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span>{t('chat_guest_limit_btn')}</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="btn btn-primary chat-input-send-btn"
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '0.6rem 1.65rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: (loading || !inputText.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !inputText.trim()) ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                whiteSpace: 'nowrap',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'none',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
              <span>{t('chat_send')}</span>
            </button>
          )}
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
