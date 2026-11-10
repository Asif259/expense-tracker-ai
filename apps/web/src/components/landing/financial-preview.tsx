import { ArrowDownLeft, ArrowUpRight, HandCoins } from 'lucide-react';
import { SampleDataNote } from './primitives';

const CATEGORIES = [
  { name: 'Rent', amount: '৳12,000', percent: 42, color: 'var(--color-primary)' },
  { name: 'Food & dining', amount: '৳8,000', percent: 28, color: 'var(--color-accent-blue)' },
  { name: 'Savings', amount: '৳5,100', percent: 18, color: 'var(--color-amber)' },
  { name: 'Utilities', amount: '৳3,450', percent: 12, color: 'var(--color-text-subtle)' },
] as const;

const BUDGETS = [
  { name: 'Rent', spent: '৳12,000', limit: '৳14,000', percent: 86 },
  { name: 'Food & dining', spent: '৳8,000', limit: '৳9,000', percent: 89 },
] as const;

const ACTIVITY = [
  { name: 'Agora Superstore', meta: 'Groceries · Nov 8', amount: '− ৳1,200.00', income: false },
  { name: 'Electricity bill', meta: 'Utilities · Nov 7', amount: '− ৳2,340.00', income: false },
] as const;

/**
 * Static second product preview for the confidence section: spending
 * distribution, budget progress, recent activity, and loan balances.
 */
export function FinancialPreview() {
  return (
    <div
      role="img"
      aria-label="Illustrative Ledgerly monthly overview with sample data: spending distribution across rent, food, savings and utilities, budget progress, recent activity, and ৳19,500 to collect versus ৳19,500 to repay."
      className="mx-auto w-full max-w-[560px] rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-[var(--color-text)]">Monthly overview</p>
          <p className="text-[12px] text-[var(--color-text-subtle)]">November 2026</p>
        </div>
        <SampleDataNote />
      </div>

      {/* Spending distribution */}
      <div className="mt-4">
        <p className="text-[13px] font-medium text-[var(--color-text)]">
          Spending by category
        </p>
        <div className="mt-2 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
          {CATEGORIES.map((category) => (
            <span
              key={category.name}
              className="h-full rounded-full"
              style={{ width: `${category.percent}%`, backgroundColor: category.color }}
            />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {CATEGORIES.map((category) => (
            <li key={category.name} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-1.5 text-[var(--color-text-muted)]">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                <span className="truncate">{category.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[var(--color-text)]">
                {category.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-4 border-t border-[var(--color-border)] pt-4 sm:grid-cols-2">
        {/* Budget progress */}
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text)]">Budget progress</p>
          <ul className="mt-2.5 space-y-2.5">
            {BUDGETS.map((budget) => (
              <li key={budget.name}>
                <div className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="text-[var(--color-text-muted)]">{budget.name}</span>
                  <span className="tabular-nums text-[var(--color-text-subtle)]">
                    {budget.spent} of {budget.limit}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${budget.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Debt summary */}
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text)]">
            <HandCoins className="h-3.5 w-3.5 text-[var(--color-primary-text)]" aria-hidden="true" />
            Debts &amp; loans
          </p>
          <dl className="mt-2.5 space-y-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] text-[var(--color-text-muted)]">To collect</dt>
              <dd className="text-[13px] font-medium tabular-nums text-[var(--color-text)]">
                ৳19,500.00
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] text-[var(--color-text-muted)]">To repay</dt>
              <dd className="text-[13px] font-medium tabular-nums text-[var(--color-text)]">
                ৳19,500.00
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] text-[var(--color-text-muted)]">Partial repayments</dt>
              <dd className="text-[13px] font-medium tabular-nums text-[var(--color-text)]">
                ৳27,000.00
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
        <p className="text-[13px] font-medium text-[var(--color-text)]">Recent activity</p>
        <ul className="mt-1.5 divide-y divide-[var(--color-border)]">
          {ACTIVITY.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-2 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-expense-subtle)] text-[var(--color-expense)]">
                  {item.income ? (
                    <ArrowDownLeft className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[var(--color-text)]">
                    {item.name}
                  </p>
                  <p className="truncate text-[11px] text-[var(--color-text-subtle)]">
                    {item.meta}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-[12px] font-medium tabular-nums text-[var(--color-text)]">
                {item.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
