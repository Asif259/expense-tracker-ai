import type { ReactNode } from 'react';

export function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-eyebrow text-[var(--color-primary-text)] ${className}`.trim()}>
      {children}
    </p>
  );
}

/**
 * Marks previews that show invented numbers so nobody mistakes them for real
 * account data.
 */
export function SampleDataNote({ className = '' }: { className?: string }) {
  return (
    <span
      className={`text-[11px] font-medium text-[var(--color-text-subtle)] ${className}`.trim()}
    >
      Sample data
    </span>
  );
}
