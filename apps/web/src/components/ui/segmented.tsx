import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Optional count or short annotation shown next to the label. */
  hint?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group, e.g. "Chart range". */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Compact view switcher. Uses pressed-button semantics (not a fake tablist),
 * so it works the same for filters and chart ranges.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const height = size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]';
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex w-fit items-center gap-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-0.5 ${className}`.trim()}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] font-medium whitespace-nowrap transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${height} ${
              active
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {option.label}
            {option.hint && (
              <span className="tabular-nums text-[var(--color-text-subtle)]">{option.hint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
