import { ButtonLink } from '@/components/ui';

export function FinalCtaSection() {
  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-primary-subtle)] px-6 py-14 text-center sm:px-12 sm:py-16">
        <h2 className="mx-auto max-w-2xl font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.5rem]">
          Start seeing your finances more clearly.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-muted)]">
          Take the guesswork out of daily spending. Join Ledgerly today and build a clearer
          picture of your money.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <ButtonLink
            href="/login?mode=signup"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            Get started free
          </ButtonLink>
          <ButtonLink
            href="/login"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
          >
            Sign in to dashboard
          </ButtonLink>
        </div>
        <p className="mt-5 text-[12px] text-[var(--color-text-subtle)]">
          Free personal finance tracking. Transparent records. Clear financial insights.
        </p>
      </div>
    </section>
  );
}
