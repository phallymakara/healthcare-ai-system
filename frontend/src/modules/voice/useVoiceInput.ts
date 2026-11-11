import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_VOICE_LABELS,
  UseVoiceInputOptions,
  UseVoiceInputResult,
  VoiceStatus,
} from './types';

function pickSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return '';
}

function getSpeechRecognitionConstructor(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function resolveBrowserSpeechLocale(uiLanguage: string): string {
  return uiLanguage.startsWith('km') ? 'km-KH' : 'en-US';
}

export function useVoiceInput({
  language,
  transcribeUrl,
  capabilitiesUrl,
  getHeaders,
  onTranscript,
  onError,
  labels: customLabels,
  disabled = false,
}: UseVoiceInputOptions): UseVoiceInputResult {
  const labels = useMemo(
    () => ({ ...DEFAULT_VOICE_LABELS, ...(customLabels || {}) }),
    [customLabels]
  );

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [serverSttAvailable, setServerSttAvailable] = useState(false);
  const [bilingualAutoDetect, setBilingualAutoDetect] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    isMountedRef.current = true;
    if (!capabilitiesUrl) return;

    fetch(capabilitiesUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMountedRef.current && data && typeof data.server_stt_available === 'boolean') {
          setServerSttAvailable(data.server_stt_available);
          setBilingualAutoDetect(Boolean(data.bilingual_auto_detect ?? data.server_stt_available));
        }
      })
      .catch(() => {
        // Quiet fallback to browser speech recognition when offline
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [capabilitiesUrl]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setElapsedSeconds(0);
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [clearTimer]);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore already-stopped instance
      }
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        releaseMediaStream();
        if (isMountedRef.current) setStatus('idle');
      }
    }
  }, [clearTimer, releaseMediaStream]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    releaseMediaStream();
    if (isMountedRef.current) {
      setStatus('idle');
      setElapsedSeconds(0);
    }
  }, [clearTimer, releaseMediaStream]);

  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  const uploadAndTranscribe = useCallback(
    async (audioBlob: Blob, mimeType: string) => {
      if (!transcribeUrl) {
        onErrorRef.current?.(labelsRef.current.errUnsupported);
        if (isMountedRef.current) setStatus('idle');
        return;
      }

      if (isMountedRef.current) setStatus('transcribing');
      try {
        const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm';
        const formData = new FormData();
        formData.append('file', audioBlob, `voice-input.${ext}`);
        formData.append('language', 'auto');

        const res = await fetch(transcribeUrl, {
          method: 'POST',
          headers: getHeaders ? getHeaders() : undefined,
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || labelsRef.current.errFailed);
        }

        const data = await res.json();
        const text = String(data?.text || '').trim();
        if (!text) {
          onErrorRef.current?.(labelsRef.current.errEmpty);
        } else {
          onTranscriptRef.current(text);
        }
      } catch (err: any) {
        onErrorRef.current?.(err?.message || labelsRef.current.errFailed);
      } finally {
        if (isMountedRef.current) {
          setStatus('idle');
          setElapsedSeconds(0);
        }
      }
    },
    [transcribeUrl, getHeaders]
  );

  const startMediaRecorder = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onErrorRef.current?.(labelsRef.current.errUnsupported);
      return;
    }

    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = pickSupportedAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const wasCancelled = cancelledRef.current;
        const resolvedMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: resolvedMime });
        releaseMediaStream();
        clearTimer();

        if (wasCancelled) {
          if (isMountedRef.current) setStatus('idle');
          return;
        }
        if (blob.size === 0) {
          onErrorRef.current?.(labelsRef.current.errEmpty);
          if (isMountedRef.current) setStatus('idle');
          return;
        }
        uploadAndTranscribe(blob, resolvedMime);
      };

      recorder.onerror = () => {
        releaseMediaStream();
        clearTimer();
        onErrorRef.current?.(labelsRef.current.errFailed);
        if (isMountedRef.current) setStatus('idle');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setStatus('recording');
      startTimer();
    } catch (err: any) {
      releaseMediaStream();
      clearTimer();
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        onErrorRef.current?.(labelsRef.current.errPermission);
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        onErrorRef.current?.(labelsRef.current.errNoMic);
      } else {
        onErrorRef.current?.(labelsRef.current.errFailed);
      }
      if (isMountedRef.current) setStatus('idle');
    }
  }, [clearTimer, releaseMediaStream, startTimer, uploadAndTranscribe]);

  const startSpeechRecognition = useCallback(
    (SpeechRecognitionCtor: any) => {
      cancelledRef.current = false;
      const targetLocale = resolveBrowserSpeechLocale(languageRef.current);
      try {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = targetLocale;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          if (isMountedRef.current) {
            setStatus('recording');
            startTimer();
          }
        };

        recognition.onresult = (event: any) => {
          if (cancelledRef.current) return;
          const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
          if (transcript) {
            onTranscriptRef.current(transcript);
          } else {
            onErrorRef.current?.(labelsRef.current.errEmpty);
          }
        };

        recognition.onerror = (event: any) => {
          clearTimer();
          recognitionRef.current = null;
          if (cancelledRef.current) {
            if (isMountedRef.current) setStatus('idle');
            return;
          }
          const errCode = event?.error || '';
          if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
            onErrorRef.current?.(labelsRef.current.errPermission);
          } else if (errCode === 'audio-capture') {
            onErrorRef.current?.(labelsRef.current.errNoMic);
          } else if (errCode === 'no-speech') {
            onErrorRef.current?.(labelsRef.current.errEmpty);
          } else if (errCode === 'language-not-supported') {
            onErrorRef.current?.(labelsRef.current.errUnsupported);
          } else if (errCode !== 'aborted') {
            onErrorRef.current?.(labelsRef.current.errFailed);
          }
          if (isMountedRef.current) setStatus('idle');
        };

        recognition.onend = () => {
          clearTimer();
          recognitionRef.current = null;
          if (isMountedRef.current) {
            setStatus('idle');
            setElapsedSeconds(0);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        clearTimer();
        recognitionRef.current = null;
        onErrorRef.current?.(labelsRef.current.errFailed);
        if (isMountedRef.current) setStatus('idle');
      }
    },
    [clearTimer, startTimer]
  );

  const toggleVoice = useCallback(() => {
    if (disabled || status === 'transcribing') return;

    if (status === 'recording') {
      stopRecording();
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    const canRecordMedia =
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined';

    if ((serverSttAvailable && transcribeUrl && canRecordMedia) || (!SpeechRecognitionCtor && canRecordMedia && transcribeUrl)) {
      startMediaRecorder();
      return;
    }

    if (SpeechRecognitionCtor) {
      startSpeechRecognition(SpeechRecognitionCtor);
      return;
    }

    onErrorRef.current?.(labelsRef.current.errUnsupported);
  }, [
    disabled,
    serverSttAvailable,
    startMediaRecorder,
    startSpeechRecognition,
    status,
    stopRecording,
    transcribeUrl,
  ]);

  return {
    status,
    isRecording: status === 'recording',
    isTranscribing: status === 'transcribing',
    elapsedSeconds,
    serverSttAvailable,
    bilingualAutoDetect,
    toggleVoice,
    stopRecording,
    cancelRecording,
    labels,
  };
}
