'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { RowAction } from './types';

interface TableActionsMenuProps<T> {
  row: T;
  actions: RowAction<T>[];
  identityText?: string;
  align?: 'left' | 'right';
  className?: string;
}

export function TableActionsMenu<T>({
  row,
  actions,
  identityText = 'record',
  align = 'right',
  className = '',
}: TableActionsMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!actions || actions.length === 0) {
    return null;
  }

  // Filter out any primary action if it's already shown outside, or show all in the menu
  const menuActions = actions.filter((action) => {
    if (typeof action.disabled === 'function') {
      return !action.disabled(row);
    }
    return !action.disabled;
  });

  if (menuActions.length === 0) {
    return null;
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* 44x44px Minimum Touch Area */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={`Open actions menu for ${identityText}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="w-11 h-11 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={`actions-btn-${identityText}`}
          className={`absolute z-30 mt-1 min-w-[170px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-xl transition-all duration-150 animate-in fade-in-50 zoom-in-95 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {menuActions.map((action) => {
            const isDanger = action.variant === 'danger';
            const isPrimary = action.variant === 'primary';

            return (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  action.onClick(row);
                }}
                className={`w-full text-left px-3 py-2.5 min-h-[40px] text-xs font-semibold rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                  isDanger
                    ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10'
                    : isPrimary
                    ? 'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {action.icon && (
                  <span className="shrink-0 text-current">{action.icon as ReactNode}</span>
                )}
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
