'use client';

import React from 'react';
import { useTheme } from '@/context/theme-context';

interface ThemeToggleProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function ThemeToggle({ variant = 'compact', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Until mounted, render a neutral placeholder to avoid hydration layout shift
  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center justify-center p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] ${className}`}
        aria-hidden="true"
      >
        <div className="w-4 h-4 rounded-full bg-[var(--color-border)]" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  if (variant === 'full') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors cursor-pointer text-xs font-medium focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${className}`}
      >
        <span className="flex items-center gap-2">
          {isDark ? (
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
          <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </span>
        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-text-dim)] border border-[var(--color-border)]">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${className}`}
    >
      {isDark ? (
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
