'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from './button';

/* -------------------------------------------------------------------------- */
/*                                  Badge                                     */
/* -------------------------------------------------------------------------- */

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'outline';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]',
  accent: 'bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]',
  success: 'bg-[var(--color-income-subtle)] text-[var(--color-income)]',
  warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
  outline: 'border border-[var(--color-border-strong)] text-[var(--color-text-secondary)]',
};

export interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  tone?: BadgeTone;
  /** Dot communicates direction/state without relying on color alone. */
  dot?: boolean;
}

export function Badge({
  tone = 'neutral',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap ${BADGE_TONES[tone]} ${className}`.trim()}
      {...rest}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Spinner / Skeleton                              */
/* -------------------------------------------------------------------------- */

export function Spinner({
  className = 'h-4 w-4',
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2" role={label ? 'status' : undefined}>
      <Loader2
        className={`animate-spin text-[var(--color-text-muted)] ${className}`}
        aria-hidden="true"
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export interface SkeletonProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Render several stacked lines. */
  lines?: number;
}

export function Skeleton({ lines, className = '', ...rest }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'} ${className}`.trim()}
          />
        ))}
      </div>
    );
  }
  return <div className={`skeleton h-4 ${className}`.trim()} aria-hidden="true" {...rest} />;
}

/* -------------------------------------------------------------------------- */
/*                                  Alert                                     */
/* -------------------------------------------------------------------------- */

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const ALERT_TONES: Record<
  AlertTone,
  { wrap: string; icon: React.ReactNode }
> = {
  info: {
    wrap: 'bg-[var(--color-primary-subtle)] text-[var(--color-text-secondary)] border-[var(--color-primary-subtle-hover)]',
    icon: <Info className="h-4 w-4 text-[var(--color-primary-text)]" aria-hidden="true" />,
  },
  success: {
    wrap: 'bg-[var(--color-income-subtle)] text-[var(--color-text-secondary)] border-transparent',
    icon: <CheckCircle2 className="h-4 w-4 text-[var(--color-income)]" aria-hidden="true" />,
  },
  warning: {
    wrap: 'bg-[var(--color-warning-subtle)] text-[var(--color-text-secondary)] border-transparent',
    icon: <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" aria-hidden="true" />,
  },
  danger: {
    wrap: 'bg-[var(--color-danger-subtle)] text-[var(--color-text-secondary)] border-transparent',
    icon: <AlertCircle className="h-4 w-4 text-[var(--color-danger)]" aria-hidden="true" />,
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, className = '' }: AlertProps) {
  const config = ALERT_TONES[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`flex flex-col gap-2 rounded-[var(--radius-lg)] border px-3.5 py-3 text-[13px] sm:flex-row sm:items-start ${config.wrap} ${className}`.trim()}
    >
      <span className="mt-0.5 shrink-0">{config.icon}</span>
      <div className="min-w-0 flex-1">
        {title && (
          <p className="font-semibold text-[var(--color-text)]">{title}</p>
        )}
        {children && (
          <div className={title ? 'mt-0.5 text-[var(--color-text-muted)]' : ''}>{children}</div>
        )}
      </div>
      {action && <div className="shrink-0 sm:ml-2">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                       Empty / Error states                                 */
/* -------------------------------------------------------------------------- */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  align = 'left',
}: EmptyStateProps) {
  const centered = align === 'center';
  return (
    <div
      className={`flex flex-col gap-3 py-8 ${
        centered ? 'items-center text-center' : 'items-start text-left'
      } ${className}`.trim()}
    >
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      )}
      <div className="space-y-1">
        <p className="text-card-title">{title}</p>
        {description && (
          <p className={`text-secondary max-w-md ${centered ? 'mx-auto' : ''}`.trim()}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-0.5">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-start gap-3 py-8 ${className}`.trim()} role="alert">
      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)]">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="text-card-title">{title}</p>
        <p className="text-secondary max-w-md">{description}</p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leadingIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
