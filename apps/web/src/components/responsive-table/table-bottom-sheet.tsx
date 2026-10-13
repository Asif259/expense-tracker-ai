'use client';

import { useEffect, useRef, ReactNode } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;

    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Record Details"
    >
      <div
        className="w-full sm:max-w-md max-h-[88vh] bg-[var(--color-surface-elevated)] border-t sm:border border-[var(--color-border)] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle pill on mobile */}
        <div className="w-10 h-1 bg-[var(--color-border-hover)] rounded-full mx-auto -mt-1 mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-[var(--color-text)] truncate">
              {title}
            </div>
            {subtitle && <div className="mt-1 flex items-center gap-2">{subtitle}</div>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close record details"
            className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content with scroll */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Primary Numeric Slot Banner if provided */}
          {primaryValue && (
            <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                {primaryValueLabel}
              </span>
              <span className="text-xl font-extrabold tabular-nums text-[var(--color-text)]">
                {primaryValue}
              </span>
            </div>
          )}

          {/* Key-Value Details Grid */}
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div
                key={idx}
                className="flex items-baseline justify-between gap-4 py-1.5 border-b border-[var(--color-border)]/50 last:border-0"
              >
                <span className="text-xs font-medium text-[var(--color-text-muted)] shrink-0">
                  {field.label}
                </span>
                <span className="text-xs font-semibold text-[var(--color-text)] text-right break-words max-w-[65%]">
                  {field.value}
                </span>
              </div>
            ))}
          </div>

          {children}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
