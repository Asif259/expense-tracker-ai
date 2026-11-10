'use client';

import { useState } from 'react';
import { AlertCircle, Mic, MicOff, Square, X } from 'lucide-react';
import { Alert, Badge, Button, IconButton } from '@/components/ui';
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

const LANGUAGES: { value: SupportedSpeechLang; label: string; spokenLabel: string }[] = [
  { value: 'en-US', label: 'English', spokenLabel: 'English' },
  { value: 'bn-BD', label: 'বাংলা', spokenLabel: 'Bangla' },
];

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

  const lang = LANGUAGES.find((item) => item.value === selectedLang) ?? LANGUAGES[0];
  const controlsDisabled = disabled || isListening;

  return (
    <div className="flex w-full flex-col gap-2.5">
      {/* Screen reader live status announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {isListening
          ? `Microphone active. Listening for a transaction description in ${lang.spokenLabel}.`
          : error
            ? `Speech error: ${error}`
            : 'Microphone idle.'}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Language selector */}
        <div
          className="inline-flex w-fit items-center gap-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-0.5"
          role="group"
          aria-label="Speech recognition language"
        >
          {LANGUAGES.map((option) => {
            const active = option.value === selectedLang;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onLanguageChange(option.value)}
                disabled={controlsDisabled}
                aria-pressed={active}
                className={`h-8 cursor-pointer rounded-[var(--radius-sm)] px-3 text-[13px] font-medium transition-colors duration-[var(--duration-fast)] disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Microphone / recording controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isListening ? (
            <div
              className="relative inline-flex items-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowTooltip(false);
                  onStart();
                }}
                disabled={disabled || !isSupported}
                aria-label={
                  isSupported
                    ? `Start voice input in ${lang.spokenLabel}`
                    : 'Voice input is not available in this browser'
                }
                leadingIcon={
                  isSupported ? (
                    <Mic className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                  ) : (
                    <MicOff className="h-4 w-4" aria-hidden="true" />
                  )
                }
                className="min-h-10"
              >
                {isSupported ? 'Speak' : 'Mic unavailable'}
              </Button>

              {showTooltip && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute right-0 bottom-full z-30 mb-2 max-w-[240px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1.5 text-caption whitespace-normal text-[var(--color-text)] shadow-[var(--shadow-md)]"
                >
                  {isSupported
                    ? `Start speaking in ${lang.spokenLabel}. Your browser will ask for microphone permission the first time.`
                    : 'This browser does not support voice input. You can type the transaction instead.'}
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                leadingIcon={<X className="h-4 w-4" aria-hidden="true" />}
                className="min-h-10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onStop}
                leadingIcon={<Square className="h-4 w-4 fill-current" aria-hidden="true" />}
                className="min-h-10"
              >
                Stop listening
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Active listening status */}
      {isListening && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--color-primary-subtle-hover)] bg-[var(--color-primary-subtle)] px-3.5 py-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]"
              aria-hidden="true"
            />
            <span className="text-label text-[var(--color-text)]">
              Listening in {selectedLang === 'bn-BD' ? 'বাংলা' : 'English'}
            </span>
            <span className="text-caption hidden sm:inline">
              Speak naturally, for example “Spent 250 taka on lunch today”.
            </span>
          </div>
          <Badge tone="accent" dot>
            Recording
          </Badge>
        </div>
      )}

      {/* Error with fallback advice */}
      {error && (
        <Alert
          tone="warning"
          title={error}
          action={
            onClearError ? (
              <IconButton label="Dismiss voice input error" size="sm" onClick={onClearError}>
                <X className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            ) : undefined
          }
        >
          You can type the transaction directly into the text box above instead.
        </Alert>
      )}

      {/* Icon-only visual hint for unsupported browsers is announced above; keep the note quiet. */}
      {!isSupported && (
        <p className="text-caption flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Voice input is not available in this browser. Typing works the same way.
        </p>
      )}
    </div>
  );
}
