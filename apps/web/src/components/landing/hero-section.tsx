import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { ProductPreview } from './product-preview';

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'No bank credentials required' },
  { icon: Lock, label: 'Secure personal financial records' },
  { icon: CheckCircle2, label: 'Clear and accurate financial tracking' },
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 xl:grid-cols-2 xl:gap-16 xl:px-8">
        <div className="min-w-0">
          <p className="text-eyebrow text-[var(--color-primary-text)]">
            Personal finance, made clear.
          </p>

          <h1 className="mt-4 font-display text-[2.75rem] leading-[1.04] font-normal tracking-[-0.02em] text-[var(--color-text)] sm:text-[3.5rem] xl:text-[4.1rem]">
            <span className="block">Make sense of</span>
            <span className="block">your money.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-muted)] sm:text-base">
            Ledgerly helps you track daily expenses, understand spending patterns, manage
            monthly budgets, and organize money you owe or are owed, all in one place.
          </p>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <ButtonLink
              href="/login?mode=signup"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Get started free
            </ButtonLink>
            <ButtonLink
              href="#features"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Explore features
            </ButtonLink>
          </div>

          <ul className="mt-8 flex flex-col gap-2.5 text-[13px] text-[var(--color-text-muted)]">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon
                  className="h-4 w-4 shrink-0 text-[var(--color-primary-text)]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full min-w-0">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
