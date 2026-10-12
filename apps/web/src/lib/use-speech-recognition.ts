'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

// Browser Web Speech API interfaces
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type SupportedSpeechLang = 'en-US' | 'bn-BD';

export interface UseSpeechRecognitionOptions {
  lang?: SupportedSpeechLang;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string, errorCode: string) => void;
  onEnd?: () => void;
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function mapSpeechError(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Please allow microphone permissions in your browser settings.';
    case 'audio-capture':
      return 'No microphone was detected, or your microphone is in use by another application.';
    case 'no-speech':
      return 'No speech was detected. Please try speaking closer to the microphone.';
    case 'network':
      return 'Network connection issue prevented speech recognition. Check your connection or try manual entry.';
    case 'language-not-supported':
      return 'The selected language is not supported by your browser speech engine.';
    case 'aborted':
      return 'Speech recognition was cancelled.';
    default:
      return `Speech recognition error (${error}). You can continue using manual text entry.`;
  }
}

const noopSubscribe = () => () => {};

export function useSpeechRecognition({
  lang = 'en-US',
  onResult,
  onError,
  onEnd,
}: UseSpeechRecognitionOptions = {}) {
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    () => isSpeechRecognitionSupported(),
    () => false,
  );

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManuallyStoppingRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onEndRef = useRef(onEnd);
  const langRef = useRef(lang);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    onEndRef.current = onEnd;
    langRef.current = lang;
  }, [onResult, onError, onEnd, lang]);

  const cleanupRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch {
        // Safe ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) {
      setIsListening(false);
      return;
    }
    isManuallyStoppingRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch {
      cleanupRecognition();
      setIsListening(false);
    }
  }, [cleanupRecognition]);

  const cancel = useCallback(() => {
    cleanupRecognition();
    setIsListening(false);
    setInterimTranscript('');
    setError(null);
    setErrorCode(null);
  }, [cleanupRecognition]);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRec = getSpeechRecognitionConstructor();
    if (!SpeechRec) {
      const msg = 'Speech recognition is not supported in this browser. Please use manual keyboard entry.';
      setError(msg);
      setErrorCode('not-supported');
      onErrorRef.current?.(msg, 'not-supported');
      return;
    }

    // Prevent duplicate sessions
    if (recognitionRef.current) {
      return;
    }

    setError(null);
    setErrorCode(null);
    setInterimTranscript('');
    isManuallyStoppingRef.current = false;

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = langRef.current;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setErrorCode(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            currentFinal += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentFinal) {
          setFinalTranscript((prev) => {
            const next = prev ? `${prev} ${currentFinal}`.trim() : currentFinal.trim();
            onResultRef.current?.(next, true);
            return next;
          });
        }

        setInterimTranscript(currentInterim);
        if (currentInterim && !currentFinal) {
          onResultRef.current?.(currentInterim, false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const code = event.error;
        // Don't treat user-initiated aborts as a scary error toast
        if (code === 'aborted' && isManuallyStoppingRef.current) {
          return;
        }

        const friendlyMsg = mapSpeechError(code);
        setError(friendlyMsg);
        setErrorCode(code);
        onErrorRef.current?.(friendlyMsg, code);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        recognitionRef.current = null;
        isManuallyStoppingRef.current = false;
        onEndRef.current?.();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start speech recognition.';
      setError(msg);
      setErrorCode('start-failure');
      setIsListening(false);
      recognitionRef.current = null;
      onErrorRef.current?.(msg, 'start-failure');
    }
  }, []);

  // Clean up recognition resources when unmounting
  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    errorCode,
    start,
    stop,
    cancel,
    clearError: () => {
      setError(null);
      setErrorCode(null);
    },
    resetTranscript: () => {
      setFinalTranscript('');
      setInterimTranscript('');
    },
  };
}
