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
  t,
}) => {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {steps.map((step, idx) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div
              key={step.number}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
              }}
            >
              {idx > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '-50%',
                    right: '50%',
                    height: '1px',
                    backgroundColor:
                      currentStep >= step.number
                        ? 'var(--accent-primary)'
                        : 'var(--border-color)',
                    zIndex: 1,
                  }}
                />
              )}

              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  backgroundColor: isActive
                    ? 'var(--accent-primary)'
                    : isCompleted
                    ? 'var(--bg-secondary)'
                    : 'transparent',
                  color: isActive
                    ? '#ffffff'
                    : isCompleted
                    ? 'var(--text-main)'
                    : 'var(--text-muted)',
                  border: `1px solid ${
                    isActive
                      ? 'var(--accent-primary)'
                      : isCompleted
                      ? 'var(--accent-primary)'
                      : 'var(--border-color)'
                  }`,
                  zIndex: 2,
                  boxShadow: 'none',
                  marginBottom: '0.45rem',
                }}
              >
                {isCompleted ? <Check size={16} /> : step.number}
              </div>

              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: '0.88rem',
          color: 'var(--accent-primary)',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        {t('onboard_step_of')
          .replace('{current}', String(currentStep))
          .replace('{total}', '4')}
      </div>
    </>
  );
};

export default OnboardingStepIndicator;
