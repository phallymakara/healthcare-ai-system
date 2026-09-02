import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CtaSectionProps {
  onOpenAuth: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenAuth }) => {
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
        Create an account in seconds to reserve tickets and track your queue, or sign in as hospital staff to operate your counter.
      </p>
      <button
        onClick={onOpenAuth}
        className="btn"
        style={{
          background: 'linear-gradient(135deg, #0c2f27 0%, #185339 50%, #227349 100%)',
          color: '#ffffff',
          padding: '0.75rem 1.75rem',
          fontSize: '0.95rem',
          border: 'none',
        }}
      >
        Sign In / Register <ArrowRight size={16} />
      </button>
    </section>
  );
};
