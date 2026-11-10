import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { FinancialPreview } from './financial-preview';
import { SectionLabel } from './primitives';

const BENEFITS = [
  {
    title: 'Clear spending patterns',
    copy: 'Understand where your money goes every month.',
  },
  {
    title: 'Organized transactions',
    copy: 'Filter, sort, and organize your financial records.',
  },
  {
    title: 'Track debts and commitments',
    copy: 'Monitor money lent to or borrowed from friends, including partial repayments.',
  },
  {
    title: 'Privacy and data protection',
    copy: 'Sign-in is handled securely, and database rules keep each account’s records separate.',
  },
] as const;

export function FinancialConfidenceSection() {
  return (
    <section
      id="benefits"
      className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-surface-sunken)] py-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 xl:grid-cols-2 xl:gap-16 xl:px-8">
        <div className="order-2 min-w-0 xl:order-1">
          <FinancialPreview />
        </div>

        <div className="order-1 min-w-0 xl:order-2">
          <SectionLabel>Why Ledgerly</SectionLabel>
          <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
            Feel more confident about your money.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            Ledgerly gives you the structure, insights, and transparency you need to make
            informed financial decisions.
          </p>

          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            {BENEFITS.map(({ title, copy }) => (
              <li key={title} className="flex items-start gap-2.5">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-text)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-[14px] font-semibold text-[var(--color-text)]">{title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                    {copy}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <ButtonLink
              href="/login?mode=signup"
              variant="primary"
              size="lg"
              trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Create your free account
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
