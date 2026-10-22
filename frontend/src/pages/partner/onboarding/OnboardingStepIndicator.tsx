import React from 'react';
import { Check } from 'lucide-react';

export interface StepMeta {
  number: number;
  title: string;
}

export interface OnboardingStepIndicatorProps {
  currentStep: number;
  steps: StepMeta[];
  t: (key: string) => string;
}

export const OnboardingStepIndicator: React.FC<OnboardingStepIndicatorProps> = ({
  currentStep,
  steps,
}) => {
  return (
    <div style={{ width: '100%', marginTop: '0.75rem' }}>
      {/* Modern Stepper Grid without any horizontal lines */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          width: '100%',
        }}
      >
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <div
              key={step.number}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: 0,
              }}
            >
              {/* Number / Checkmark Badge */}
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: isActive
                    ? 'var(--accent-primary)'
                    : isCompleted
                    ? 'rgba(24, 83, 57, 0.15)'
                    : 'var(--border-color)',
                  color: isActive
                    ? '#ffffff'
                    : isCompleted
                    ? 'var(--accent-primary)'
                    : 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? <Check size={12} strokeWidth={3} /> : step.number}
              </div>

              {/* Step Title in Khmer / English */}
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                  color: isActive
                    ? 'var(--accent-primary)'
                    : isCompleted
                    ? 'var(--text-main)'
                    : 'var(--text-muted)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingStepIndicator;

