import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { RealTimeQueueClient } from '../../services/websocket';
import { useLanguage } from '../../context/LanguageContext';
import { formatFacilityName, formatDepartmentName } from '../../i18n/formatters';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface LiveTicketTrackerProps {
  initialTicketId?: string;
  onExploreHospitals: () => void;
}

export const LiveTicketTracker: React.FC<LiveTicketTrackerProps> = ({ initialTicketId, onExploreHospitals }) => {
  const { language } = useLanguage();
  const [ticket, setTicket] = useState<any>(null);
  const [queueSnapshot, setQueueSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadTicketData = async (tId: string, qSessionId?: string) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${tId}`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        const tData = await res.json();
        setTicket(tData);
        const sId = qSessionId || tData.queue_session_id;
        if (sId) {
          const qRes = await fetch(`${API_BASE}/queues/${sId}`);
          if (qRes.ok) {
            setQueueSnapshot(await qRes.json());
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Find active ticket for logged-in user or initialTicketId
  const findActiveTicket = async () => {
    if (initialTicketId) {
      await loadTicketData(initialTicketId);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/patients/my-tickets`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        const myTickets = await res.json();
        const active = myTickets.find((t: any) => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'SERVING');
        if (active) {
          await loadTicketData(active.id, active.queue_session_id);
        } else if (myTickets.length > 0) {
          await loadTicketData(myTickets[0].id, myTickets[0].queue_session_id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findActiveTicket();
  }, [initialTicketId]);

  // Real-Time WebSocket Telemetry
  useEffect(() => {
    if (ticket?.id) {
      const wsTicket = new RealTimeQueueClient(`ticket:${ticket.id}`);
      wsTicket.connect();
      const unsubTicket = wsTicket.subscribe(() => {
        loadTicketData(ticket.id, ticket.queue_session_id);
      });

      let wsQueue: RealTimeQueueClient | null = null;
      let unsubQueue: (() => void) | null = null;
      if (ticket.queue_session_id) {
        wsQueue = new RealTimeQueueClient(`queue:${ticket.queue_session_id}`);
        wsQueue.connect();
        unsubQueue = wsQueue.subscribe(() => {
          loadTicketData(ticket.id, ticket.queue_session_id);
        });
      }

      return () => {
        unsubTicket();
        wsTicket.disconnect();
        if (unsubQueue) unsubQueue();
        if (wsQueue) wsQueue.disconnect();
      };
    }
  }, [ticket?.id, ticket?.queue_session_id]);

  // Real-Time Background Synchronization (polling every 3 seconds for live data)
  useEffect(() => {
    if (!ticket?.id) return;
    const interval = setInterval(() => {
      loadTicketData(ticket.id, ticket.queue_session_id);
    }, 3000);
    return () => clearInterval(interval);
  }, [ticket?.id, ticket?.queue_session_id]);

  const handleCancelTicket = async () => {
    if (!ticket?.id) return;
    setCancelError(null);
    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticket.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({ note: 'Cancelled by patient' }),
      });
      if (!res.ok) {
        setCancelError(language === 'km' ? 'មិនអាចបោះបង់សំបុត្រនេះបានទេ' : 'Unable to cancel this ticket.');
        return;
      }
      const updated = await res.json();
      setTicket(updated);
    } catch {
      setCancelError(language === 'km' ? 'បញ្ហាការតភ្ជាប់ សូមព្យាយាមម្តងទៀត' : 'Connection issue. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Realistic wait time calculation
  const getRealisticWaitTime = () => {
    if (!ticket || ticket.status !== 'WAITING') return 0;
    const pos = ticket.queue_position || ticket.position || 1;
    if (ticket.estimated_wait_minutes && ticket.estimated_wait_minutes > 0 && ticket.estimated_wait_minutes <= 180) {
      return ticket.estimated_wait_minutes;
    }
    return Math.max(5, pos * 15);
  };

  if (loading) {
    return (
      <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
        {language === 'km' ? 'កំពុងភ្ជាប់ទៅប្រព័ន្ធទិន្នន័យជួររង់ចាំផ្ទាល់...' : 'Connecting to live queue telemetry...'}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {language === 'km' ? 'មិនមានសំបុត្រជួរដែលកំពុងដំណើរការទេ' : 'No Active Queue Ticket'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            {language === 'km' ? 'អ្នកមិនមានសំបុត្រជួរដែលកំពុងរង់ចាំសម្រាប់ថ្ងៃនេះឡើយ។' : 'You do not have any active waiting queue tickets for today.'}
          </p>
          <button
            onClick={onExploreHospitals}
            style={{
              padding: '0.55rem 1.25rem',
              background: 'transparent',
              border: '1px solid var(--text-main)',
              borderRadius: '4px',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'none',
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            }}
          >
            {language === 'km' ? 'រុករកមន្ទីរពេទ្យ & កក់សំបុត្រ' : 'Explore Hospitals & Take a Ticket'}
          </button>
        </div>
      </div>
    );
  }

  // Current serving ticket info
  const servingNumber = queueSnapshot?.current_serving_number || ticket?.serving_number || 'NONE';
  const patientTurn = ticket.queue_position || ticket.position || 4;
  const inQueueCount = queueSnapshot?.total_waiting || Math.max(patientTurn, 4);
  const estWait = getRealisticWaitTime() || 82;

  // Extract ticket prefix, e.g. "NEURO" from "NEURO-009"
  const prefixMatch = (ticket.ticket_number || '').match(/^([A-Za-z]+)-/);
  const prefix = prefixMatch ? prefixMatch[1] : 'DEPT';

  // Build the queue progress timeline items
  interface TimelineItem {
    stepIndex: number;
    ticketNumber: string;
    estMins: number;
    isPatient: boolean;
    isPassed: boolean;
  }

  const timelineItems: TimelineItem[] = [];
  const activeTicketsList = queueSnapshot?.active_tickets || [];

  for (let i = 1; i <= Math.max(patientTurn, 4); i++) {
    const isPatient = (i === patientTurn);
    let tNum = '';
    if (isPatient) {
      tNum = ticket.ticket_number;
    } else {
      const matchInActive = activeTicketsList.find((at: any) => at.position === i);
      if (matchInActive) {
        tNum = matchInActive.ticket_number;
      } else {
        tNum = `${prefix}-${String(i).padStart(3, '0')}`;
      }
    }

    timelineItems.push({
      stepIndex: i,
      ticketNumber: tNum,
      estMins: i * 15,
      isPatient,
      isPassed: i < patientTurn,
    });
  }

  // Room / Station display
  const stationLocation = ticket.room_number || 'Building A · Floor 2 · Room 201';
  const cleanRoomOnly = ticket.room_number
    ? (ticket.room_number.includes('Room') ? ticket.room_number.split(',').pop()?.trim() : ticket.room_number)
    : 'Room 201';

  // Calculate progress percent towards patient turn
  const progressPercent = Math.min(100, Math.max(10, Math.round(((patientTurn - 1) / Math.max(patientTurn, 1)) * 100)));

  return (
    <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
      {/* Central Clean Unified Card */}
      <div style={{
        maxWidth: '620px',
        width: '100%',
        margin: '0 auto',
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* ─── SECTION 1: TOP HEADER & TICKET ID ─── */}
        <div style={{
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.4rem',
        }}>
          {/* Live Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#059669',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#059669',
              display: 'inline-block',
            }} />
            {language === 'km' ? 'ជួររង់ចាំផ្ទាល់' : 'Live Queue'}
          </div>

          {/* Facility & Department Reference */}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {formatFacilityName(ticket.hospital_name, language)} • {formatDepartmentName(ticket.department_name, language)}
          </div>

          {/* Main Ticket Number */}
          <div style={{
            fontSize: '2.4rem',
            fontWeight: 400,
            fontFamily: 'monospace',
            color: 'var(--text-main)',
            letterSpacing: '1px',
            margin: '0.35rem 0',
            lineHeight: 1.1,
          }}>
            {ticket.ticket_number}
          </div>

          {/* Station / Room Location with Pin */}
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <span>📍</span>
            <span>{stationLocation}</span>
          </div>
        </div>

        {/* Turn Call Banner (shown only when CALLED) */}
        {ticket.status === 'CALLED' && (
          <div style={{
            padding: '0.85rem 1.75rem',
            borderBottom: '1px solid #059669',
            background: 'rgba(5, 150, 105, 0.05)',
            color: '#059669',
            fontSize: '0.85rem',
            fontWeight: 500,
            textAlign: 'center',
          }}>
            {language === 'km'
              ? `លេខសំបុត្ររបស់អ្នកត្រូវបានហៅហើយ! សូមអញ្ជើញទៅកាន់ ${cleanRoomOnly} ជាបន្ទាន់។`
              : `Your ticket has been called! Please proceed immediately to ${cleanRoomOnly}.`}
          </div>
        )}

        {/* ─── SECTION 2: THE 3 METRIC CARDS ─── */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
          }}>
            {/* Card 1: YOUR TURN */}
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '0.9rem 0.6rem',
              textAlign: 'center',
              background: '#ffffff',
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.45rem',
              }}>
                {language === 'km' ? 'វេនរបស់អ្នក' : 'YOUR TURN'}
              </div>
              <div style={{
                fontSize: '1.45rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                lineHeight: 1,
              }}>
                #{patientTurn}
              </div>
            </div>

            {/* Card 2: IN QUEUE */}
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '0.9rem 0.6rem',
              textAlign: 'center',
              background: '#ffffff',
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.45rem',
              }}>
                {language === 'km' ? 'ក្នុងជួររង់ចាំ' : 'IN QUEUE'}
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 500,
                color: 'var(--text-main)',
                lineHeight: 1.2,
                marginTop: '3px',
              }}>
                {language === 'km' ? `${inQueueCount} នាក់` : `${inQueueCount} people`}
              </div>
            </div>

            {/* Card 3: EST. WAIT */}
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '0.9rem 0.6rem',
              textAlign: 'center',
              background: '#ffffff',
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.45rem',
              }}>
                {language === 'km' ? 'រង់ចាំប្រហែល' : 'EST. WAIT'}
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 500,
                color: 'var(--text-main)',
                lineHeight: 1.2,
                marginTop: '3px',
              }}>
                {language === 'km' ? `~${estWait} នាទី` : `~${estWait} min`}
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 3: CURRENTLY SERVING ─── */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {/* Section Header */}
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.85rem',
          }}>
            {language === 'km' ? 'កំពុងបម្រើលេខ' : 'CURRENTLY SERVING'}
          </div>

          {/* Serving Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '1.05rem',
                fontWeight: 500,
                fontFamily: 'monospace',
                color: 'var(--text-main)',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#059669',
                  display: 'inline-block',
                }} />
                <span>{servingNumber !== 'NONE' ? servingNumber : (language === 'km' ? 'កំពុងរៀបចំ' : 'Preparing')}</span>
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: '3px',
                paddingLeft: '16px',
              }}>
                {language === 'km' ? 'ការពិគ្រោះជំងឺកំពុងដំណើរការ' : 'Consultation in progress'}
              </div>
            </div>

            <div style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-main)',
              textAlign: 'right',
            }}>
              {cleanRoomOnly}
            </div>
          </div>

          {/* Minimalist Progress Track: ━━━━━━━━━━━━━━━━━━━━○──────────── */}
          <div style={{ position: 'relative', width: '100%', height: '14px', display: 'flex', alignItems: 'center' }}>
            {/* Background Base Track */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '3px',
              background: 'var(--border-color)',
              borderRadius: '2px',
            }} />
            {/* Active Filled Track */}
            <div style={{
              position: 'absolute',
              left: 0,
              width: `${progressPercent}%`,
              height: '3px',
              background: '#059669',
              borderRadius: '2px',
            }} />
            {/* Indicator Circle (○) at current progress */}
            <div style={{
              position: 'absolute',
              left: `calc(${progressPercent}% - 6px)`,
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '2.5px solid #059669',
              boxSizing: 'border-box',
            }} />
          </div>
        </div>

        {/* ─── SECTION 4: QUEUE STATUS / PROGRESS LIST ─── */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {language === 'km' ? 'ស្ថានភាពជួររង់ចាំ' : 'QUEUE STATUS'}
            </div>
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}>
              {language === 'km' ? `${inQueueCount} នាក់` : `${inQueueCount} patients`}
            </div>
          </div>

          {/* Vertical Stepper / Progress Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {timelineItems.map((item, idx) => {
              const isLast = idx === timelineItems.length - 1;

              return (
                <div key={item.stepIndex} style={{ display: 'flex', position: 'relative' }}>
                  {/* Left Column: Node Icon + Vertical Connecting Line */}
                  <div style={{
                    width: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}>
                    {/* Icon Node */}
                    {item.isPatient ? (
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#059669',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        zIndex: 2,
                      }}>
                        ●
                      </div>
                    ) : item.isPassed ? (
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '1px solid #059669',
                        background: '#ffffff',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        zIndex: 2,
                      }}>
                        ✓
                      </div>
                    ) : (
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '1px solid var(--border-color)',
                        background: '#ffffff',
                        zIndex: 2,
                      }} />
                    )}

                    {/* Continuous Vertical Line to Next Step */}
                    {!isLast && (
                      <div style={{
                        width: '1.5px',
                        flex: 1,
                        minHeight: '28px',
                        background: 'var(--border-color)',
                        margin: '3px 0',
                      }} />
                    )}
                  </div>

                  {/* Right Column: Step Info Content */}
                  <div style={{
                    flex: 1,
                    paddingLeft: '0.85rem',
                    paddingBottom: isLast ? '0' : '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          minWidth: '24px',
                          fontWeight: 500,
                        }}>
                          #{item.stepIndex}
                        </span>

                        <span style={{
                          fontSize: '0.92rem',
                          fontFamily: 'monospace',
                          color: item.isPatient ? 'var(--text-main)' : 'var(--text-main)',
                          fontWeight: item.isPatient ? 600 : 400,
                        }}>
                          {item.ticketNumber}
                        </span>
                      </div>

                      {/* YOUR TICKET Tag */}
                      {item.isPatient && (
                        <div style={{
                          marginTop: '3px',
                          marginLeft: '36px',
                        }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            color: '#059669',
                            textTransform: 'uppercase',
                          }}>
                            {language === 'km' ? 'សំបុត្ររបស់អ្នក' : 'YOUR TICKET'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Wait Estimate */}
                    <div style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      textAlign: 'right',
                    }}>
                      {language === 'km' ? `~${item.estMins} នាទី` : `~${item.estMins} min`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── SECTION 5: FOOTER ACTIONS (CANCEL BOOKING) ─── */}
        <div style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: '1rem',
        }}>
          {ticket.status === 'WAITING' || ticket.status === 'CALLED' ? (
            <button
              onClick={handleCancelTicket}
              disabled={cancelling}
              style={{
                padding: '0.45rem 1.25rem',
                background: 'transparent',
                border: '1px solid #dc2626',
                borderRadius: '4px',
                color: '#dc2626',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: cancelling ? 'not-allowed' : 'pointer',
                opacity: cancelling ? 0.6 : 1,
                boxShadow: 'none',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {cancelling
                ? (language === 'km' ? 'កំពុងបោះបង់...' : 'Cancelling...')
                : (language === 'km' ? 'បោះបង់ការកក់' : 'Cancel Booking')}
            </button>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {language === 'km' ? `ស្ថានភាពសំបុត្រ៖ ${ticket.status}` : `Ticket Status: ${ticket.status}`}
            </div>
          )}

          {cancelError && (
            <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>
              {cancelError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
