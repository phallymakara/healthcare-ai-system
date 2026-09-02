import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Find Clinic & Department',
      description: 'Search nearby partner hospitals, check available medical departments, and view current waiting times.',
    },
    {
      number: '02',
      title: 'Reserve Queue Ticket',
      description: 'Book your digital queue ticket in one click with your contact information without waiting in line.',
    },
    {
      number: '03',
      title: 'Track Live Progress',
      description: 'See live updates on patients ahead and estimated wait times. Receive an alert when it is time to head in.',
    },
    {
      number: '04',
      title: 'Direct Consultation',
      description: 'Walk into the clinic as your number is called and proceed directly to the doctor’s consultation room.',
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          How Health AI Assistant works in 4 steps
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
          A frictionless journey from booking to consultation.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
      }}>
        {steps.map((step) => (
          <div
            key={step.number}
            style={{
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: '#ffffff',
            }}
          >
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--accent-primary)',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}>
              {step.number}
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              {step.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
