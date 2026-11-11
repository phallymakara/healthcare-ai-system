import React from 'react';
import {
  PartnerDocumentsManager,
  HospitalDocumentItem,
} from '../../../components/PartnerDocumentsManager';

export interface OnboardingDocumentsStepProps {
  documents: HospitalDocumentItem[];
  onDocumentsChange: (docs: HospitalDocumentItem[]) => void;
  error?: string;
  onClearError: () => void;
  t: (key: string) => string;
}

export const OnboardingDocumentsStep: React.FC<OnboardingDocumentsStepProps> = ({
  documents,
  onDocumentsChange,
  error,
  onClearError,
  t,
}) => {
  return (
    <div>
      <div style={{ marginBottom: '0.85rem' }}>
        <h2
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: '0 0 0.2rem 0',
          }}
        >
          {t('onboard_step_4_title')}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
          {t('onboard_step_4_desc')}
        </p>
      </div>

      <PartnerDocumentsManager
        documents={documents}
        onDocumentsChange={onDocumentsChange}
        error={error}
        onClearError={onClearError}
      />
    </div>
  );
};

export default OnboardingDocumentsStep;

