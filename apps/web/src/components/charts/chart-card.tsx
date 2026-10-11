'use client';

import React, { useState } from 'react';
import { Table, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { DateRangePreset } from '@/lib/chart-aggregation';

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
  emptyTitle = 'No data available',
  emptyDescription = 'Record transactions to generate financial charts.',
  emptyActionHref,
  emptyActionLabel,
  children,
  accessibleTableView,
  heightClass = 'h-72',
  className = '',
}: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div
      className={`border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-card)] flex flex-col justify-between transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-card-title tracking-tight">
              {title}
            </h3>
            {currency && (
              <span className="text-[10px] tabular-nums font-semibold px-2 py-0.5 rounded-full bg-[var(--color-pale-cyan)] text-[var(--color-text)] border border-[var(--color-border)]">
                {currency}
              </span>
            )}
            {badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-pale-mint)] text-[var(--color-text)]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Controls: Date range & Table Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {availableRanges && onRangeChange && (
            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5 text-[11px] font-medium">
              {availableRanges.map((range) => {
                const isActive = selectedRange === range.id;
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => onRangeChange(range.id)}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--color-surface)] text-[var(--color-text)] font-semibold shadow-xs'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          )}

          {accessibleTableView && (
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              aria-label={showTable ? 'Switch to chart view' : 'Switch to accessible data table'}
              title={showTable ? 'Show Chart' : 'Show Accessible Data Table'}
              className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            >
              {showTable ? (
                <BarChart3 className="w-4 h-4" />
              ) : (
                <Table className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Body / Chart Canvas */}
      <div className={`w-full ${heightClass} relative flex items-center justify-center`}>
        {loading ? (
          <div className="w-full h-full flex flex-col justify-end gap-3 p-4 animate-pulse bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
            <div className="h-4 w-1/4 bg-[var(--color-surface-hover)] rounded" />
            <div className="flex items-end justify-between gap-3 h-3/4 w-full">
              <div className="w-12 h-1/2 bg-[var(--color-surface-hover)] rounded-t" />
              <div className="w-12 h-3/4 bg-[var(--color-surface-hover)] rounded-t" />
              <div className="w-12 h-2/3 bg-[var(--color-surface-hover)] rounded-t" />
              <div className="w-12 h-4/5 bg-[var(--color-surface-hover)] rounded-t" />
              <div className="w-12 h-1/3 bg-[var(--color-surface-hover)] rounded-t" />
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
            <AlertCircle className="w-8 h-8 text-[var(--color-text-muted)] mb-2" />
            <h4 className="text-xs font-bold text-[var(--color-text)]">Unable to load chart</h4>
            <p className="text-[11px] text-[var(--color-text-muted)] max-w-xs mt-1 mb-3">
              {error}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-sm font-semibold text-[var(--color-text-muted)] mb-2.5">
              📊
            </div>
            <h4 className="text-xs font-bold text-[var(--color-text)]">{emptyTitle}</h4>
            <p className="text-[11px] text-[var(--color-text-muted)] max-w-sm mt-1 mb-3">
              {emptyDescription}
            </p>
            {emptyActionHref && emptyActionLabel && (
              <Link
                href={emptyActionHref}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                {emptyActionLabel}
              </Link>
            )}
          </div>
        ) : showTable && accessibleTableView ? (
          <div className="w-full h-full overflow-y-auto">
            {accessibleTableView}
          </div>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </div>
    </div>
  );
}
