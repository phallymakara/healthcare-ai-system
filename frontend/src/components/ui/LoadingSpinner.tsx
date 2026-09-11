import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  fullHeight = false,
}) => {
  const sizePixels = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;

  return (
    <div
      className="loading-spinner-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        minHeight: fullHeight ? '60vh' : 'auto',
        gap: '1rem',
        color: '#64748b',
      }}
    >
      <div
        style={{
          width: sizePixels,
          height: sizePixels,
          border: '3px solid #e2e8f0',
          borderTopColor: '#0284c7',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {message && (
        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>
          {message}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
