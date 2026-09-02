import React from 'react';
import { Smartphone, Clock, Compass, Bell } from 'lucide-react';

export const PatientFeatures: React.FC = () => {
  return (
    <section id="patient-features" style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Healthcare visits without the stress
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '600px' }}>
          Spend less time in crowded waiting rooms and more time where you are comfortable.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
            <Smartphone size={18} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Remote Ticket Booking
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Reserve a consultation queue ticket for any department or doctor with your name and phone number before arriving.
          </p>
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
            <Clock size={18} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Live Queue Position
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Watch your queue number progress in real-time with continuous updates on estimated wait times and patients ahead.
          </p>
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
            <Bell size={18} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Arrival Notifications
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Receive clear arrival alerts when your turn is close so you arrive at the clinic precisely when the doctor is ready.
          </p>
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
            <Compass size={18} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Symptom Guidance
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Enter your symptoms to find the appropriate specialty department and compare queue lengths before choosing a clinic.
          </p>
        </div>
      </div>
    </section>
  );
};
