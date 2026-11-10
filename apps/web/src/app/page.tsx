'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { ButtonLink } from '@/components/ui';
import { HeroIllustration } from '@/components/landing/hero-illustration';
import { BenefitsIllustration } from '@/components/landing/benefits-illustration';
import {
  Wallet,
  Target,
  BarChart3,
  HandCoins,
  Check,
  Receipt,
  ShieldCheck,
  Lock,
  Menu,
  X,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#features', label: 'Features' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#how-it-works', label: 'How it works' },
];

const PILLARS = [
  {
    icon: Receipt,
    title: 'Track',
    copy: 'Record income and expenses with the category, date and account that fit how you actually spend.',
  },
  {
    icon: BarChart3,
    title: 'Understand',
    copy: 'See monthly cash flow and category totals, so the month reads at a glance.',
  },
  {
    icon: Target,
    title: 'Plan',
    copy: "Set category budgets for next month and keep track of money you've lent or borrowed.",
  },
];

const FEATURES = [
  {
    icon: Wallet,
    title: 'Expense tracking',
    copy: 'Log income and expenses with the category, date and account you choose. No bank connection needed.',
    action: 'Track expenses',
  },
  {
    icon: Target,
    title: 'Monthly budgets',
    copy: "Set a limit for each category and see what's left to spend before the month ends.",
    action: 'Set budgets',
  },
  {
    icon: BarChart3,
    title: 'Spending charts',
    copy: 'Monthly cash flow and category breakdowns that show where the money actually went.',
    action: 'Review spending',
  },
  {
    icon: HandCoins,
    title: 'Loans and IOUs',
    copy: 'Keep a simple record of money lent or borrowed, with every repayment noted.',
    action: 'Track loans',
  },
];

const BENEFITS = [
  {
    title: 'One place for every transaction',
    copy: 'Income, expenses and transfers, each with the category and date you chose.',
  },
  {
    title: "Budgets that show what's left",
    copy: 'Set a monthly limit per category; the remaining amount updates as you record.',
  },
  {
    title: 'Charts with a plain answer',
    copy: 'Monthly cash flow and category totals, without a spreadsheet.',
  },
  {
    title: 'Loans between friends, settled',
    copy: 'Log repayments as they happen and mark an IOU settled when the balance is clear.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Record',
    copy: 'Add a transaction in seconds, or describe it in plain language and confirm the draft before it is saved.',
  },
  {
    number: '02',
    title: 'Review',
    copy: 'Open the month and check cash flow, category totals, and anything that looks off.',
  },
  {
    number: '03',
    title: 'Plan',
    copy: "Set next month's category budgets and settle the loans you're carrying.",
  },
];

const iconTileClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-clip bg-landing-bg text-landing-text transition-colors duration-200 selection:bg-landing-mint selection:text-landing-teal-dark">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius-md)] focus:border focus:border-landing-border focus:bg-landing-surface-card focus:px-3 focus:py-2 focus:text-sm focus:text-landing-text"
      >
        Skip to content
      </a>

      {/* =========================================================================
          1. HEADER & NAVIGATION
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-landing-border bg-landing-bg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <span className="relative h-7 w-7 shrink-0 sm:h-8 sm:w-8">
              <Image
                src="/logo.webp"
                alt=""
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </span>
            <span className="text-lg font-semibold tracking-tight text-landing-text sm:text-xl">
              Ledgerly<span className="text-landing-teal">.</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-sm font-medium text-landing-text-muted md:flex"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-sm)] py-1 transition-colors hover:text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Header Controls & Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle variant="compact" />

            <Link
              href="/login"
              className="hidden h-9 items-center rounded-[var(--radius-md)] px-3 text-sm font-medium text-landing-text transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:inline-flex"
            >
              Sign in
            </Link>

            <ButtonLink
              href="/login?mode=signup"
              variant="primary"
              size="md"
              className="hidden sm:inline-flex"
            >
              Get started
            </ButtonLink>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-landing-text-muted transition-colors hover:text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer — animates open and closed, closed controls are inert */}
        <div
          id="mobile-menu"
          className={`grid overflow-hidden bg-landing-bg transition-[grid-template-rows,opacity] duration-[var(--duration-base)] ease-[var(--ease-standard)] md:hidden ${
            mobileMenuOpen
              ? 'grid-rows-[1fr] border-b border-landing-border opacity-100'
              : 'pointer-events-none grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0" inert={!mobileMenuOpen}>
            <nav aria-label="Mobile" className="px-4 pb-1 pt-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="block rounded-[var(--radius-md)] px-3 py-2.5 text-[15px] font-medium text-landing-text transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-2 border-t border-landing-border px-4 pb-5 pt-4">
              <ButtonLink
                href="/login?mode=signup"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={closeMobileMenu}
              >
                Get started
              </ButtonLink>
              <ButtonLink
                href="/login"
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={closeMobileMenu}
              >
                Sign in
              </ButtonLink>
            </div>
          </div>
        </div>
      </header>

      <main id="main">
        {/* =========================================================================
            2. HERO
            ========================================================================= */}
      <section className="pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
            {/* Hero Copy */}
            <div className="space-y-7 lg:col-span-6">
              <h1 className="max-w-xl font-display text-4xl font-normal leading-[1.06] tracking-tight text-landing-text sm:text-5xl lg:text-6xl">
                Make sense of your money.
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-landing-text-muted sm:text-lg">
                Record what you spend in seconds, see where it went each month, and keep
                budgets and shared IOUs in one place. No bank logins, no spreadsheets.
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <ButtonLink
                  href="/login?mode=signup"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Get started
                </ButtonLink>
                <ButtonLink
                  href="#how-it-works"
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  See how it works
                </ButtonLink>
              </div>

              <ul className="flex flex-col gap-2.5 pt-2 text-sm text-landing-text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-landing-teal" aria-hidden="true" />
                  <span>No bank connection required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-4 w-4 shrink-0 text-landing-teal" aria-hidden="true" />
                  <span>Your records are only visible to you</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-landing-teal" aria-hidden="true" />
                  <span>Amounts stored to the paisa</span>
                </li>
              </ul>
            </div>

            {/* Hero Product Preview */}
            <div className="w-full min-w-0 lg:col-span-6">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. OVERVIEW
          ========================================================================= */}
      <section
        id="overview"
        className="scroll-mt-20 border-y border-landing-border bg-landing-alt py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl font-normal tracking-tight text-landing-text sm:text-4xl">
              Where the money went, and what&apos;s left.
            </h2>
            <p className="text-base leading-relaxed text-landing-text-muted">
              Ledgerly keeps three things in view: what you recorded, what it adds up to, and
              what you&apos;ve planned next.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
            {PILLARS.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex flex-col items-start gap-3">
                <span className={iconTileClass}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold text-landing-text">{title}</h3>
                <p className="text-sm leading-relaxed text-landing-text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FEATURES
          ========================================================================= */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl font-normal tracking-tight text-landing-text sm:text-4xl">
              Four tools, one ledger.
            </h2>
            <p className="text-base leading-relaxed text-landing-text-muted">
              Small, focused tools for the parts of money you deal with every week — not
              another dashboard to maintain.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, copy, action }) => (
              <div
                key={title}
                className="flex flex-col rounded-[var(--radius-xl)] border border-landing-border bg-landing-surface-card p-6"
              >
                <span className={iconTileClass}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-landing-text">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-landing-text-muted">
                  {copy}
                </p>
                <Link
                  href="/login?mode=signup"
                  className="mt-6 inline-flex w-fit items-center rounded-[var(--radius-sm)] text-sm font-medium text-landing-teal underline-offset-4 transition-colors hover:text-landing-teal-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {action}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BENEFITS
          ========================================================================= */}
      <section
        id="benefits"
        className="scroll-mt-20 border-y border-landing-border bg-landing-alt py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Product Preview */}
            <div className="order-2 min-w-0 lg:order-1 lg:col-span-6">
              <BenefitsIllustration />
            </div>

            {/* Benefits Content */}
            <div className="order-1 space-y-6 lg:order-2 lg:col-span-6 sm:space-y-8">
              <div className="space-y-3">
                <h2 className="font-display text-3xl font-normal leading-tight tracking-tight text-landing-text sm:text-4xl lg:text-5xl">
                  What you spent, what&apos;s left, who owes what.
                </h2>
                <p className="max-w-lg text-base leading-relaxed text-landing-text-muted">
                  The month stays readable: transactions in one place, budgets that update as
                  you record, and loans that close out cleanly.
                </p>
              </div>

              <ul className="grid grid-cols-1 gap-6 pt-1 sm:grid-cols-2 sm:gap-x-6">
                {BENEFITS.map(({ title, copy }) => (
                  <li key={title} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-landing-teal"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-landing-text">{title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-landing-text-muted">
                        {copy}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="pt-1">
                <ButtonLink href="/login?mode=signup" variant="primary" size="lg">
                  Create account
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. HOW IT WORKS
          ========================================================================= */}
      <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl font-normal tracking-tight text-landing-text sm:text-4xl">
              Record, review, plan.
            </h2>
            <p className="text-base leading-relaxed text-landing-text-muted">
              A short loop you can run once a month. Ledgerly keeps the arithmetic and the
              history in order.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
            {STEPS.map(({ number, title, copy }) => (
              <li key={number} className="border-t border-landing-border pt-5">
                <span className="text-xs font-medium tabular-nums text-[var(--color-text-subtle)]">
                  {number}
                </span>
                <h3 className="mt-2 text-base font-semibold text-landing-text">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-landing-text-muted">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =========================================================================
          7. FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="px-4 pb-20 pt-4 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[var(--radius-xl)] border border-landing-border bg-landing-mint px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="font-display text-3xl font-normal tracking-tight text-landing-text sm:text-4xl">
            Start with today&apos;s expenses.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-landing-text-muted">
            Record one transaction and see the month take shape. You can edit or delete
            anything, and the ledger stays yours alone.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink
              href="/login?mode=signup"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Get started
            </ButtonLink>
            <ButtonLink
              href="/login"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Sign in
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs text-landing-text-muted">
            Free to start. No bank connection required.
          </p>
        </div>
      </section>

      </main>

      {/* =========================================================================
          8. FOOTER
          ========================================================================= */}
      <footer className="mt-auto border-t border-landing-border bg-landing-bg px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="relative h-6 w-6">
                <Image src="/logo.webp" alt="" fill sizes="24px" className="object-contain" />
              </span>
              <span className="text-base font-semibold tracking-tight text-landing-text">
                Ledgerly<span className="text-landing-teal">.</span>
              </span>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-landing-text-muted">
              A calm personal ledger for daily spending, monthly budgets, and money shared
              with friends.
            </p>
          </div>

          {/* Product Navigation */}
          <nav aria-label="Product">
            <h2 className="text-xs font-semibold text-landing-text">Product</h2>
            <ul className="mt-3 space-y-2 text-[13px] text-landing-text-muted">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded-[var(--radius-xs)] transition-colors hover:text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account Navigation */}
          <nav aria-label="Account">
            <h2 className="text-xs font-semibold text-landing-text">Account</h2>
            <ul className="mt-3 space-y-2 text-[13px] text-landing-text-muted">
              <li>
                <Link
                  href="/login"
                  className="rounded-[var(--radius-xs)] transition-colors hover:text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/login?mode=signup"
                  className="rounded-[var(--radius-xs)] transition-colors hover:text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  Create account
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mx-auto mt-10 flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-landing-border pt-6 text-xs text-landing-text-muted sm:flex-row sm:items-center">
          <span>&copy; 2026 Ledgerly. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 shrink-0 text-landing-teal" aria-hidden="true" />
            <span>Your records are private to your account.</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
