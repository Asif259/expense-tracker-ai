import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const CONTROL_BASE =
  'w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-sm text-[var(--color-text)] ' +
  'placeholder:text-[var(--color-text-subtle)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ' +
  'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)] ' +
  'disabled:bg-[var(--color-surface-sunken)] disabled:text-[var(--color-text-subtle)] disabled:cursor-not-allowed';

function controlClasses(invalid?: boolean, className = '') {
  return `${CONTROL_BASE} ${
    invalid
      ? 'border-[var(--color-danger)]'
      : 'border-[var(--color-border-strong)] hover:border-[var(--color-border-hover)]'
  } ${className}`.trim();
}

export interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  invalid?: boolean;
}

export function Input({ invalid, className = '', ...rest }: InputProps) {
  return (
    <input
      className={controlClasses(invalid, `h-10 px-3 ${className}`)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export interface TextareaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  invalid?: boolean;
}

export function Textarea({ invalid, className = '', rows = 3, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={controlClasses(invalid, `min-h-[76px] px-3 py-2.5 resize-y ${className}`)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export interface SelectProps extends React.ComponentPropsWithoutRef<'select'> {
  invalid?: boolean;
}

export function Select({ invalid, className = '', children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={controlClasses(
          invalid,
          `h-10 appearance-none pl-3 pr-9 cursor-pointer ${className}`,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]"
        aria-hidden="true"
      />
    </div>
  );
}

export interface FieldProps {
  /** Must match the `id` of the single control rendered as `children`. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + supporting text + validation message. Clones the single
 * child control to wire up `aria-describedby` / `aria-invalid`.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className = '',
  children,
}: FieldProps) {
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  let control = children;
  if (React.isValidElement(children)) {
    control = React.cloneElement(
      children as React.ReactElement<{
        'aria-describedby'?: string;
        'aria-invalid'?: boolean;
      }>,
      {
        'aria-describedby': describedBy,
        ...(error ? { 'aria-invalid': true } : {}),
      },
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <label htmlFor={id} className="text-label block">
        {label}
        {required && (
          <span className="text-[var(--color-text-subtle)]" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-caption">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-caption flex items-start gap-1.5 text-[var(--color-danger)]"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
