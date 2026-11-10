import {
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { SampleDataNote } from './primitives';

const RECENT_ACTIVITY = [
  {
    name: 'Agora Superstore',
    meta: 'Groceries · Nov 8',
    amount: '− ৳1,200.00',
    income: false,
  },
  {
    name: 'Design consulting',
    meta: 'Income · Nov 5',
    amount: '+ ৳35,000.00',
    income: true,
  },
  {
    name: 'Broadband internet',
    meta: 'Utilities · Nov 2',
    amount: '− ৳1,350.00',
    income: false,
  },
] as const;

const CATEGORIES = [
  { name: 'Rent', amount: '৳12,000', percent: 42, color: 'var(--color-primary)' },
  { name: 'Food & dining', amount: '৳8,000', percent: 28, color: 'var(--color-accent-blue)' },
  { name: 'Savings', amount: '৳5,100', percent: 18, color: 'var(--color-amber)' },
  { name: 'Utilities', amount: '৳3,450', percent: 12, color: 'var(--color-text-subtle)' },
] as const;

/**
 * A static, clearly-labelled preview of the real dashboard. Built from the
 * product's own tokens rather than an illustration, and it makes no API calls.
 */
export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div
        role="img"
        aria-label="Illustrative Ledgerly dashboard preview with sample data: net cash flow ৳6,450.00 for November 2026, 63% of a ৳45,000 monthly budget used, three recent transactions, spending categories, and an AI insight."
        className="relative rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)] sm:p-5"
      >
        {/* Net cash flow */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption">Net cash flow · November 2026</p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em] tabular-nums text-[var(--color-text)] sm:text-[28px]">
              ৳6,450.00
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-income-subtle)] px-2 py-1 text-[11px] font-semibold text-[var(--color-income)]">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            In surplus
          </span>
        </div>

        {/* Monthly budget */}
        <div className="mt-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-medium text-[var(--color-text)]">
              Monthly budget
            </span>
            <span className="text-[12px] tabular-nums text-[var(--color-text-muted)]">
              ৳28,550 of ৳45,000
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)]"
              style={{ width: '63%' }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--color-text-subtle)]">
            <span>63% used</span>
            <span>19 days left</span>
          </div>
        </div>

        {/* Activity + categories */}
        <div className="mt-4 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] font-semibold text-[var(--color-text)]">
                Recent activity
              </p>
              <span className="text-[11px] text-[var(--color-text-subtle)]">Nov 2026</span>
            </div>
            <ul className="mt-1.5 divide-y divide-[var(--color-border)]">
              {RECENT_ACTIVITY.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-2 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${
                        item.income
                          ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                          : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                      }`}
                    >
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

          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] p-3">
            <p className="text-[13px] font-semibold text-[var(--color-text)]">
              Spending categories
            </p>
            <div className="mt-2 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
              {CATEGORIES.map((category) => (
                <span
                  key={category.name}
                  className="h-full rounded-full"
                  style={{ width: `${category.percent}%`, backgroundColor: category.color }}
                />
              ))}
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {CATEGORIES.map((category) => (
                <li
                  key={category.name}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
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
        </div>

        {/* AI summary */}
        <div className="mt-3.5 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5">
          <Sparkles
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary-text)]"
            aria-hidden="true"
          />
          <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-text)]">AI insight · </span>
            Rent and food make up 70% of your spending this month.
          </p>
        </div>

        <div className="mt-2.5 flex justify-end">
          <SampleDataNote />
        </div>
      </div>

      {/* Floating product elements — desktop only so they never cover content */}
      <div className="pointer-events-none absolute -top-5 right-3 z-10 hidden items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[12px] font-medium text-[var(--color-text)] shadow-[var(--shadow-md)] xl:flex">
        <Lock className="h-3.5 w-3.5 text-[var(--color-primary-text)]" aria-hidden="true" />
        Private to your account
      </div>

      <div className="pointer-events-none absolute -bottom-5 -left-3 z-10 hidden items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 shadow-[var(--shadow-md)] xl:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-income-subtle)] text-[var(--color-income)]">
          <ArrowDownLeft className="h-3 w-3" aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          <span className="text-[11px] font-medium text-[var(--color-text)]">
            Design consulting
          </span>
          <span className="text-[11px] tabular-nums text-[var(--color-text-subtle)]">+ ৳35,000.00</span>
        </span>
      </div>

      <div className="pointer-events-none absolute -right-4 -bottom-7 z-10 hidden max-w-[190px] items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2.5 shadow-[var(--shadow-md)] xl:flex">
        <Sparkles
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary-text)]"
          aria-hidden="true"
        />
        <p className="text-[11px] leading-snug text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text)]">AI · </span>
          Dining is your fastest-growing category.
        </p>
      </div>
    </div>
  );
}
