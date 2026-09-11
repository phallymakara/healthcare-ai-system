import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';
import { BookedTicket } from './tracker/types';
import { TicketListView } from './tracker/TicketListView';
import { TicketDetailPass } from './tracker/TicketDetailPass';
import { CancelTicketModal } from './tracker/CancelTicketModal';

interface LiveTicketTrackerProps {
  initialTicketId?: string;
  onExploreHospitals?: () => void;
  onConsultAi?: () => void;
}

export const LiveTicketTracker: React.FC<LiveTicketTrackerProps> = ({
  initialTicketId,
  onExploreHospitals,
  onConsultAi,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  const [activeTicket, setActiveTicket] = useState<BookedTicket | null>(null);
  const [myTickets, setMyTickets] = useState<BookedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Load patient tickets or initial ticket
  const loadData = async (preferredTicketId?: string) => {
    setLoading(true);
    setActionError(null);
    try {
      const targetId = preferredTicketId || initialTicketId;
      let directTicket: BookedTicket | null = null;

      if (targetId) {
        try {
          const res = await fetch(`${API_BASE}/tickets/${targetId}`);
          if (res.ok) {
            directTicket = await res.json();
          }
        } catch {
          // Fallback to user tickets
        }
      }

      const currentUser = AuthService.getStoredUser();
      let userTickets: BookedTicket[] = [];
      if (currentUser) {
        try {
          const res = await fetch(`${API_BASE}/patients/my-tickets`, {
            headers: AuthService.getAuthHeaders(),
          });
          if (res.ok) {
            userTickets = await res.json();
            setMyTickets(userTickets);
          }
        } catch {
          // Graceful fallback
        }
      }

      if (directTicket) {
        setActiveTicket(directTicket);
      } else {
        setActiveTicket(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(initialTicketId);
  }, [initialTicketId]);

  // Guest / Walk-In Ticket Lookup by Code or Phone
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/lookup/${encodeURIComponent(lookupQuery.trim())}`);
      if (!res.ok) {
        throw new Error('NotFound');
      }
      const ticket: BookedTicket = await res.json();
      setActiveTicket(ticket);
      setLookupQuery('');
    } catch {
      setLookupError(
        isKm
          ? 'រកមិនឃើញសំបុត្រណាត់ជួបដែលមានលេខកូដនេះទេ។ សូមពិនិត្យលេខកូដម្តងទៀត។'
          : 'Appointment ticket not found. Please double-check your ticket code or phone number.'
      );
    } finally {
      setLookupLoading(false);
    }
  };

  // Cancel Scheduled Booking Action
  const handleCancelBooking = async () => {
    if (!activeTicket || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/${activeTicket.id}/cancel-booking`, {
        method: 'POST',
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTicket(updated);
        setMyTickets((prev) => prev.map((tk) => (tk.id === updated.id ? updated : tk)));
        setShowCancelModal(false);
        setActionNotice(t('appt_cancel_success'));
      } else {
        throw new Error();
      }
    } catch {
      setActionError(
        isKm
          ? 'មិនអាចលុបចោលការណាត់បានទេ។ សូមព្យាយាមម្តងទៀត។'
          : 'Failed to cancel appointment. Please try again.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', width: '100%', fontFamily: kmFont }}>
      {!activeTicket ? (
        <TicketListView
          myTickets={myTickets}
          loading={loading}
          lookupQuery={lookupQuery}
          setLookupQuery={setLookupQuery}
          lookupLoading={lookupLoading}
          lookupError={lookupError}
          setLookupError={setLookupError}
          onLookupSubmit={handleLookupSubmit}
          onSelectTicket={(tk) => {
            setActiveTicket(tk);
            setActionNotice(null);
            setActionError(null);
          }}
          onExploreHospitals={onExploreHospitals}
          onConsultAi={onConsultAi}
        />
      ) : (
        <TicketDetailPass
          activeTicket={activeTicket}
          actionNotice={actionNotice}
          actionError={actionError}
          actionLoading={actionLoading}
          onBack={() => {
            setActiveTicket(null);
            setActionNotice(null);
            setActionError(null);
          }}
          onRequestCancel={() => setShowCancelModal(true)}
        />
      )}

      {/* Cancellation Confirmation Dialog */}
      <CancelTicketModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelBooking}
        loading={actionLoading}
      />
    </div>
  );
};
