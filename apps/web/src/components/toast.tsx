'use client';

import { useEffect, useState } from 'react';

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

export function Toaster() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  const borderMap = {
    success: 'border-[var(--color-income)] text-[var(--color-income)]',
    error: 'border-[var(--color-expense)] text-[var(--color-expense)]',
    info: 'border-[var(--color-primary)] text-[var(--color-primary)]',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl border bg-[var(--color-surface)] shadow-xl text-sm font-medium animate-[slideUp_0.2s_ease-out] ${borderMap[t.type]}`}
        >
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
