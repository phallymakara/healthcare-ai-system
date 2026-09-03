import React from 'react';
import { Clock, Users, Building2 } from 'lucide-react';

import { UserProfile } from '../../services/auth';

interface HeroSectionProps {
  onOpenAuth: () => void;
  currentUser?: UserProfile | null;
  onSelectTab?: (tab: any) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  return (
    <section style={{ padding: '3rem 0 1.5rem 0', textAlign: 'center' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2.6rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #0c2f27 0%, #185339 50%, #227349 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
          letterSpacing: '-0.025em',
          marginBottom: '1.25rem',
        }}>
          Skip the waiting room. <br />
          Track your queue in real time.
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          lineHeight: 1.65,
          marginBottom: '2rem',
          maxWidth: '680px',
          margin: '0 auto 2rem auto',
        }}>
          Health AI Assistant lets patients reserve queue tickets from home, view live estimated wait times, and receive alerts when their turn is near. Clinics and doctors easily manage patient flow from a simple counter console.
        </p>

        {/* Quick Highlights Strip (Clean flat indicators centered) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginTop: '3.5rem',
          paddingTop: '1rem',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Clock size={20} color="#185339" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Live Wait Times</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>Accurate time estimates updated as doctors consult.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Users size={20} color="#185339" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Remote Tickets</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>Take your place in line before leaving your home.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Building2 size={20} color="#185339" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Clinic Network</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>Compare waiting times across multiple hospitals.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
