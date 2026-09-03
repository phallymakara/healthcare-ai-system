import React from 'react';
import { ArrowRight } from 'lucide-react';
import { UserProfile } from '../../services/auth';

interface CtaSectionProps {
  onOpenAuth: () => void;
  currentUser?: UserProfile | null;
  onSelectTab?: (tab: any) => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenAuth, currentUser, onSelectTab }) => {
  const handleClick = () => {
    if (currentUser) {
      if (currentUser.role === 'SUPER_ADMIN') {
        onSelectTab?.('admin_center');
      } else if (['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'].includes(currentUser.role)) {
        onSelectTab?.('partner_counter');
      } else {
        onSelectTab?.('patient_discovery');
      }
    } else {
      onOpenAuth();
    }
  };

  return (
    <section style={{
      padding: '3rem 1rem',
      textAlign: 'center',
      maxWidth: '720px',
      margin: '0 auto',
    }}>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: 800,
        color: 'var(--text-main)',
        marginBottom: '0.75rem',
        letterSpacing: '-0.02em',
      }}>
        Ready to simplify your healthcare visits?
      </h2>
      <p style={{
        fontSize: '0.95rem',
        color: 'var(--text-muted)',
        maxWidth: '520px',
        margin: '0 auto 1.75rem auto',
        lineHeight: 1.6,
      }}>
        {currentUser 
          ? 'Quickly access hospital queues, manage appointments, or monitor live counter progress.' 
          : 'Create an account in seconds to reserve tickets and track your queue, or sign in as hospital staff to operate your counter.'}
      </p>
      <button
        onClick={handleClick}
        className="btn"
        style={{
          background: 'linear-gradient(135deg, #0c2f27 0%, #185339 50%, #227349 100%)',
          color: '#ffffff',
          padding: '0.75rem 1.75rem',
          fontSize: '0.95rem',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {currentUser ? 'Go to My Portal' : 'Sign In / Register'} <ArrowRight size={16} />
      </button>
    </section>
  );
};
