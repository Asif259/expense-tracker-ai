'use client';

import { useState } from 'react';
import { Mic, MicOff, Square, X, AlertCircle } from 'lucide-react';
import { SupportedSpeechLang } from '@/lib/use-speech-recognition';

interface VoiceInputControlProps {
  isSupported: boolean;
  isListening: boolean;
  selectedLang: SupportedSpeechLang;
  onLanguageChange: (lang: SupportedSpeechLang) => void;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  error?: string | null;
  onClearError?: () => void;
  disabled?: boolean;
}

export function VoiceInputControl({
  isSupported,
  isListening,
  selectedLang,
  onLanguageChange,
  onStart,
  onStop,
  onCancel,
  error,
  onClearError,
  disabled = false,
}: VoiceInputControlProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Screen Reader live status announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {isListening
          ? `Microphone active. Listening for transaction description in ${
              selectedLang === 'bn-BD' ? 'Bangla' : 'English'
            }.`
          : error
          ? `Speech error: ${error}`
          : 'Microphone idle.'}
      </div>

      {/* Primary voice control bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left side: Language Selector pills */}
        <div
          className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5 text-xs shadow-xs"
          role="group"
          aria-label="Speech recognition language"
        >
          <button
            type="button"
            onClick={() => onLanguageChange('en-US')}
            disabled={isListening || disabled}
            aria-pressed={selectedLang === 'en-US'}
            className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-md font-medium transition-all text-xs cursor-pointer select-none ${
              selectedLang === 'en-US'
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('bn-BD')}
            disabled={isListening || disabled}
            aria-pressed={selectedLang === 'bn-BD'}
            className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-md font-medium transition-all text-xs cursor-pointer select-none ${
              selectedLang === 'bn-BD'
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            বাংলা (BN)
          </button>
        </div>

        {/* Right side: Microphone / Stop controls */}
        <div className="flex items-center gap-2 relative">
          {!isListening ? (
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={onStart}
                disabled={disabled || !isSupported}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                aria-label={
                  isSupported
                    ? 'Start voice input (speech-to-text)'
                    : 'Voice input unavailable in this browser'
                }
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] active:scale-[0.98] ${
                  isSupported
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] shadow-xs hover:border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] cursor-not-allowed opacity-60'
                }`}
              >
                {isSupported ? (
                  <>
                    <Mic className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <span className="hidden sm:inline">Voice Input</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                    <span className="hidden sm:inline">Mic Unsupported</span>
                  </>
                )}
              </button>

              {/* Accessible tooltip */}
              {showTooltip && (
                <div
                  role="tooltip"
                  className="absolute bottom-full right-0 mb-2 z-30 px-2.5 py-1.5 text-[11px] rounded-lg bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)] shadow-lg max-w-[220px] whitespace-normal pointer-events-none"
                >
                  {isSupported
                    ? `Click to speak your expense in ${
                        selectedLang === 'bn-BD' ? 'Bangla' : 'English'
                      }. Microphone permission requested on click.`
                    : 'Web Speech API is not supported in this browser. Please use standard manual keyboard input.'}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-[fadeIn_0.15s_ease-out]">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onCancel}
                aria-label="Cancel voice recording"
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]"
              >
                <X className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Cancel</span>
              </button>

              {/* Stop Listening Button */}
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop listening"
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white shadow-md shadow-[var(--color-danger)]/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]"
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
                <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Stop Listening</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active listening status indicator */}
      {isListening && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-pale-mint)] border border-[var(--color-primary)]/30 text-xs text-[var(--color-text)] animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[var(--color-primary)] animate-bounce" />
            <span className="font-medium">
              Listening in {selectedLang === 'bn-BD' ? 'Bangla (বাংলা)' : 'English'}...
            </span>
            <span className="text-[var(--color-text-muted)] text-[11px] hidden sm:inline">
              Speak naturally (e.g. &quot;Spent 250 taka on lunch using bKash today&quot;)
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-primary)] font-bold">
            REC
          </span>
        </div>
      )}

      {/* Error alert with fallback advice */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between p-3 rounded-xl bg-[var(--color-warning-bg)]/20 border border-[var(--color-warning)] text-xs text-[var(--color-text)]"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">{error}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                You can type your transaction directly into the text box above anytime.
              </p>
            </div>
          </div>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              aria-label="Dismiss error"
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-md cursor-pointer ml-2 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
