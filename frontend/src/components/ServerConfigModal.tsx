import React, { useState, useEffect } from 'react';
import {
  getApiBase,
  setCustomServerEndpoint,
  resetServerEndpoint,
  getConnectionMetadata,
  checkBackendHealth,
  ConnectionMetadata,
} from '../services/api';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isKm?: boolean;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  isOpen,
  onClose,
  isKm = false,
}) => {
  const [meta, setMeta] = useState<ConnectionMetadata>(getConnectionMetadata());
  const [inputUrl, setInputUrl] = useState<string>(getApiBase());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'online' | 'error'>('idle');
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const currentMeta = getConnectionMetadata();
      setMeta(currentMeta);
      setInputUrl(currentMeta.apiUrl);
      setTestStatus('idle');
      setTestLatency(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (target?: string) => {
    const urlToTest = target || inputUrl;
    setTestStatus('testing');
    setErrorMessage('');
    const startTime = performance.now();

    try {
      const health = await checkBackendHealth(urlToTest);
      const latency = Math.round(performance.now() - startTime);
      setTestLatency(latency);

      if (health.status === 'ok' || health.services?.database === 'healthy') {
        setTestStatus('online');
      } else if (health.services?.database === 'unreachable') {
        setTestStatus('error');
        setErrorMessage(
          isKm
            ? 'មិនអាចតភ្ជាប់ទៅម៉ាស៊ីនបម្រើបានទេ (Server Unreachable)'
            : 'Backend unreachable. Check host IP and port.'
        );
      } else {
        setTestStatus('online');
      }
    } catch {
      setTestStatus('error');
      setErrorMessage(
        isKm
          ? 'កំហុសបណ្តាញ៖ មិនអាចទាក់ទងម៉ាស៊ីនបម្រើបានទេ'
          : 'Network error: Failed to reach backend.'
      );
    }
  };

  const handleSave = () => {
    if (!inputUrl.trim()) {
      handleReset();
      return;
    }
    setCustomServerEndpoint(inputUrl.trim());
    onClose();
    // Soft reload to reinitialize all active WebSocket and API clients
    window.location.reload();
  };

  const handleReset = () => {
    resetServerEndpoint();
    onClose();
    window.location.reload();
  };

  const applyPreset = (presetUrl: string) => {
    setInputUrl(presetUrl);
    handleTestConnection(presetUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#185339] to-[#123e2b] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isKm ? 'ការកំណត់ម៉ាស៊ីនបម្រើ (Server Connection)' : 'Server Connection & Network'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {isKm ? 'ការគ្រប់គ្រងការតភ្ជាប់ឆ្លាតវៃ (Zero Hardcoded)' : 'Dynamic 12-Factor Network Config'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Active Diagnostic Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isKm ? 'របៀបតភ្ជាប់បច្ចុប្បន្ន' : 'Resolution Mode'}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  meta.source === 'override'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300'
                    : meta.source === 'env'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}
              >
                {meta.source === 'override'
                  ? isKm ? 'ផ្ទាល់ខ្លួន (Device Override)' : 'Device Storage Override'
                  : meta.source === 'env'
                  ? 'Environment (VITE_API_BASE_URL)'
                  : meta.isNative
                  ? `Native Mobile (${meta.platform})`
                  : 'Dynamic Web Origin'}
              </span>
            </div>

            <div className="text-xs font-mono break-all text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400">API BASE:</div>
              {meta.apiUrl}
            </div>
            <div className="text-xs font-mono break-all text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
              <div className="text-[10px] text-slate-400">WS BASE:</div>
              {meta.wsUrl}
            </div>
          </div>

          {/* Quick Presets for Android / Mobile Testing */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isKm ? 'ជម្រើសលឿន (Testing Presets)' : 'Quick Switch Presets'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => applyPreset('http://192.168.15.206:9000/api/v1')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-left hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Physical Phone Wi-Fi
                </div>
                <div className="text-[10px] text-slate-400 font-mono">192.168.15.206:9000</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('http://10.0.2.2:8000/api/v1')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-left hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Android Emulator
                </div>
                <div className="text-[10px] text-slate-400 font-mono">10.0.2.2:8000</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('http://localhost:9000/api/v1')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-left hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Docker Localhost
                </div>
                <div className="text-[10px] text-slate-400 font-mono">localhost:9000</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('http://localhost:8000/api/v1')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-left hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  FastAPI Direct
                </div>
                <div className="text-[10px] text-slate-400 font-mono">localhost:8000</div>
              </button>
            </div>
          </div>

          {/* Custom URL Input Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
              <span>{isKm ? 'អាសយដ្ឋាន API ផ្ទាល់ខ្លួន' : 'Custom API Base URL'}</span>
              <span className="text-[10px] text-slate-400">
                {isKm ? 'ត្រូវតែរួមបញ្ចូល /api/v1' : 'Should end with /api/v1'}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://192.168.x.x:9000/api/v1"
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#185339]"
              />
              <button
                type="button"
                onClick={() => handleTestConnection()}
                disabled={testStatus === 'testing' || !inputUrl.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap border border-slate-200 dark:border-slate-700"
              >
                {testStatus === 'testing' ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{isKm ? 'កំពុងសាកល្បង...' : 'Testing...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    <span>{isKm ? 'សាកល្បង' : 'Test Ping'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Status Indicator */}
          {testStatus === 'online' && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-semibold">
                  {isKm ? 'ការតភ្ជាប់ជោគជ័យ! (Online)' : 'Connection Verified (Online)'}
                </span>
              </div>
              {testLatency !== null && (
                <span className="text-[11px] font-mono opacity-80">{testLatency}ms</span>
              )}
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
              <div className="font-semibold">{errorMessage}</div>
              <div className="text-[11px] opacity-80 mt-1">
                {isKm
                  ? 'សូមប្រាកដថាកុំព្យូទ័រ និងទូរស័ព្ទស្ថិតនៅលើបណ្តាញ Wi-Fi តែមួយ ឬ Backend កំពុងដំណើរការ។'
                  : 'Ensure both mobile device and PC are on the same Wi-Fi, or backend container is running.'}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
          >
            {isKm ? 'កំណត់ឡើងវិញ (Reset to Default)' : 'Reset to Default'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isKm ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#185339] hover:bg-[#123e2b] text-white shadow-md hover:shadow-lg transition-all"
            >
              {isKm ? 'រក្សាទុក & អនុវត្ត' : 'Save & Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
