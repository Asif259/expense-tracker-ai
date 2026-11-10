'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
let addToastFn: ((t: Omit<ToastData, 'id'>) => void) | null = null;

export function toast(message: string, type: ToastData['type'] = 'info') {
  addToastFn?.({ message, type });
}

const TONE = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-[var(--color-income)]" aria-hidden="true" />,
    accent: 'border-l-[var(--color-income)]',
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 text-[var(--color-danger)]" aria-hidden="true" />,
    accent: 'border-l-[var(--color-danger)]',
  },
  info: {
    icon: <Info className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />,
    accent: 'border-l-[var(--color-primary)]',
  },
} as const;

export function Toaster() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = ++toastId;
      setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map((item) => {
        const tone = TONE[item.type];
        return (
          <div
            key={item.id}
            role={item.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-2.5 rounded-[var(--radius-md)] border border-l-2 border-[var(--color-border)] ${tone.accent} bg-[var(--color-surface-elevated)] px-3.5 py-3 shadow-[var(--shadow-md)]`}
          >
            <span className="mt-0.5 shrink-0">{tone.icon}</span>
            <p className="min-w-0 flex-1 text-[13px] leading-snug text-[var(--color-text)]">
              {item.message}
            </p>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== item.id))}
              className="-m-1 shrink-0 cursor-pointer rounded-[var(--radius-xs)] p-1 text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
