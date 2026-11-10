import React from 'react';

/* -------------------------------------------------------------------------- */
/*                                Page header                                 */
/* -------------------------------------------------------------------------- */

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Primary action(s) for this page section. */
  actions?: React.ReactNode;
  /** Small metadata line under the title (dates, counts, context). */
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  className = '',
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}
    >
      <div className="min-w-0">
        <h1 className="text-page-title">{title}</h1>
        {meta && <div className="mt-1.5 text-secondary">{meta}</div>}
        {description && (
          <p className="text-secondary mt-1.5 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Card                                     */
/* -------------------------------------------------------------------------- */

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CARD_PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
} as const;

/** A bordered surface used for real grouping only — not every section. */
export function Card({ padding = 'md', className = '', children, ...rest }: CardProps) {
  return (
    <div className={`surface-card ${CARD_PADDING[padding]} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Section                                   */
/* -------------------------------------------------------------------------- */

export interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Use an `h2` (default) or `h3` depending on nesting. */
  headingLevel?: 2 | 3;
}

/**
 * A labelled page section. No container is added by default: whitespace and
 * hairlines separate sections better than another rounded card.
 */
export function Section({
  title,
  description,
  actions,
  children,
  className = '',
  headingLevel = 2,
}: SectionProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className={`space-y-4 ${className}`.trim()}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            {title && <Heading className="text-section-title">{title}</Heading>}
            {description && <p className="text-secondary mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Metric                                   */
/* -------------------------------------------------------------------------- */

export interface MetricProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** `lg` is for the single most important number on the screen. */
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * A single financial metric. Renders without a container so it can sit in a
 * stat strip or a card; keeps the label quiet and the number dominant.
 */
export function Metric({ label, value, hint, icon, size = 'md', className = '' }: MetricProps) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
        {icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
        <span className="truncate text-label">{label}</span>
      </div>
      <div className={size === 'lg' ? 'text-metric-xl mt-1.5' : 'text-metric mt-1'}>
        {value}
      </div>
      {hint && <div className="text-caption mt-1">{hint}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Stat strip                                    */
/* -------------------------------------------------------------------------- */

export interface StatStripProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Rows of related metrics separated by hairlines instead of four competing
 * cards. Stacks to one column on small screens.
 */
export function StatStrip({ children, className = '' }: StatStripProps) {
  return (
    <div
      className={`grid grid-cols-1 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
