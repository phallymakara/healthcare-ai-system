export type VoiceStatus = 'idle' | 'recording' | 'transcribing';

export interface VoiceLabels {
  listening: string;
  transcribing: string;
  stopAndSend: string;
  cancel: string;
  micTitle: string;
  errPermission: string;
  errNoMic: string;
  errUnsupported: string;
  errEmpty: string;
  errFailed: string;
}

export const DEFAULT_VOICE_LABELS: VoiceLabels = {
  listening: 'Listening...',
  transcribing: 'Transcribing voice...',
  stopAndSend: 'Stop',
  cancel: 'Cancel',
  micTitle: 'Voice input',
  errPermission: 'Microphone permission was denied. Please allow microphone access and try again.',
  errNoMic: 'No microphone was detected on your device.',
  errUnsupported: 'Voice input is not supported in this browser.',
  errEmpty: 'No speech was detected. Please try speaking again.',
  errFailed: 'Could not transcribe voice input. Please try again.',
};

export interface UseVoiceInputOptions {
  language: string;
  transcribeUrl?: string;
  capabilitiesUrl?: string;
  getHeaders?: () => HeadersInit;
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
  labels?: Partial<VoiceLabels>;
  disabled?: boolean;
}

export interface UseVoiceInputResult {
  status: VoiceStatus;
  isRecording: boolean;
  isTranscribing: boolean;
  elapsedSeconds: number;
  serverSttAvailable: boolean;
  bilingualAutoDetect: boolean;
  toggleVoice: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
  labels: VoiceLabels;
}
