'use client';

import { PieChart, CheckCircle2 } from 'lucide-react';

/**
 * Category distribution plus a settled loan preview. Chart colors are a
 * restrained set pulled from the app's chart palette; amounts stay neutral.
 */
export function BenefitsIllustration() {
  return (
    <div
      className="relative mx-auto w-full max-w-[480px] select-none"
      role="img"
      aria-label="Preview of October 2026 spending by category — housing, food and dining, savings, and utilities, totalling ৳28,550 — and a ৳2,500 trip-share loan to Tanvir marked as settled."
    >
      <div className="space-y-4">
        {/* Category distribution */}
        <div className="space-y-4 rounded-[var(--radius-xl)] border border-landing-border bg-landing-surface-card p-5 shadow-md sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-landing-border pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]">
                <PieChart className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="truncate text-sm font-semibold text-landing-text">
                Spending by category
              </span>
            </div>
            <span className="shrink-0 text-xs font-medium text-landing-text-muted">
              October 2026
            </span>
          </div>

          {/* Segmented distribution bar */}
          <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full"
              style={{ width: '42%', backgroundColor: 'var(--color-primary)' }}
            />
            <div
              className="h-full rounded-full"
              style={{ width: '28%', backgroundColor: 'var(--color-accent-blue)' }}
            />
            <div
              className="h-full rounded-full"
              style={{ width: '18%', backgroundColor: 'var(--color-amber)' }}
            />
            <div
              className="h-full rounded-full"
              style={{ width: '12%', backgroundColor: 'var(--color-text-subtle)' }}
            />
          </div>

          {/* Category rows */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-[var(--radius-md)] border border-landing-border bg-landing-alt p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
                <span className="text-xs text-landing-text-muted">Housing</span>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-landing-text">
                ৳12,000.00
              </span>
            </div>

            <div className="rounded-[var(--radius-md)] border border-landing-border bg-landing-alt p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--color-accent-blue)' }}
                  aria-hidden="true"
                />
                <span className="text-xs text-landing-text-muted">Food &amp; dining</span>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-landing-text">
                ৳8,000.00
              </span>
            </div>

            <div className="rounded-[var(--radius-md)] border border-landing-border bg-landing-alt p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--color-amber)' }}
                  aria-hidden="true"
                />
                <span className="text-xs text-landing-text-muted">Savings</span>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-landing-text">
                ৳5,100.00
              </span>
            </div>

            <div className="rounded-[var(--radius-md)] border border-landing-border bg-landing-alt p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--color-text-subtle)' }}
                  aria-hidden="true"
                />
                <span className="text-xs text-landing-text-muted">Utilities</span>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-landing-text">
                ৳3,450.00
              </span>
            </div>
          </div>
        </div>

        {/* Settled loan */}
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-landing-border bg-landing-surface-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-landing-text">
                Tanvir Ahmed · Trip share
              </span>
              <span className="block text-xs text-landing-text-muted">
                Settled in full via bKash · No balance remaining
              </span>
            </div>
          </div>
          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-landing-text">
            ৳2,500.00
          </span>
        </div>
      </div>
    </div>
  );
}
