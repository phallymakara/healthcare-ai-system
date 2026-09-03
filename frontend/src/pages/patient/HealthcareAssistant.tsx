import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface HealthcareAssistantProps {
  onTicketBooked: (ticket: any) => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToTracker?: () => void;
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

export const HealthcareAssistant: React.FC<HealthcareAssistantProps> = ({
  onTicketBooked,
  onNavigateToDiscovery,
  onNavigateToTracker,
}) => {
  const { language, t } = useLanguage();
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

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);

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

    setInputError(null);
    setInputText('');

    // 1. Append User Message
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

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
          language: language,
        }),
      });

      if (res.ok) {
        const chatData = await res.json();
        const hasMatchingHospitals = chatData.matching_hospitals && chatData.matching_hospitals.length > 0;
        const assistantMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          text: chatData.reply || 'I am here to assist with your healthcare inquiries.',
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
      } else {
        const fallbackMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          text: 'I apologize, I am temporarily unable to reach the medical assistant. Please check your connection or try again in a moment.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: 'Connection issue while processing your message. Please check your network and try again.',
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

  const handleActionClick = (actionText: string, msg?: ChatMessage) => {
    if (actionText === 'View in Live Queue' || actionText === 'View Live Queue') {
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

  const handleOpenBooking = (match: any) => {
    const user = AuthService.getStoredUser();
    setSelectedMatch(match);
    setPatientName(user?.full_name || '');
    setPatientPhone(user?.phone_number || '');
    setNameError(null);
    setPhoneError(null);
    setBookingFormError(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setBookingFormError(null);

    let hasErr = false;
    if (!patientName.trim()) {
      setNameError('Please enter your full name.');
      hasErr = true;
    }
    if (!patientPhone.trim()) {
      setPhoneError('Please enter your phone number.');
      hasErr = true;
    } else if (patientPhone.trim().length < 6) {
      setPhoneError('Please enter a valid phone number.');
      hasErr = true;
    }

    if (hasErr) return;

    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({
          hospital_id: selectedMatch.hospital_id,
          department_id: selectedMatch.department_id,
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim(),
        }),
      });

      if (!res.ok) {
        setBookingFormError('Unable to reserve ticket right now. Please try again.');
        return;
      }

      const ticket = await res.json();
      setBookingModalOpen(false);
      onTicketBooked(ticket);
    } catch {
      setBookingFormError('Connection issue. Please check your network and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Single Unified Chat Container spanning to the bottom */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'none',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minHeight: 0,
        }}>
          {messages.map((msg) => {
            const isKm = isKhmer(msg.text);
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.2rem',
                  fontWeight: 500,
                }}>
                  {msg.role === 'user' ? 'You' : 'Healthcare Assistant'}
                </div>

                <div style={{
                  maxWidth: msg.role === 'user' ? '80%' : '92%',
                  padding: '0.25rem 0',
                  fontSize: isKm ? '0.95rem' : '0.9rem',
                  fontFamily: isKm ? 'var(--font-khmer)' : 'inherit',
                  color: 'var(--text-main)',
                  lineHeight: isKm ? 1.75 : 1.6,
                }}>
                  {/* Markdown Formatted Text */}
                  <div style={{ color: 'var(--text-main)', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ margin: '0.4rem 0', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</p>,
                        h1: ({ children }) => <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0.65rem 0 0.35rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h3>,
                        h2: ({ children }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.6rem 0 0.35rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h3>,
                        h3: ({ children }) => <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0.55rem 0 0.25rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h4>,
                        h4: ({ children }) => <h5 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0.5rem 0 0.25rem 0', color: 'var(--text-main)', fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</h5>,
                        ul: ({ children }) => <ul style={{ margin: '0.4rem 0', paddingLeft: '1.25rem' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ margin: '0.4rem 0', paddingLeft: '1.25rem' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ margin: '0.2rem 0', lineHeight: isKm ? 1.75 : 1.6, fontFamily: isKm ? 'var(--font-khmer)' : 'inherit' }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                        code: ({ children }) => (
                          <code style={{
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            background: 'rgba(0,0,0,0.04)',
                            padding: '0.15rem 0.35rem',
                            borderRadius: '3px',
                            border: '1px solid var(--border-color)',
                          }}>
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* Direct AI Booked Ticket Card */}
                  {msg.bookedTicket && (
                    <div style={{
                      marginTop: '0.85rem',
                      padding: '1rem 1.25rem',
                      border: '1px solid var(--text-main)',
                      borderRadius: '4px',
                      background: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Digital Queue Ticket Reserved
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 400, fontFamily: 'monospace', color: 'var(--text-main)', marginTop: '2px' }}>
                          {msg.bookedTicket.ticket_number}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {msg.bookedTicket.hospital_name} • {msg.bookedTicket.department_name} • {msg.bookedTicket.room_number || 'Room 201'}
                        </div>
                      </div>

                      <button
                        onClick={() => onTicketBooked(msg.bookedTicket)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--text-main)',
                          borderRadius: '4px',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                        }}
                      >
                        {t('view_live_queue')} →
                      </button>
                    </div>
                  )}

                  {/* Triage Evaluation Card if attached */}
                  {msg.triage && (
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                    }}>
                      {/* Urgency & Recommended Department */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                      }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Recommended Department
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {msg.triage.recommended_specialty}
                          </div>
                        </div>

                        <div>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '3px',
                            border: msg.triage.urgency_level === 'EMERGENCY'
                              ? '1px solid #dc2626'
                              : msg.triage.urgency_level === 'URGENT'
                                ? '1px solid #d97706'
                                : '1px solid var(--border-color)',
                            color: msg.triage.urgency_level === 'EMERGENCY'
                              ? '#dc2626'
                              : msg.triage.urgency_level === 'URGENT'
                                ? '#d97706'
                                : 'var(--text-main)',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                          }}>
                            {msg.triage.urgency_level === 'EMERGENCY'
                              ? 'Emergency Priority'
                              : msg.triage.urgency_level === 'URGENT'
                                ? 'Urgent Priority'
                                : 'Routine Priority'}
                          </span>
                        </div>
                      </div>

                      {/* Guidance */}
                      {msg.triage.advice && (
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.75rem',
                          lineHeight: 1.5,
                        }}>
                          Guidance: {msg.triage.advice}
                        </div>
                      )}

                      {/* Matching Clinics */}
                      {(msg.triage.matching_hospitals || []).length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Available Clinics with Shortest Wait Times
                          </div>

                          <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                            {msg.triage.matching_hospitals.map((m: any, idx: number) => (
                              <div
                                key={m.hospital_id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem',
                                  padding: '0.75rem 1rem',
                                  borderBottom: idx === msg.triage.matching_hospitals.length - 1 ? 'none' : '1px solid var(--border-color)',
                                  background: '#ffffff',
                                }}
                              >
                                <div style={{ minWidth: '180px', flex: '1.5' }}>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                    {m.hospital_name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {m.department_name} • {m.address || 'Phnom Penh'}
                                  </div>
                                </div>

                                <div style={{ minWidth: '150px', flex: '1' }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-main)' }}>
                                    {m.waiting_patients} in line • ~{m.estimated_wait_minutes} mins wait
                                  </div>
                                </div>

                                <div>
                                  <button
                                    onClick={() => handleOpenBooking(m)}
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                      background: 'transparent',
                                      border: '1px solid var(--text-main)',
                                      borderRadius: '3px',
                                      color: 'var(--text-main)',
                                      cursor: 'pointer',
                                      boxShadow: 'none',
                                    }}
                                  >
                                    Book Digital Ticket
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                              borderRadius: '4px',
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
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
              {t('chat_processing')}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Chat Input Form Area */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          padding: '0.85rem 1.25rem',
          background: '#ffffff',
        }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chat_placeholder')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                fontSize: (language === 'km' || isKhmer(inputText)) ? '0.95rem' : '0.875rem',
                fontFamily: (language === 'km' || isKhmer(inputText)) ? 'var(--font-khmer)' : 'inherit',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: '#ffffff',
                color: 'var(--text-main)',
                outline: 'none',
                boxShadow: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.6rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid var(--text-main)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: 'none',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {t('chat_send')}
            </button>
          </form>

          {inputError && (
            <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.4rem' }}>
              {inputError}
            </div>
          )}
        </div>
      </div>

      {/* Manual Booking Modal Dialog */}
      {bookingModalOpen && selectedMatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '460px',
            padding: '1.5rem',
            boxShadow: 'none',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              {t('confirm_booking')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {selectedMatch.hospital_name} • {selectedMatch.department_name}
            </p>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {t('patient_full_name')}
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Sokha Chhay"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.875rem',
                    border: nameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    boxShadow: 'none',
                    outline: 'none',
                  }}
                />
                {nameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {nameError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {t('phone_number')}
                </label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="e.g. 012888999"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.875rem',
                    border: phoneError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    boxShadow: 'none',
                    outline: 'none',
                  }}
                />
                {phoneError && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {phoneError}
                  </div>
                )}
              </div>

              {bookingFormError && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                  {bookingFormError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  disabled={bookingLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: bookingLoading ? 'not-allowed' : 'pointer',
                    opacity: bookingLoading ? 0.6 : 1,
                    boxShadow: 'none',
                  }}
                >
                  {bookingLoading ? '...' : t('confirm_ticket_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
