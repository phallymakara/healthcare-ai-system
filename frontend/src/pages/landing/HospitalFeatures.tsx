import React from 'react';
import { SlidersHorizontal, CalendarCheck, ShieldCheck } from 'lucide-react';

export const HospitalFeatures: React.FC = () => {
  return (
    <section id="hospital-features" style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Streamline daily clinic operations
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '600px' }}>
          Eliminate paper queue bottlenecks, organize counter desks, and synchronize patient flow effortlessly.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
      }}>
        <div style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: '#ffffff',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <SlidersHorizontal size={18} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Live Counter Console
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.75rem' }}>
            Doctors and receptionists control the queue with 1-click status actions: Call Next, Start Consultation, Complete, or Mark No-Show.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <li>✓ Instant sync across patient devices</li>
            <li>✓ Walk-in ticket creation for in-person arrivals</li>
          </ul>
        </div>

        <div style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: '#ffffff',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <CalendarCheck size={18} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Doctor Shift & Room Management
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.75rem' }}>
            Assign doctor shifts, manage room numbers, and adjust consultation pacing to match daily staff availability.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <li>✓ Real-time doctor availability status</li>
            <li>✓ Dynamic department queue balancing</li>
          </ul>
        </div>

        <div style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: '#ffffff',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <ShieldCheck size={18} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Verified Healthcare Network
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.75rem' }}>
            Partner hospitals and clinics undergo verification to ensure reliable healthcare delivery and patient safety.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <li>✓ Secure role-based staff access</li>
            <li>✓ Clean patient record governance</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
