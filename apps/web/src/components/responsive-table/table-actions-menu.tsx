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
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the first item when the menu opens so keyboard users land in it.
  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [isOpen]);

  // Close on outside click or Escape
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
    <div className={`relative inline-block text-left ${className}`.trim()} ref={menuRef}>
      {/* 44x44px minimum touch area */}
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
        className="inline-flex h-11 min-h-[44px] w-11 min-w-[44px] cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          role="menu"
          aria-orientation="vertical"
          aria-label={`Actions for ${identityText}`}
          className={`absolute z-40 mt-1 min-w-[180px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-md)] animate-fade-in ${
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
                className={`flex min-h-[40px] w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 text-left text-[13px] font-medium transition-colors duration-[var(--duration-fast)] ${
                  isDanger
                    ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]'
                    : isPrimary
                      ? 'text-[var(--color-primary-text)] hover:bg-[var(--color-primary-subtle)]'
                      : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {action.icon && (
                  <span className="shrink-0 text-current" aria-hidden="true">
                    {action.icon as ReactNode}
                  </span>
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
