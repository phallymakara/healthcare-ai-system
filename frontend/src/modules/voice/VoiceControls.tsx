import React from 'react';
import { Circle, Loader2, Mic, X } from 'lucide-react';
import { VoiceLabels, VoiceStatus } from './types';

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface VoiceMicButtonProps {
  status: VoiceStatus;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  status,
  disabled = false,
  onClick,
  title,
}) => {
  const isRecording = status === 'recording';
  const isTranscribing = status === 'transcribing';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled || isTranscribing}
      style={{
        background: 'none',
        border: 'none',
        cursor: disabled || isTranscribing ? 'not-allowed' : 'pointer',
        padding: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isRecording ? '#dc2626' : isTranscribing ? 'var(--accent-primary)' : '#64748b',
        transition: 'color var(--transition-fast)',
        borderRadius: '4px',
      }}
      aria-label={title}
      title={title}
    >
      {isTranscribing ? (
        <Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} />
      ) : isRecording ? (
        <Circle size={16} fill="currentColor" />
      ) : (
        <Mic size={19} />
      )}
    </button>
  );
};

export interface VoiceRecordingBarProps {
  status: VoiceStatus;
  elapsedSeconds: number;
  labels: VoiceLabels;
  onStop: () => void;
  onCancel: () => void;
  fontFamily?: string;
}

export const VoiceRecordingBar: React.FC<VoiceRecordingBarProps> = ({
  status,
  elapsedSeconds,
  labels,
  onStop,
  onCancel,
  fontFamily = 'inherit',
}) => {
  if (status === 'idle') return null;

  const isRecording = status === 'recording';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.65rem',
        flexWrap: 'wrap',
        background: 'var(--bg-secondary, #f8fafc)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '6px 12px',
        marginBottom: '8px',
        fontSize: '0.82rem',
        color: 'var(--text-main)',
        boxShadow: 'none',
        fontFamily,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isRecording ? (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
        ) : (
          <Loader2
            size={14}
            style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite', flexShrink: 0 }}
          />
        )}
        <span style={{ fontWeight: 600 }}>
          {isRecording ? `${labels.listening} (${formatElapsed(elapsedSeconds)})` : labels.transcribing}
        </span>
      </div>

      {isRecording && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={onStop}
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '3px 10px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily,
            }}
          >
            {labels.stopAndSend}
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label={labels.cancel}
            title={labels.cancel}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontFamily,
            }}
          >
            <X size={12} />
            <span>{labels.cancel}</span>
          </button>
        </div>
      )}
    </div>
  );
};
