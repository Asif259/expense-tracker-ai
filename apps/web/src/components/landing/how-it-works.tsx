import { SectionLabel } from './primitives';

const STEPS = [
  {
    number: '01',
    title: 'Record',
    copy: 'Add transactions using quick manual forms or AI-assisted expense entry.',
  },
  {
    number: '02',
    title: 'Analyze',
    copy: 'Inspect categorized entries. Confirm amounts and dates with complete confidence.',
  },
  {
    number: '03',
    title: 'Plan',
    copy:
      "Monitor monthly budget health, explore visual analytics, and keep track of money you've lent or borrowed.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-[var(--color-border)] bg-[var(--color-bg)] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
            Three steps to complete clarity.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            Designed to be effortless and reliable, so tracking your finances never feels like
            a chore.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {STEPS.map(({ number, title, copy }) => (
            <li
              key={number}
              className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[13px] font-semibold tabular-nums text-[var(--color-primary-text)]">
                {number}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold text-[var(--color-text)]">
                {title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {copy}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
