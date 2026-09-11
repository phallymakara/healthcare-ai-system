import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  action,
}) => {
  return (
    <div
      className="empty-state-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        borderRadius: '12px',
        border: '1px dashed #cbd5e1',
        backgroundColor: '#f8fafc',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          lineHeight: 1,
        }}
      >
        {icon}
      </div>
      <h4
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#1e293b',
          margin: '0 0 0.5rem 0',
        }}
      >
        {title}
      </h4>
      {description && (
        <p
          style={{
            fontSize: '0.9rem',
            color: '#64748b',
            maxWidth: '420px',
            margin: '0 0 1.25rem 0',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
