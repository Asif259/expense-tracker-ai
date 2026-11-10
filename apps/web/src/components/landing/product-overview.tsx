import { BarChart3, Receipt, Target } from 'lucide-react';
import { SectionLabel } from './primitives';

const PILLARS = [
  {
    number: '01',
    icon: Receipt,
    title: 'Track',
    copy:
      'Organize daily income and expenses in one clear, unified financial record.',
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'Understand',
    copy:
      'Explore spending breakdowns, cash flow comparisons, and category analytics to understand your financial habits.',
  },
  {
    number: '03',
    icon: Target,
    title: 'Plan',
    copy:
      'Set comfortable budgets, monitor savings progress, and manage money lent to or borrowed from friends.',
  },
] as const;

export function ProductOverview() {
  return (
    <section
      id="overview"
      className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-primary-subtle)] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>What Ledgerly does</SectionLabel>
          <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
            Everything you need to understand your money.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            Ledgerly turns daily financial records into clear, dependable insights. Organize
            what you spend, understand where your money goes, and plan with confidence.
          </p>
        </div>

        <div className="relative mt-12">
          {/* Subtle connector between the three concepts on wide screens */}
          <div
            aria-hidden="true"
            className="absolute top-[4.25rem] right-[14%] left-[14%] hidden h-px bg-[var(--color-border-strong)] md:block"
          />

          <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
            {PILLARS.map(({ number, icon: Icon, title, copy }) => (
              <div key={number} className="flex flex-col items-start">
                <span className="text-[11px] font-semibold tracking-[0.08em] tabular-nums text-[var(--color-text-subtle)]">
                  {number}
                </span>
                <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-primary-subtle-hover)] bg-[var(--color-surface)] text-[var(--color-primary-text)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">
                  {title}
                </h3>
                <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  {copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
