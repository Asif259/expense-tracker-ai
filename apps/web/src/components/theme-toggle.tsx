'use client';

import React from 'react';
import { useTheme } from '@/context/theme-context';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function ThemeToggle({ variant = 'compact', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Until mounted, render a neutral placeholder to avoid a hydration layout shift.
  if (!mounted) {
    return (
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`.trim()}
        aria-hidden="true"
      >
        <div className="h-4 w-4 rounded-full bg-[var(--color-surface-sunken)]" />
      </div>
    );
  }

  const isDark = theme === 'dark';
  const nextLabel = `Switch to ${isDark ? 'light' : 'dark'} theme`;

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={nextLabel}
        title={nextLabel}
        className={`flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-md)] px-2.5 text-[13px] font-medium text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${className}`.trim()}
      >
        <span className="flex items-center gap-2.5">
          {isDark ? (
            <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
          ) : (
            <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
          )}
          <span>{isDark ? 'Dark theme' : 'Light theme'}</span>
        </span>
        <span className="text-[11px] font-medium text-[var(--color-text-subtle)]">
          {isDark ? 'On' : 'Off'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${className}`.trim()}
    >
      {isDark ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
