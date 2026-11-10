import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  HandCoins,
  MessageSquareText,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';
import { SectionLabel } from './primitives';

const FEATURES = [
  {
    icon: Wallet,
    title: 'Smart expense tracking',
    copy:
      'Record daily transactions with categories, custom dates, notes, and precise financial calculations.',
    action: 'Learn more',
  },
  {
    icon: Target,
    title: 'Budget management',
    copy:
      'Set comfortable monthly limits across categories. Monitor your burn rate and stay ahead of overspending.',
    action: 'Manage budgets',
  },
  {
    icon: BarChart3,
    title: 'Spending analytics',
    copy:
      'Understand your financial habits through visual cash flow charts, category breakdowns, and monthly trends.',
    action: 'View analytics',
  },
  {
    icon: HandCoins,
    title: 'Debt and loans tracker',
    copy:
      'Keep track of money lent to friends, borrowed funds, repayments, and outstanding balances with clear audit records.',
    action: 'Track loans',
  },
  {
    icon: Sparkles,
    title: 'AI financial assistant',
    copy:
      'Ask questions about your financial records and get useful answers based on your transaction history.',
    action: 'Explore AI',
  },
  {
    icon: MessageSquareText,
    title: 'AI expense entry',
    copy:
      'Record expenses using natural language and review AI-generated transaction details before confirming them.',
    action: 'Explore AI entry',
  },
] as const;

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 bg-[var(--color-surface)] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>Explore Ledgerly</SectionLabel>
          <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
            Designed around your financial life.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            Every tool is designed to give you control, confidence, and transparency without
            overwhelming complexity.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, copy, action }) => (
            <li key={title} className="min-w-0">
              <Link
                href="/login?mode=signup"
                className="group flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-[border-color,background-color] duration-[var(--duration-fast)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-[var(--color-text)]">
                  {title}
                </h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  {copy}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-primary-text)]">
                  {action}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
