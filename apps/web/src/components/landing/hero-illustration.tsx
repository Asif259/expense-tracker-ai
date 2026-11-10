'use client';

import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  TrendingUp,
  Wallet,
  Lock,
} from 'lucide-react';

/**
 * A product preview, not an illustration: the same ledger surface a signed-in
 * user sees. Amounts are always neutral text (never colored); direction is
 * carried by the small arrow icon and its tint.
 */
export function HeroIllustration() {
  return (
    <div
      className="relative mx-auto w-full max-w-[520px] select-none"
      role="img"
      aria-label="Preview of the Ledgerly ledger for November 2026: net cash flow ৳6,450, 63% of the monthly budget used, and three recent transactions — a grocery expense, consulting income, and a broadband bill."
    >
      <div className="relative rounded-[var(--radius-xl)] border border-landing-border bg-landing-surface-card p-4 shadow-md sm:p-6">
        {/* Header: account overview */}
        <div className="flex items-center justify-between gap-3 border-b border-landing-border pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-medium text-landing-text-muted">
                Net cash flow · November 2026
              </span>
              <span className="block text-xl font-semibold tabular-nums text-landing-text sm:text-2xl">
                ৳6,450.00
              </span>
            </div>
          </div>

          <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-landing-text-muted sm:flex">
            <TrendingUp className="h-4 w-4 text-[var(--color-primary-text)]" aria-hidden="true" />
            <span className="tabular-nums">+৳4,120 vs Sept</span>
          </span>
        </div>

        {/* Monthly budget usage */}
        <div className="mt-4 space-y-2 rounded-[var(--radius-md)] border border-landing-border bg-landing-alt p-3.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-landing-text">Monthly budget</span>
            <span className="tabular-nums text-landing-text-muted">৳28,550 of ৳45,000</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-landing-border">
            <div className="h-full rounded-full bg-landing-teal" style={{ width: '63%' }} />
          </div>
          <div className="flex items-center justify-between text-xs text-landing-text-muted">
            <span className="tabular-nums">63% used</span>
            <span>19 days left</span>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-1 pb-2 text-xs text-landing-text-muted">
            <span>Recent activity</span>
            <span>Status</span>
          </div>

          <ul className="space-y-2">
            <li className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-landing-border bg-landing-surface px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-expense-subtle)] text-[var(--color-expense)]">
                  <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-landing-text">
                    Agora Superstore
                  </span>
                  <span className="block text-[11px] text-landing-text-muted">
                    Food &amp; dining · Nov 8
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-[13px] font-semibold tabular-nums text-landing-text">
                  −৳1,200.00
                </span>
                <span className="block text-[11px] text-landing-text-muted">Cleared</span>
              </div>
            </li>

            <li className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-landing-border bg-landing-surface px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-landing-text">
                    Design consulting
                  </span>
                  <span className="block text-[11px] text-landing-text-muted">
                    Client work · Nov 5
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-[13px] font-semibold tabular-nums text-landing-text">
                  +৳35,000.00
                </span>
                <span className="block text-[11px] text-landing-text-muted">Received</span>
              </div>
            </li>

            <li className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-landing-border bg-landing-surface px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-expense-subtle)] text-[var(--color-expense)]">
                  <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-landing-text">
                    Broadband internet
                  </span>
                  <span className="block text-[11px] text-landing-text-muted">
                    Utilities · Nov 2
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-[13px] font-semibold tabular-nums text-landing-text">
                  −৳1,350.00
                </span>
                <span className="block text-[11px] text-landing-text-muted">Cleared</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Floating settlement note */}
      <div className="absolute -bottom-3 left-3 z-10 hidden max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-[var(--radius-md)] border border-landing-border bg-landing-surface-card px-3 py-2 text-xs font-medium text-landing-text shadow-md sm:-left-4 sm:flex">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-primary-text)]" aria-hidden="true" />
        <span className="truncate">Loan to Tanvir · ৳2,500 settled</span>
      </div>

      {/* Floating privacy note */}
      <div className="absolute -top-3 right-3 z-10 hidden max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-[var(--radius-md)] border border-landing-border bg-landing-surface-card px-3 py-2 text-xs font-medium text-landing-text shadow-md sm:-right-4 sm:flex">
        <Lock className="h-4 w-4 shrink-0 text-[var(--color-primary-text)]" aria-hidden="true" />
        <span className="truncate">Private to your account</span>
      </div>
    </div>
  );
}
