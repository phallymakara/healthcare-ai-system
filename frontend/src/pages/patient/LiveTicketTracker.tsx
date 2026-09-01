import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { RealTimeQueueClient } from '../../services/websocket';
import { 
  Ticket as TicketIcon, 
  Clock, 
  Users, 
  RefreshCw
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface LiveTicketTrackerProps {
  initialTicketId?: string;
  onExploreHospitals: () => void;
}

export const LiveTicketTracker: React.FC<LiveTicketTrackerProps> = ({ initialTicketId, onExploreHospitals }) => {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadTicketData = async (tId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/${tId}`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setTicket(await res.json());
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
          setTicket(active);
        } else if (myTickets.length > 0) {
          setTicket(myTickets[0]);
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

  useEffect(() => {
    if (ticket?.id) {
      // Connect to WebSocket channel for this specific ticket and queue
      const ws = new RealTimeQueueClient(`ticket:${ticket.id}`);
      ws.connect();
      const unsub = ws.subscribe(() => {
        loadTicketData(ticket.id);
      });
      return () => {
        unsub();
        ws.disconnect();
      };
    }
  }, [ticket?.id]);

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
        setCancelError('Unable to cancel this ticket. It may already be serving or completed.');
        return;
      }
      const updated = await res.json();
      setTicket(updated);
    } catch (e) {
      setCancelError('Connection issue. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CALLED':
      case 'SERVING':
        return <span className="badge badge-healthy">{status === 'CALLED' ? 'Called - Proceed to Room' : 'In Consultation'}</span>;
      case 'WAITING':
        return <span className="badge badge-degraded">Waiting in Line</span>;
      case 'COMPLETED':
        return <span className="badge badge-healthy">Completed</span>;
      case 'CANCELLED':
        return <span className="badge" style={{ border: '1px solid #ef4444', color: '#ef4444' }}>Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
        Loading your live ticket status...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto',
          color: 'var(--accent-primary)',
        }}>
          <TicketIcon size={28} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          No Active Queue Ticket
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
          You do not have any active appointments or waiting queue tickets for today.
        </p>
        <button onClick={onExploreHospitals} className="btn btn-primary">
          Explore Hospitals & Take a Ticket
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Live Ticket Tracker</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time synchronization with hospital counter queue.
          </span>
        </div>
        <button onClick={() => loadTicketData(ticket.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Main Ticket Card */}
      <div className="glass-card" style={{ border: '1px solid var(--border-highlight)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Queue Ticket
            </span>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
              {ticket.ticket_number}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {getStatusBadge(ticket.status)}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Issued at {new Date(ticket.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} color="var(--accent-primary)" /> Position in Line
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
              {ticket.status === 'SERVING'
                ? 'Now Serving'
                : ticket.status === 'CALLED'
                ? 'Your Turn!'
                : ticket.position <= 1
                ? 'Next in line'
                : `${ticket.position - 1} ahead of you`}
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--accent-cyan)" /> Est. Wait Duration
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
              {ticket.status === 'SERVING'
                ? '0 mins'
                : `~${ticket.estimated_wait_minutes} mins`}
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
            <span style={{ fontWeight: 600 }}>{ticket.patient_name}</span>
          </div>
          {ticket.patient_phone && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
              <span style={{ fontWeight: 600 }}>{ticket.patient_phone}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking Source:</span>
            <span style={{ fontWeight: 600 }}>{ticket.ticket_source}</span>
          </div>
        </div>

        {/* Actions & Inline Error */}
        {ticket.status === 'WAITING' && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            {cancelError && <span className="error-text" style={{ marginBottom: '0.5rem' }}>{cancelError}</span>}
            <button
              onClick={handleCancelTicket}
              disabled={cancelling}
              className="btn btn-outline"
              style={{ width: '100%', color: '#ef4444', borderColor: '#ef4444' }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Queue Ticket'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
