'use client';

import React, { useState } from 'react';
import { BarChart3, RefreshCw, Table } from 'lucide-react';
import { DateRangePreset } from '@/lib/chart-aggregation';
import { ButtonLink, IconButton, SegmentedControl, Skeleton } from '@/components/ui';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  currency?: string;
  badge?: string;
  selectedRange?: DateRangePreset;
  onRangeChange?: (range: DateRangePreset) => void;
  availableRanges?: { id: DateRangePreset; label: string }[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  children: React.ReactNode;
  accessibleTableView?: React.ReactNode;
  heightClass?: string;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  currency,
  badge,
  selectedRange,
  onRangeChange,
  availableRanges,
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No data for this period',
  emptyDescription = 'Add a transaction and this chart will start filling in.',
  emptyActionHref,
  emptyActionLabel,
  children,
  accessibleTableView,
  heightClass = 'h-72',
  className = '',
}: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section
      className={`surface-card flex flex-col p-4 sm:p-5 ${className}`.trim()}
      aria-label={title}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-card-title">{title}</h3>
            {currency && (
              <span className="rounded-[var(--radius-xs)] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--color-text-muted)]">
                {currency}
              </span>
            )}
            {badge && (
              <span className="rounded-[var(--radius-xs)] bg-[var(--color-primary-subtle)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-primary-text)]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-caption mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableRanges && onRangeChange && selectedRange && (
            <SegmentedControl
              size="sm"
              label={`Range for ${title}`}
              value={selectedRange}
              onChange={onRangeChange}
              options={availableRanges.map((range) => ({
                value: range.id,
                label: range.label,
              }))}
            />
          )}

          {accessibleTableView && (
            <IconButton
              size="sm"
              variant="secondary"
              label={showTable ? 'Show chart' : 'Show data table'}
              onClick={() => setShowTable((value) => !value)}
            >
              {showTable ? (
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Table className="h-4 w-4" aria-hidden="true" />
              )}
            </IconButton>
          )}
        </div>
      </div>

      <div className={`relative flex w-full items-center justify-center ${heightClass}`}>
        {loading ? (
          <div className="flex h-full w-full items-end gap-3 px-2" aria-hidden="true">
            <Skeleton className="h-1/3 flex-1" />
            <Skeleton className="h-2/3 flex-1" />
            <Skeleton className="h-1/2 flex-1" />
            <Skeleton className="h-3/4 flex-1" />
            <Skeleton className="h-2/5 flex-1" />
            <Skeleton className="h-4/5 flex-1" />
          </div>
        ) : error ? (
          <div className="flex h-full w-full flex-col items-start justify-center gap-2.5 text-left">
            <p className="text-card-title">Chart unavailable</p>
            <p className="text-secondary max-w-sm">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex h-full w-full flex-col items-start justify-center gap-2.5 text-left">
            <p className="text-card-title">{emptyTitle}</p>
            <p className="text-secondary max-w-sm">{emptyDescription}</p>
            {emptyActionHref && emptyActionLabel && (
              <ButtonLink
                href={emptyActionHref}
                size="sm"
                variant="secondary"
                className="mt-1"
              >
                {emptyActionLabel}
              </ButtonLink>
            )}
          </div>
        ) : showTable && accessibleTableView ? (
          <div className="h-full w-full overflow-y-auto">{accessibleTableView}</div>
        ) : (
          <div className="h-full w-full">{children}</div>
        )}
      </div>
    </section>
  );
}
