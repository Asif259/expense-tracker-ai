'use client';

import { useEffect, useId, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface DetailField {
  label: string;
  value: ReactNode;
}

interface TableBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  primaryValue?: ReactNode;
  primaryValueLabel?: string;
  fields: DetailField[];
  actions?: ReactNode;
  children?: ReactNode;
}

export function TableBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  primaryValue,
  primaryValueLabel = 'Amount',
  fields,
  actions,
  children,
}: TableBottomSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first interactive element (the close control)
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-scrim)] transition-opacity duration-[var(--duration-fast)] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-2xl)] border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[var(--shadow-lg)] animate-slide-up sm:max-w-md sm:rounded-[var(--radius-xl)] sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div
          className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--color-border-hover)] sm:hidden"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <div id={titleId} className="truncate text-section-title">
              {title}
            </div>
            {subtitle && <div className="mt-1 flex items-center gap-2">{subtitle}</div>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="-mr-2 inline-flex h-11 min-h-[44px] w-11 min-w-[44px] cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {primaryValue && (
            <div className="flex items-baseline justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3.5 py-3">
              <span className="text-label">{primaryValueLabel}</span>
              <span className="text-metric tabular-nums text-right">{primaryValue}</span>
            </div>
          )}

          <div>
            {fields.map((field, idx) => (
              <div
                key={idx}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] py-2 last:border-0"
              >
                <span className="shrink-0 text-secondary">{field.label}</span>
                <span className="max-w-[65%] break-words text-right text-[13px] font-medium text-[var(--color-text)]">
                  {field.value}
                </span>
              </div>
            ))}
          </div>

          {children}
        </div>

        {/* Footer actions */}
        {actions && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
