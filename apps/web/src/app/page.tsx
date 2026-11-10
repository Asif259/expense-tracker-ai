'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  HandCoins,
  Lock,
  Menu,
  MessageSquareText,
  Moon,
  Receipt,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ==========================================================================
   Content
   ========================================================================== */

const PAGE_TITLE = 'Ledgerly | Make Sense of Your Money';
const PAGE_DESCRIPTION =
  'Track expenses, manage budgets, understand spending patterns, and organize debts with Ledgerly, your personal finance companion.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const NAV_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#features', label: 'Features' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#how-it-works', label: 'How it works' },
] as const;

const TRUST_POINTS: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: 'No bank credentials required' },
  { icon: Lock, label: 'Secure personal financial records' },
  { icon: CheckCircle2, label: 'Clear and accurate financial tracking' },
];

const PILLARS = [
  {
    number: '01',
    icon: Receipt,
    title: 'Track',
    copy: 'Organize daily income and expenses in one clear, unified financial record.',
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

/* Illustrative sample data for the product previews (clearly labelled). */

const HERO_ACTIVITY = [
  { name: 'Agora Superstore', meta: 'Groceries · Nov 8', amount: '− ৳1,200.00', income: false },
  { name: 'Design consulting', meta: 'Income · Nov 5', amount: '+ ৳35,000.00', income: true },
  { name: 'Broadband internet', meta: 'Utilities · Nov 2', amount: '− ৳1,350.00', income: false },
] as const;

const HERO_CATEGORIES = [
  { name: 'Rent', amount: '৳12,000', percent: 42, color: 'var(--color-primary)' },
  { name: 'Food & dining', amount: '৳8,000', percent: 28, color: 'var(--color-accent-blue)' },
  { name: 'Savings', amount: '৳5,100', percent: 18, color: 'var(--color-amber)' },
  { name: 'Utilities', amount: '৳3,450', percent: 12, color: 'var(--color-text-subtle)' },
] as const;

const PREVIEW_BUDGETS = [
  { name: 'Rent', spent: '৳12,000', limit: '৳14,000', percent: 86 },
  { name: 'Food & dining', spent: '৳8,000', limit: '৳9,000', percent: 89 },
] as const;

const PREVIEW_ACTIVITY = [
  { name: 'Agora Superstore', meta: 'Groceries · Nov 8', amount: '− ৳1,200.00', income: false },
  { name: 'Electricity bill', meta: 'Utilities · Nov 7', amount: '− ৳2,340.00', income: false },
] as const;

type DemoRow = { label: string; detail: string; amount: string };
type Demo = {
  id: string;
  question: string;
  answer: string;
  columnLabel: string;
  rows: DemoRow[];
};

const AI_DEMOS: Demo[] = [
  {
    id: 'top-category',
    question: 'What cost me the most this month?',
    answer: 'Food and dining is your highest spending category this month.',
    columnLabel: 'Category',
    rows: [
      { label: 'Food & dining', detail: '9 transactions · 28% of expenses', amount: '৳12,200.00' },
      { label: 'Rent', detail: '1 transaction · 25% of expenses', amount: '৳11,000.00' },
      { label: 'Groceries', detail: '12 transactions · 18% of expenses', amount: '৳7,800.00' },
    ],
  },
  {
    id: 'this-week',
    question: 'How much did I spend this week?',
    answer: 'You spent ৳8,420 this week across 9 transactions.',
    columnLabel: 'Category',
    rows: [
      { label: 'Food & dining', detail: '4 transactions', amount: '৳3,200.00' },
      { label: 'Groceries', detail: '2 transactions', amount: '৳2,600.00' },
      { label: 'Utilities', detail: '1 transaction', amount: '৳1,500.00' },
      { label: 'Transport', detail: '2 transactions', amount: '৳1,120.00' },
    ],
  },
  {
    id: 'compare',
    question: 'Compare my spending with last month.',
    answer:
      'You spent ৳43,500 this month — 12% more than the ৳38,800 you spent last month.',
    columnLabel: 'Category',
    rows: [
      { label: 'Food & dining', detail: 'Up ৳1,400 vs October', amount: '৳12,200.00' },
      { label: 'Rent', detail: 'Unchanged vs October', amount: '৳11,000.00' },
      { label: 'Utilities', detail: 'Up ৳320 vs October', amount: '৳4,800.00' },
      { label: 'Groceries', detail: 'Down ৳700 vs October', amount: '৳7,800.00' },
      { label: 'Other categories', detail: 'Transport, health, subscriptions', amount: '৳7,700.00' },
    ],
  },
  {
    id: 'increased',
    question: 'Which category increased the most?',
    answer: 'Food and dining increased the most, up ৳1,400 (13%) from last month.',
    columnLabel: 'Category',
    rows: [
      { label: 'Food & dining', detail: 'October: ৳10,800 · +13%', amount: '৳12,200.00' },
      { label: 'Utilities', detail: 'October: ৳4,480 · +7%', amount: '৳4,800.00' },
      { label: 'Transport', detail: 'October: ৳2,900 · −7%', amount: '৳2,700.00' },
    ],
  },
  {
    id: 'owed',
    question: 'How much money do people still owe me?',
    answer: 'Two people still owe you ৳19,500 in total.',
    columnLabel: 'Person',
    rows: [
      { label: 'Tanvir Ahmed', detail: '62% repaid', amount: '৳4,500.00' },
      { label: 'Rafiqul Islam', detail: 'No repayments yet', amount: '৳15,000.00' },
    ],
  },
  {
    id: 'owe',
    question: 'How much do I still need to repay?',
    answer: 'You still need to repay ৳19,500 across two loans.',
    columnLabel: 'Person',
    rows: [
      { label: 'Nusrat Jahan', detail: '40% repaid', amount: '৳15,000.00' },
      { label: 'Fariha Akter', detail: '25% repaid · overdue', amount: '৳4,500.00' },
    ],
  },
];

/* ==========================================================================
   Shared class strings
   ========================================================================== */

const primaryButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-medium text-[var(--color-primary-contrast)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]';

const secondaryButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 text-sm font-medium text-[var(--color-text)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]';

const iconTileClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]';

const footerLinkClass =
  'rounded-[var(--radius-xs)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]';

/* ==========================================================================
   Page
   ========================================================================== */

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [activeDemoId, setActiveDemoId] = useState(AI_DEMOS[0].id);
  const [year, setYear] = useState<number | null>(null);

  // Signed-in visitors go straight to the dashboard.
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Highlight the section currently in view.
  useEffect(() => {
    const sections = NAV_LINKS.map((link) =>
      document.querySelector<HTMLElement>(link.href),
    ).filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0 || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveSection(`#${visible[0].target.id}`);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  // Deferred so the value is only read after hydration, never during prerender.
  useEffect(() => {
    const timer = window.setTimeout(() => setYear(new Date().getFullYear()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const activeDemo = AI_DEMOS.find((demo) => demo.id === activeDemoId) ?? AI_DEMOS[0];
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Social metadata. The document title/description come from the root layout. */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Ledgerly" />
      <meta property="og:title" content={PAGE_TITLE} />
      <meta property="og:description" content={PAGE_DESCRIPTION} />
      <meta property="og:image" content={`${SITE_URL}/Hero-image.webp`} />
      <meta property="og:image:width" content="1536" />
      <meta property="og:image:height" content="1024" />
      <meta property="og:image:alt" content="Ledgerly personal finance dashboard" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={PAGE_TITLE} />
      <meta name="twitter:description" content={PAGE_DESCRIPTION} />
      <meta name="twitter:image" content={`${SITE_URL}/Hero-image.webp`} />
      <link rel="canonical" href={`${SITE_URL}/`} />

      <div className="flex min-h-screen flex-col overflow-x-clip bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-[var(--color-primary-subtle)] selection:text-[var(--color-primary-text)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-[var(--radius-md)] focus:border focus:border-[var(--color-border)] focus:bg-[var(--color-surface)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-text)] focus:shadow-[var(--shadow-md)]"
        >
          Skip to content
        </a>

        {/* ====================================================================
            Navigation
            ==================================================================== */}
        <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-sm supports-[backdrop-filter]:bg-[var(--color-bg)]/85">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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
              <span className="text-[17px] font-semibold tracking-tight text-[var(--color-text)]">
                Ledgerly<span className="text-[var(--color-primary)]">.</span>
              </span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => {
                const active = activeSection === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'true' : undefined}
                    className={`relative rounded-[var(--radius-sm)] px-3 py-2 text-[13px] transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                      active
                        ? 'font-medium text-[var(--color-text)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={`absolute right-3 bottom-1 left-3 h-px rounded-full transition-opacity duration-[var(--duration-fast)] ${
                        active ? 'bg-[var(--color-primary)] opacity-100' : 'opacity-0'
                      }`}
                    />
                  </a>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {mounted ? (
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Sun className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <span className="h-4 w-4 rounded-full bg-[var(--color-surface-sunken)]" />
                </span>
              )}

              <Link
                href="/login"
                className="hidden h-9 items-center rounded-[var(--radius-md)] px-3 text-[13px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:inline-flex"
              >
                Sign in
              </Link>

              <span className="hidden sm:block">
                <Link href="/login?mode=signup" className={`${primaryButtonClass} h-9 px-4`}>
                  Get started
                </Link>
              </span>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            id="mobile-menu"
            className={`grid overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg)] transition-[grid-template-rows,opacity] duration-[var(--duration-base)] ease-[var(--ease-standard)] md:hidden ${
              mobileMenuOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'pointer-events-none grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0" inert={!mobileMenuOpen}>
              <nav aria-label="Mobile" className="px-4 pt-2 pb-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="block rounded-[var(--radius-md)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-2 border-t border-[var(--color-border)] px-4 pt-4 pb-5">
                <Link
                  href="/login?mode=signup"
                  onClick={closeMobileMenu}
                  className={`${primaryButtonClass} w-full`}
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className={`${secondaryButtonClass} w-full`}
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main id="main" className="flex-1">
          {/* ==================================================================
              Hero
              ================================================================== */}
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
                  Ledgerly helps you track daily expenses, understand spending patterns,
                  manage monthly budgets, and organize money you owe or are owed, all in one
                  place.
                </p>

                <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <Link
                    href="/login?mode=signup"
                    className={`${primaryButtonClass} w-full sm:w-auto`}
                  >
                    Get started free
                  </Link>
                  <a href="#features" className={`${secondaryButtonClass} w-full sm:w-auto`}>
                    Explore features
                  </a>
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

              {/* Hero product preview */}
              <div className="w-full min-w-0">
                <div className="relative mx-auto w-full max-w-[560px]">
                  <div
                    role="img"
                    aria-label="Illustrative Ledgerly dashboard preview with sample data: net cash flow ৳6,450.00 for November 2026, 63% of a ৳45,000 monthly budget used, three recent transactions, spending categories, and an AI insight."
                    className="relative rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)] sm:p-5"
                  >
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

                    <div className="mt-4 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
                      <div className="min-w-0">
                        <div className="flex items-baseline justify-between">
                          <p className="text-[13px] font-semibold text-[var(--color-text)]">
                            Recent activity
                          </p>
                          <span className="text-[11px] text-[var(--color-text-subtle)]">
                            Nov 2026
                          </span>
                        </div>
                        <ul className="mt-1.5 divide-y divide-[var(--color-border)]">
                          {HERO_ACTIVITY.map((item) => (
                            <li
                              key={item.name}
                              className="flex items-center justify-between gap-2 py-2"
                            >
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
                          {HERO_CATEGORIES.map((category) => (
                            <span
                              key={category.name}
                              className="h-full rounded-full"
                              style={{
                                width: `${category.percent}%`,
                                backgroundColor: category.color,
                              }}
                            />
                          ))}
                        </div>
                        <ul className="mt-2.5 space-y-1.5">
                          {HERO_CATEGORIES.map((category) => (
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

                    <div className="mt-3.5 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5">
                      <Sparkles
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary-text)]"
                        aria-hidden="true"
                      />
                      <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                        <span className="font-medium text-[var(--color-text)]">
                          AI insight ·{' '}
                        </span>
                        Rent and food make up 70% of your spending this month.
                      </p>
                    </div>

                    <div className="mt-2.5 flex justify-end">
                      <span className="text-[11px] font-medium text-[var(--color-text-subtle)]">
                        Sample data
                      </span>
                    </div>
                  </div>

                  {/* Floating interface elements, wide screens only */}
                  <div className="pointer-events-none absolute -top-5 right-3 z-10 hidden items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[12px] font-medium text-[var(--color-text)] shadow-[var(--shadow-md)] xl:flex">
                    <Lock
                      className="h-3.5 w-3.5 text-[var(--color-primary-text)]"
                      aria-hidden="true"
                    />
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
                      <span className="text-[11px] tabular-nums text-[var(--color-text-subtle)]">
                        + ৳35,000.00
                      </span>
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
              </div>
            </div>
          </section>

          {/* ==================================================================
              Product overview
              ================================================================== */}
          <section
            id="overview"
            className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-primary-subtle)] py-20 sm:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-eyebrow text-[var(--color-primary-text)]">
                  What Ledgerly does
                </p>
                <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
                  Everything you need to understand your money.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                  Ledgerly turns daily financial records into clear, dependable insights.
                  Organize what you spend, understand where your money goes, and plan with
                  confidence.
                </p>
              </div>

              <div className="relative mt-12">
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
                        <Icon
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
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

          {/* ==================================================================
              Features
              ================================================================== */}
          <section id="features" className="scroll-mt-20 bg-[var(--color-surface)] py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-eyebrow text-[var(--color-primary-text)]">
                  Explore Ledgerly
                </p>
                <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
                  Designed around your financial life.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                  Every tool is designed to give you control, confidence, and transparency
                  without overwhelming complexity.
                </p>
              </div>

              <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map(({ icon: Icon, title, copy, action }) => (
                  <li key={title} className="min-w-0">
                    <Link
                      href="/login?mode=signup"
                      className="group flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-[border-color,background-color] duration-[var(--duration-fast)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                    >
                      <span className={iconTileClass}>
                        <Icon
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
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

          {/* ==================================================================
              Financial confidence
              ================================================================== */}
          <section
            id="benefits"
            className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-surface-sunken)] py-20 sm:py-28"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 xl:grid-cols-2 xl:gap-16 xl:px-8">
              <div className="order-2 min-w-0 xl:order-1">
                <div
                  role="img"
                  aria-label="Illustrative Ledgerly monthly overview with sample data: spending distribution across rent, food, savings and utilities, budget progress, recent activity, and ৳19,500 to collect versus ৳19,500 to repay."
                  className="mx-auto w-full max-w-[560px] rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-semibold text-[var(--color-text)]">
                        Monthly overview
                      </p>
                      <p className="text-[12px] text-[var(--color-text-subtle)]">
                        November 2026
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--color-text-subtle)]">
                      Sample data
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[13px] font-medium text-[var(--color-text)]">
                      Spending by category
                    </p>
                    <div className="mt-2 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                      {HERO_CATEGORIES.map((category) => (
                        <span
                          key={category.name}
                          className="h-full rounded-full"
                          style={{
                            width: `${category.percent}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      ))}
                    </div>
                    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                      {HERO_CATEGORIES.map((category) => (
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

                  <div className="mt-4 grid gap-4 border-t border-[var(--color-border)] pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-text)]">
                        Budget progress
                      </p>
                      <ul className="mt-2.5 space-y-2.5">
                        {PREVIEW_BUDGETS.map((budget) => (
                          <li key={budget.name}>
                            <div className="flex items-baseline justify-between gap-2 text-[11px]">
                              <span className="text-[var(--color-text-muted)]">
                                {budget.name}
                              </span>
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

                    <div>
                      <p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text)]">
                        <HandCoins
                          className="h-3.5 w-3.5 text-[var(--color-primary-text)]"
                          aria-hidden="true"
                        />
                        Debts &amp; loans
                      </p>
                      <dl className="mt-2.5 space-y-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <dt className="text-[11px] text-[var(--color-text-muted)]">
                            To collect
                          </dt>
                          <dd className="text-[13px] font-medium tabular-nums text-[var(--color-text)]">
                            ৳19,500.00
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                          <dt className="text-[11px] text-[var(--color-text-muted)]">
                            To repay
                          </dt>
                          <dd className="text-[13px] font-medium tabular-nums text-[var(--color-text)]">
                            ৳19,500.00
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                          <dt className="text-[11px] text-[var(--color-text-muted)]">
                            Partial repayments
                          </dt>
                          <dd className="text-[13px] font-medium tabular-nums text-[var(--color-text)]">
                            ৳27,000.00
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                    <p className="text-[13px] font-medium text-[var(--color-text)]">
                      Recent activity
                    </p>
                    <ul className="mt-1.5 divide-y divide-[var(--color-border)]">
                      {PREVIEW_ACTIVITY.map((item) => (
                        <li
                          key={item.name}
                          className="flex items-center justify-between gap-2 py-2"
                        >
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
              </div>

              <div className="order-1 min-w-0 xl:order-2">
                <p className="text-eyebrow text-[var(--color-primary-text)]">Why Ledgerly</p>
                <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
                  Feel more confident about your money.
                </h2>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                  Ledgerly gives you the structure, insights, and transparency you need to
                  make informed financial decisions.
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
                        <h3 className="text-[14px] font-semibold text-[var(--color-text)]">
                          {title}
                        </h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                          {copy}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href="/login?mode=signup" className={primaryButtonClass}>
                    Create your free account
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================================
              AI assistant showcase
              ================================================================== */}
          <section
            id="ai-assistant"
            className="scroll-mt-20 bg-[var(--color-surface)] py-20 sm:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-eyebrow text-[var(--color-primary-text)]">
                  AI financial assistant
                </p>
                <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
                  Your financial questions, answered.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                  Go beyond recording transactions. Understand your spending by asking
                  questions about your financial activity.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:gap-12">
                <div>
                  <p className="text-label text-[var(--color-text-muted)]">Try a question</p>
                  <div
                    className="mt-3 flex flex-wrap gap-2 xl:flex-col xl:items-stretch"
                    role="group"
                    aria-label="Example financial questions"
                  >
                    {AI_DEMOS.map((demo) => {
                      const active = demo.id === activeDemo.id;
                      return (
                        <button
                          key={demo.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setActiveDemoId(demo.id)}
                          className={`cursor-pointer rounded-[var(--radius-md)] border px-3 py-2 text-left text-[13px] transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                            active
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] font-medium text-[var(--color-primary-text)]'
                              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {demo.question}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
                    This is a product demonstration. In the app, answers are generated from
                    your own transaction records — nothing is sent from this page.
                  </p>
                </div>

                <div className="mx-auto w-full max-w-2xl rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5 xl:max-w-none">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-[13px] font-semibold text-[var(--color-text)]">
                        Ledgerly AI
                      </span>
                    </span>
                    <span className="text-[11px] font-medium text-[var(--color-text-subtle)]">
                      Sample data
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <p className="ml-auto w-fit max-w-[90%] rounded-[var(--radius-md)] rounded-br-[var(--radius-xs)] bg-[var(--color-surface-sunken)] px-3 py-2 text-[13px] text-[var(--color-text)]">
                      {activeDemo.question}
                    </p>

                    <div aria-live="polite" className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Sparkles
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-text)]"
                          aria-hidden="true"
                        />
                        <p className="max-w-[92%] text-[13.5px] leading-relaxed text-[var(--color-text)]">
                          {activeDemo.answer}
                        </p>
                      </div>

                      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3">
                        <div className="flex items-baseline justify-between text-[11px] text-[var(--color-text-subtle)]">
                          <span>{activeDemo.columnLabel}</span>
                          <span>Amount</span>
                        </div>
                        <ul className="mt-1.5 divide-y divide-[var(--color-border)]">
                          {activeDemo.rows.map((row) => (
                            <li
                              key={row.label}
                              className="flex items-start justify-between gap-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-medium text-[var(--color-text)]">
                                  {row.label}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[var(--color-text-subtle)]">
                                  {row.detail}
                                </p>
                              </div>
                              <span className="shrink-0 text-[12px] font-medium tabular-nums text-[var(--color-text)]">
                                {row.amount}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-[11px] text-[var(--color-text-subtle)]">
                        Illustrative sample data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================================
              How it works
              ================================================================== */}
          <section
            id="how-it-works"
            className="scroll-mt-20 border-t border-[var(--color-border)] bg-[var(--color-bg)] py-20 sm:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-eyebrow text-[var(--color-primary-text)]">How it works</p>
                <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
                  Three steps to complete clarity.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                  Designed to be effortless and reliable, so tracking your finances never
                  feels like a chore.
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

          {/* ==================================================================
              Final call to action
              ================================================================== */}
          <section className="px-4 pt-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
            <div className="mx-auto max-w-5xl rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-primary-subtle)] px-6 py-14 text-center sm:px-12 sm:py-16">
              <h2 className="mx-auto max-w-2xl font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.5rem]">
                Start seeing your finances more clearly.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                Take the guesswork out of daily spending. Join Ledgerly today and build a
                clearer picture of your money.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                <Link
                  href="/login?mode=signup"
                  className={`${primaryButtonClass} w-full sm:w-auto`}
                >
                  Get started free
                </Link>
                <Link href="/login" className={`${secondaryButtonClass} w-full sm:w-auto`}>
                  Sign in to dashboard
                </Link>
              </div>
              <p className="mt-5 text-[12px] text-[var(--color-text-subtle)]">
                Free personal finance tracking. Transparent records. Clear financial insights.
              </p>
            </div>
          </section>
        </main>

        {/* ====================================================================
            Footer
            ==================================================================== */}
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2.5 rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  <span className="relative h-6 w-6 shrink-0">
                    <Image
                      src="/logo.webp"
                      alt=""
                      fill
                      sizes="24px"
                      className="object-contain"
                    />
                  </span>
                  <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
                    Ledgerly<span className="text-[var(--color-primary)]">.</span>
                  </span>
                </Link>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  A personal finance companion for daily spending, monthly budgets, and the
                  money you share with other people.
                </p>
              </div>

              <nav aria-label="Product">
                <h2 className="text-label">Product</h2>
                <ul className="mt-3 space-y-2 text-[13px] text-[var(--color-text-muted)]">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className={footerLinkClass}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label="Account">
                <h2 className="text-label">Account</h2>
                <ul className="mt-3 space-y-2 text-[13px] text-[var(--color-text-muted)]">
                  <li>
                    <Link href="/login" className={footerLinkClass}>
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link href="/login?mode=signup" className={footerLinkClass}>
                      Create account
                    </Link>
                  </li>
                </ul>
              </nav>

              <div>
                <h2 className="text-label">Security</h2>
                <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  <li>Sign-in is handled by a dedicated authentication provider.</li>
                  <li>Records are separated per account at the database level.</li>
                  <li>No bank connection or bank credentials required.</li>
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[var(--color-border)] pt-6 text-[12px] text-[var(--color-text-subtle)] sm:flex-row sm:items-center">
              <p>
                © <span className="inline-block min-w-[3.5ch] tabular-nums">{year ?? ''}</span>{' '}
                Ledgerly. All rights reserved.
              </p>
              <p>Your records are private to your account.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
