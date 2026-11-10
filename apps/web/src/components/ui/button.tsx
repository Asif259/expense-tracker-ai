import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-medium cursor-pointer ' +
  'transition-[background-color,border-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ' +
  'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-hover)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
  danger:
    'bg-[var(--color-danger)] text-[var(--color-danger-contrast)] hover:bg-[var(--color-danger-hover)]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-[13px]',
  lg: 'h-11 px-5 text-sm',
};

export function buttonStyles(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  className = '',
) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

/**
 * Primary action component. Defaults to `type="button"` so a form is never
 * submitted by accident — pass `type="submit"` explicitly.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      {children}
      {trailingIcon}
    </button>
  );
}

export interface ButtonLinkProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  className?: string;
}

/** Same visual language as `Button`, rendered as a navigational link. */
export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  className = '',
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonStyles(variant, size, className)} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}

export interface IconButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Required: icon-only controls must be announced. */
  label: string;
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
};

export function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={rest.title ?? label}
      className={`${BASE} ${VARIANTS[variant]} ${ICON_SIZES[size]} shrink-0 ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
