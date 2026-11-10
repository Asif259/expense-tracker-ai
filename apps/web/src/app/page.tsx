'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
  Plus,
  Receipt,
  Send,
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
   Content & Data
   ========================================================================== */

const PAGE_TITLE = 'Ledgerly | Make Sense of Your Money';
const PAGE_DESCRIPTION =
  'Track expenses, manage budgets, understand spending patterns, and organize debts with Ledgerly, your personal finance companion.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const NAV_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#features', label: 'Features' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#ai-assistant', label: 'AI Assistant' },
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
    title: 'Real-Time Expense Tracking',
    copy: 'Organize daily income and expenses in one clear, unified financial record with instant updates.',
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'Visual Spending Analytics',
    copy: 'Explore spending breakdowns, cash flow comparisons, and category analytics to understand your habits.',
  },
  {
    number: '03',
    icon: Target,
    title: 'Smart Budget Alerts',
    copy: 'Set comfortable monthly budgets, monitor burn rates, and stay ahead of overspending effortlessly.',
  },
  {
    number: '04',
    icon: HandCoins,
    title: 'Debt & Loan Tracking',
    copy: 'Monitor money lent to or borrowed from friends, including partial repayments and clear audit trails.',
  },
] as const;

const FEATURES = [
  {
    icon: Wallet,
    title: 'Smart expense tracking',
    copy: 'Record daily transactions with categories, custom dates, notes, and precise financial calculations.',
    action: 'Learn more',
  },
  {
    icon: Target,
    title: 'Budget management',
    copy: 'Set comfortable monthly limits across categories. Monitor your burn rate and stay ahead of overspending.',
    action: 'Manage budgets',
  },
  {
    icon: BarChart3,
    title: 'Spending analytics',
    copy: 'Understand your financial habits through visual cash flow charts, category breakdowns, and monthly trends.',
    action: 'View analytics',
  },
  {
    icon: HandCoins,
    title: 'Debt and loans tracker',
    copy: 'Keep track of money lent to friends, borrowed funds, repayments, and outstanding balances with clear audit records.',
    action: 'Track loans',
  },
  {
    icon: Sparkles,
    title: 'AI financial assistant',
    copy: 'Ask questions about your financial records and get useful answers based on your transaction history.',
    action: 'Explore AI',
  },
  {
    icon: MessageSquareText,
    title: 'AI expense entry',
    copy: 'Record expenses using natural language and review AI-generated transaction details before confirming them.',
    action: 'Explore AI entry',
  },
] as const;

const BENEFITS = [
  {
    title: 'Clear spending patterns',
    copy: 'Understand where your money goes every month with automatic categorization and visual cash-flow breakdowns.',
    statLabel: 'Monthly Net Surplus',
    statValue: '+ ৳16,450.00',
    statTrend: '+14.2%',
  },
  {
    title: 'Organized transactions',
    copy: 'Filter, sort, and search across your entire financial history in milliseconds with custom tags and notes.',
    statLabel: 'Tracked This Month',
    statValue: '৳28,550.00',
    statTrend: '42 entries',
  },
  {
    title: 'Track debts and commitments',
    copy: 'Monitor money lent to or borrowed from friends, log partial repayments, and settle balances with zero confusion.',
    statLabel: 'Pending Collection',
    statValue: '৳19,500.00',
    statTrend: '2 active loans',
  },
  {
    title: 'Privacy and data protection',
    copy: 'Sign-in is handled securely, and strict database isolation rules keep each account’s records completely private.',
    statLabel: 'Security Status',
    statValue: '100% Isolated',
    statTrend: 'No bank link needed',
  },
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Record',
    badge: 'Effortless Entry',
    copy: 'Add daily transactions using quick manual forms or natural-language AI-assisted expense entry.',
    highlights: [
      'Natural language AI expense parsing',
      'Custom categories, tags & date pickers',
      'Instant balance & cash flow recalculation',
      'Support for income, expenses & transfers',
    ],
  },
  {
    number: '02',
    title: 'Analyze',
    badge: 'Most Popular Workflow',
    featured: true,
    copy: 'Inspect categorized entries, compare month-over-month burn rates, and ask Ledgerly AI for instant insights.',
    highlights: [
      'Visual category & cash-flow breakdowns',
      'Interactive AI financial Q&A assistant',
      'Month-over-month spending comparisons',
      'Real-time budget burn-rate monitoring',
    ],
  },
  {
    number: '03',
    title: 'Plan',
    badge: 'Complete Control',
    copy: "Monitor monthly budget health, stay ahead of bills, and keep track of money you've lent or borrowed.",
    highlights: [
      'Category-level monthly budget thresholds',
      'Lent & borrowed debt repayment ledger',
      'Partial repayment & due-date tracking',
      'Private, isolated per-account cloud sync',
    ],
  },
] as const;

const HERO_ACTIVITY = [
  { name: 'Agora Superstore', meta: 'Groceries · Nov 8', amount: '− ৳1,200.00', income: false },
  { name: 'Design consulting', meta: 'Income · Nov 5', amount: '+ ৳35,000.00', income: true },
  { name: 'Broadband internet', meta: 'Utilities · Nov 2', amount: '− ৳1,350.00', income: false },
] as const;

const HERO_CATEGORIES = [
  { name: 'Rent', amount: '৳12,000', percent: 42, color: '#1E3A5F' },
  { name: 'Food & dining', amount: '৳8,000', percent: 28, color: '#3B82F6' },
  { name: 'Savings', amount: '৳5,100', percent: 18, color: '#F59E0B' },
  { name: 'Utilities', amount: '৳3,450', percent: 12, color: '#93C5FD' },
] as const;

const PREVIEW_BUDGETS = [
  { name: 'Rent', spent: '৳12,000', limit: '৳14,000', percent: 86 },
  { name: 'Food & dining', spent: '৳8,000', limit: '৳9,000', percent: 89 },
] as const;

const PREVIEW_ACTIVITY = [
  { name: 'Agora Superstore', meta: 'Groceries · Nov 8', amount: '− ৳1,200.00', income: false },
  { name: 'Electricity bill', meta: 'Utilities · Nov 7', amount: '− ৳2,340.00', income: false },
  { name: 'Design consulting', meta: 'Income · Nov 5', amount: '+ ৳35,000.00', income: true },
  { name: 'Broadband internet', meta: 'Utilities · Nov 2', amount: '− ৳1,350.00', income: false },
] as const;

const WEEKLY_BARS = [
  { day: 'Sun', value: '৳2.1k', height: '42%' },
  { day: 'Mon', value: '৳4.8k', height: '84%' },
  { day: 'Tue', value: '৳3.2k', height: '58%' },
  { day: 'Wed', value: '৳5.6k', height: '96%' },
  { day: 'Thu', value: '৳2.9k', height: '52%' },
  { day: 'Fri', value: '৳4.1k', height: '74%' },
  { day: 'Sat', value: '৳1.8k', height: '36%' },
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
   Scroll Reveal Wrapper (Matches Video's Blur + Slide-Up Entrance)
   ========================================================================== */

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity,filter] ${
        visible
          ? 'translate-y-0 scale-100 opacity-100 blur-0'
          : 'translate-y-8 scale-[0.98] opacity-0 blur-[10px]'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   Page Component
   ========================================================================== */

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [activeDemoId, setActiveDemoId] = useState(AI_DEMOS[0].id);
  const [activeBenefitIndex, setActiveBenefitIndex] = useState(0);
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
  const activeBenefit = BENEFITS[activeBenefitIndex] ?? BENEFITS[0];
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Social metadata */}
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

      {/* Keyframe animations inspired by the video */}
      <style>{`
        @keyframes ledgerlyFloatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes ledgerlyFloatDelayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ledgerlyPulseOrb {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .animate-float-slow {
          animation: ledgerlyFloatSlow 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: ledgerlyFloatDelayed 7.5s ease-in-out 1.5s infinite;
        }
        .animate-pulse-orb {
          animation: ledgerlyPulseOrb 5s ease-in-out infinite;
        }
      `}</style>

      <div className="flex min-h-screen flex-col overflow-x-clip bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-[#D8ECFF] selection:text-[#1E3A5F] dark:selection:bg-[#1E3A5F] dark:selection:text-white">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-xl focus:border focus:border-[var(--color-border)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-text)] focus:shadow-lg"
        >
          Skip to content
        </a>

        {/* ====================================================================
            Floating Glass Pill Navigation (Video 00:00 style)
            ==================================================================== */}
        <header className="sticky top-0 z-50 pt-3 sm:pt-4">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
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
              <span className="text-[19px] font-semibold tracking-tight text-[var(--color-text)]">
                Ledgerly<span className="text-[#2B75B6]">.</span>
              </span>
            </Link>

            {/* Center Frosted Pill Nav */}
            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/60 px-2 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 md:flex"
            >
              {NAV_LINKS.map((link) => {
                const active = activeSection === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'true' : undefined}
                    className={`relative rounded-full px-4 py-1.5 text-[13px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                      active
                        ? 'bg-white font-medium text-[#1E3A5F] shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex shrink-0 items-center gap-2">
              {mounted ? (
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/75 text-[var(--color-text-muted)] shadow-xs backdrop-blur-md transition-colors hover:bg-white hover:text-[var(--color-text)] dark:border-white/10 dark:bg-slate-900/75 dark:hover:bg-slate-800"
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]"
                />
              )}

              <Link
                href="/login"
                className="hidden h-9 items-center rounded-full px-3.5 text-[13px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline-flex"
              >
                Sign in
              </Link>

              <Link
                href="/login?mode=signup"
                className="hidden h-9 items-center justify-center rounded-full border border-white/90 bg-white px-4 text-[13px] font-medium text-slate-900 shadow-[0_4px_14px_rgba(30,58,95,0.08)] transition-all hover:-translate-y-0.5 hover:bg-slate-50 sm:inline-flex dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                Get started
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/75 text-[var(--color-text)] backdrop-blur-md md:hidden dark:border-white/10 dark:bg-slate-900/75"
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
            className={`mx-4 mt-2 grid overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-xl backdrop-blur-xl transition-all duration-300 md:hidden ${
              mobileMenuOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'pointer-events-none grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0" inert={!mobileMenuOpen}>
              <nav aria-label="Mobile" className="px-4 pt-3 pb-2">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-2 border-t border-[var(--color-border)] px-4 pt-3 pb-4">
                <Link
                  href="/login?mode=signup"
                  onClick={closeMobileMenu}
                  className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-medium text-white"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text)]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main id="main" className="flex-1">
          {/* ==================================================================
              1. HERO SECTION (Video 00:00 - 00:01 Asymmetric Sky + Center Phone)
              ================================================================== */}
          <section className="relative -mt-18 overflow-hidden pt-26 pb-16 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28">
            {/* Soft Sky Blue & Cloud Atmospheric Backdrop */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#BCE1FA]/75 via-[#E4F3FE]/55 to-[var(--color-bg)] dark:from-[#0F253E]/70 dark:via-[#0B1727]/50 dark:to-[var(--color-bg)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[420px] w-[980px] -translate-x-1/2 rounded-full bg-[#8CCBFF]/35 blur-[110px] dark:bg-[#1E4F8A]/30"
            />
            {/* Cloud-like soft bottom mist */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 bottom-0 left-0 -z-10 h-44 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent"
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Top Split Headline & Right CTA Block (Matches Video 00:00) */}
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                <Reveal className="lg:col-span-7">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#2B75B6]/20 bg-white/70 px-3.5 py-1 text-xs font-medium text-[#1E3A5F] shadow-2xs backdrop-blur-sm dark:border-sky-400/20 dark:bg-slate-900/70 dark:text-sky-300">
                    <Sparkles className="h-3.5 w-3.5 text-[#2B75B6] dark:text-sky-400" />
                    Personal finance, made clear
                  </span>
                  <h1 className="mt-4 font-display text-[2.75rem] leading-[1.06] font-normal tracking-[-0.025em] text-[var(--color-text)] sm:text-[3.75rem] lg:text-[4.4rem]">
                    <span className="block">Make Sense of</span>
                    <span className="block">Your Money.</span>
                  </h1>
                </Reveal>

                <Reveal delay={120} className="lg:col-span-4 lg:col-start-9 lg:pt-6">
                  <p className="text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                    Ledgerly helps you track daily expenses, understand spending patterns,
                    manage monthly budgets, and organize money you owe or are owed, all in one
                    place.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      href="/login?mode=signup"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-[#1E3A5F]/20 bg-white/85 px-6 text-sm font-medium text-[#1E3A5F] shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-[#1E3A5F] hover:text-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-slate-900"
                    >
                      Get started free
                    </Link>
                    <a
                      href="#features"
                      className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    >
                      Explore features →
                    </a>
                  </div>
                </Reveal>
              </div>

              {/* Center Interactive Smartphone Showcase + Floating Side Widgets */}
              <div className="relative mt-10 grid grid-cols-1 items-center gap-8 lg:mt-6 lg:grid-cols-12">
                {/* Left Floating Analytics Cards (Video 00:01 left side) */}
                <Reveal
                  delay={180}
                  className="order-2 flex flex-col gap-5 lg:order-1 lg:col-span-4"
                >
                  <div className="animate-float-slow rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_12px_36px_rgba(30,58,95,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <svg
                          viewBox="0 0 120 36"
                          className="h-9 w-28 shrink-0 overflow-visible"
                          aria-hidden="true"
                        >
                          <path
                            d="M 4 28 Q 22 12, 38 22 T 72 10 T 116 16"
                            fill="none"
                            stroke="#2B75B6"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                          <circle cx="72" cy="10" r="3.5" fill="#1E3A5F" />
                        </svg>
                        <div className="text-right">
                          <p className="text-lg font-semibold tabular-nums text-[var(--color-text)]">
                            63%+
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            Monthly budget used
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-3">
                        <svg
                          viewBox="0 0 120 36"
                          className="h-9 w-28 shrink-0 overflow-visible"
                          aria-hidden="true"
                        >
                          <path
                            d="M 4 26 Q 30 28, 48 16 T 88 18 T 116 8"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                          <circle cx="116" cy="8" r="3.5" fill="#10B981" />
                        </svg>
                        <div className="text-right">
                          <p className="text-lg font-semibold tabular-nums text-[var(--color-text)]">
                            19 days
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            Remaining in cycle
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Debt / Loan Avatar Pill (Video 00:01 bottom-left "$15k+ Per Month") */}
                  <div className="animate-float-delayed flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_12px_36px_rgba(30,58,95,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75">
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)]">
                        Tracked Loans &amp; Debts
                      </p>
                      <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums text-[#1E3A5F] dark:text-sky-300">
                        ৳19.5k+{' '}
                        <span className="text-xs font-normal text-[var(--color-text-muted)]">
                          To Collect
                        </span>
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {['TA', 'RI', 'NJ'].map((initials, idx) => (
                        <span
                          key={initials}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-xs dark:border-slate-900 ${
                            idx === 0
                              ? 'bg-[#1E3A5F]'
                              : idx === 1
                                ? 'bg-[#2B75B6]'
                                : 'bg-[#5BA6EA]'
                          }`}
                        >
                          {initials}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>

                {/* Center Smartphone Mockup (Video 00:01 Centerpiece) */}
                <Reveal delay={80} className="order-1 lg:order-2 lg:col-span-4">
                  <div
                    role="img"
                    aria-label="Illustrative Ledgerly mobile dashboard preview: net cash flow ৳6,450.00 for November 2026, quick actions, and recent transactions."
                    className="mx-auto w-full max-w-[350px] rounded-[2.75rem] border-[7px] border-slate-900 bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-950"
                  >
                    {/* Dynamic Island Notch */}
                    <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-slate-950 dark:bg-slate-800" />

                    {/* User Greeting Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D8ECFF] text-xs font-semibold text-[#1E3A5F]">
                          L
                        </span>
                        <div>
                          <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Welcome back <span aria-hidden="true">👋</span>
                          </p>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            Ledgerly Personal
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-3 w-3" />
                        Surplus
                      </span>
                    </div>

                    {/* Available Balance Card */}
                    <div className="mt-4 rounded-2xl bg-[#F4F9FF] p-4 dark:bg-slate-900">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Net cash flow · Nov 2026</span>
                        <span className="font-medium text-[#2B75B6]">BDT (৳)</span>
                      </div>
                      <p className="mt-1.5 text-[28px] font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
                        ৳6,450.00
                      </p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Monthly budget</span>
                          <span className="tabular-nums">৳28,550 / ৳45,000</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-[#1E3A5F] dark:bg-sky-400"
                            style={{ width: '63%' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Quick Actions
                      </p>
                      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                        {[
                          { icon: Plus, label: 'Record' },
                          { icon: Target, label: 'Budget' },
                          { icon: HandCoins, label: 'Loans' },
                          { icon: Sparkles, label: 'Ask AI' },
                        ].map(({ icon: Icon, label }) => (
                          <div
                            key={label}
                            className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 py-2.5 dark:bg-slate-900"
                          >
                            <Icon className="h-4 w-4 text-[#1E3A5F] dark:text-sky-400" />
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Recent Transactions
                        </p>
                        <span className="text-[10px] text-slate-400">Sample data</span>
                      </div>
                      <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/80">
                        {HERO_ACTIVITY.map((item) => (
                          <li
                            key={item.name}
                            className="flex items-center justify-between gap-2 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                  item.income
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}
                              >
                                {item.income ? (
                                  <ArrowDownLeft className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-slate-900 dark:text-white">
                                  {item.name}
                                </p>
                                <p className="truncate text-[10px] text-slate-500">
                                  {item.meta}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                                item.income
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.amount}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>

                {/* Right Floating Donut Chart Card (Video 00:01 bottom-right) */}
                <Reveal
                  delay={240}
                  className="order-3 flex flex-col gap-5 lg:col-span-4"
                >
                  <div className="animate-float-slow rounded-2xl border border-white/80 bg-white/80 p-5 shadow-[0_12px_36px_rgba(30,58,95,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--color-text)]">
                        Spending Categories
                      </p>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Nov 2026
                      </span>
                    </div>

                    {/* Conic-gradient Donut Chart */}
                    <div className="my-4 flex items-center justify-center">
                      <div
                        className="relative flex h-28 w-28 items-center justify-center rounded-full"
                        style={{
                          background:
                            'conic-gradient(#1E3A5F 0% 42%, #3B82F6 42% 70%, #F59E0B 70% 88%, #93C5FD 88% 100%)',
                        }}
                      >
                        <div className="flex h-18 w-18 flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            Total
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-[var(--color-text)]">
                            ৳28.5k
                          </span>
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {HERO_CATEGORIES.map((category) => (
                        <li
                          key={category.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </span>
                          <span className="font-semibold tabular-nums text-[var(--color-text)]">
                            {category.amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Trust Badges Strip */}
                  <ul className="flex flex-wrap gap-2">
                    {TRUST_POINTS.map(({ icon: Icon, label }) => (
                      <li
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-muted)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/65"
                      >
                        <Icon className="h-3.5 w-3.5 text-[#2B75B6]" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ==================================================================
              2. EDITORIAL STATEMENT + 2x2 PILLARS (Video 00:02 - 00:07)
              ================================================================== */}
          <section id="overview" className="scroll-mt-20 py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Glowing Concentric Blue Arcs + Centered Editorial Statement (Video 00:03) */}
              <Reveal className="mx-auto max-w-3xl text-center">
                <div
                  aria-hidden="true"
                  className="animate-pulse-orb relative mx-auto mb-8 flex h-28 w-28 items-center justify-center"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#60A5FA]/50 to-transparent blur-xl" />
                  <div className="relative h-24 w-24 rounded-full bg-gradient-to-b from-[#3B82F6]/35 to-transparent p-3">
                    <div className="h-full w-full rounded-full bg-gradient-to-b from-[#2563EB]/45 to-transparent p-3">
                      <div className="h-full w-full rounded-full bg-gradient-to-b from-[#1D4ED8]/60 to-transparent" />
                    </div>
                  </div>
                </div>

                <h2 className="font-display text-[1.85rem] leading-[1.22] font-normal tracking-[-0.02em] text-[var(--color-text)] sm:text-[2.5rem]">
                  From Daily Expense Tracking to Debt Management — We’ve Got You Covered.
                  Making Sense of Your <span className="text-[#2B75B6]">Money</span> Has Never
                  Been This Simple.
                </h2>
              </Reveal>

              {/* Split Card Showcase: Left Sky-Blue Phone Container + Right 2x2 Grid (Video 00:06) */}
              <div className="mt-16 grid grid-cols-1 items-center gap-10 lg:mt-24 lg:grid-cols-12 lg:gap-12">
                {/* Left Rounded Sky-Blue Card with Phone Preview */}
                <Reveal className="lg:col-span-5">
                  <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#BCE1FA] via-[#D9EEFD] to-[#EBF6FF] p-6 pt-8 pb-0 shadow-inner dark:from-[#122B4A] dark:via-[#0F223C] dark:to-[#0B182B]">
                    <div className="mx-auto max-w-[300px] rounded-t-[2.25rem] border-[6px] border-b-0 border-slate-900 bg-white p-4 pb-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                      <div className="mx-auto mb-3 h-4 w-20 rounded-full bg-slate-950 dark:bg-slate-800" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Loans &amp; Splits
                        </span>
                        <span className="text-[10px] font-medium text-[#2B75B6]">
                          Audit Trail
                        </span>
                      </div>

                      {/* Recent People Row */}
                      <div className="mt-3">
                        <p className="text-[10px] text-slate-500">Active People</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {[
                            { name: 'Tanvir', amount: '৳4.5k' },
                            { name: 'Rafiqul', amount: '৳15k' },
                            { name: 'Nusrat', amount: '৳15k' },
                            { name: 'Fariha', amount: '৳4.5k' },
                          ].map((person) => (
                            <div key={person.name} className="text-center">
                              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#E5F2FF] text-[11px] font-semibold text-[#1E3A5F] dark:bg-slate-800 dark:text-sky-300">
                                {person.name[0]}
                              </div>
                              <p className="mt-1 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                {person.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Repayment Summary Box */}
                      <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">To Collect</span>
                          <span className="font-semibold tabular-nums text-emerald-600">
                            ৳19,500.00
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">To Repay</span>
                          <span className="font-semibold tabular-nums text-rose-600">
                            ৳19,500.00
                          </span>
                        </div>
                        <div className="border-t border-slate-200/80 pt-2 text-[10px] text-slate-500 dark:border-slate-800">
                          Partial repayments tracked automatically
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Right Headline + 2x2 Feature Cards Grid */}
                <div className="lg:col-span-7">
                  <Reveal>
                    <p className="text-xs font-semibold tracking-wider text-[#2B75B6] uppercase">
                      What Ledgerly Does
                    </p>
                    <h3 className="mt-2 font-display text-[2rem] leading-[1.14] font-normal tracking-[-0.02em] text-[var(--color-text)] sm:text-[2.4rem]">
                      Built for Simplicity.
                      <br />
                      Designed for Clarity.
                    </h3>
                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                      Ledgerly turns daily financial records into clear, dependable insights.
                      Organize what you spend, understand where your money goes, and plan with
                      confidence.
                    </p>
                  </Reveal>

                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {PILLARS.map(({ number, icon: Icon, title, copy }, index) => (
                      <Reveal key={number} delay={index * 90}>
                        <div className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#5BA6EA]/50 hover:shadow-[0_12px_30px_rgba(43,117,182,0.08)]">
                          <div className="flex items-center justify-between">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF5FF] text-[#1E3A5F] dark:bg-sky-950/60 dark:text-sky-300">
                              <Icon className="h-5 w-5" strokeWidth={1.75} />
                            </span>
                            <span className="text-xs font-semibold tabular-nums text-[var(--color-text-subtle)]">
                              {number}
                            </span>
                          </div>
                          <h4 className="mt-5 text-[16px] font-semibold text-[var(--color-text)]">
                            {title}
                          </h4>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                            {copy}
                          </p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================================
              3. BENTO GRID SHOWCASE + FEATURES (Video 00:08 - 00:11)
              ================================================================== */}
          <section
            id="features"
            className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-surface)] py-20 sm:py-28"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold tracking-wider text-[#2B75B6] uppercase">
                  Explore Ledgerly
                </p>
                <h2 className="mt-2 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.02em] text-[var(--color-text)] sm:text-[2.6rem]">
                  Smart Finance Management
                  <br />
                  Made Simple Today
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                  Every tool is designed to give you control, confidence, and transparency
                  without overwhelming complexity.
                </p>
              </Reveal>

              {/* 2x2 Interactive UI Bento Showcase (Matches Video 00:09 - 00:11) */}
              <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Bento Card 1: Weekly Bar Chart */}
                <Reveal delay={0}>
                  <div className="flex h-full flex-col justify-between rounded-[1.75rem] border border-[#CFE6FC] bg-gradient-to-b from-[#F2F8FF] to-white p-6 shadow-xs dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                        <span className="font-semibold text-[var(--color-text)]">
                          Weekly Cash Flow
                        </span>
                        <span className="tabular-nums">Total: ৳24,500</span>
                      </div>
                      <div className="mt-5 grid h-36 grid-cols-7 items-end gap-2.5 pt-4">
                        {WEEKLY_BARS.map((bar, idx) => (
                          <div
                            key={bar.day}
                            className="flex h-full flex-col items-center justify-end gap-1.5"
                          >
                            <div
                              className={`w-full rounded-t-lg transition-all duration-500 ${
                                idx === 3
                                  ? 'bg-[#1E3A5F] dark:bg-sky-400'
                                  : 'bg-gradient-to-t from-[#DCEBFA] to-[#A6D1F7] dark:from-slate-800 dark:to-sky-800/70'
                              }`}
                              style={{ height: bar.height }}
                              title={`${bar.day}: ${bar.value}`}
                            />
                            <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                              {bar.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5">
                      <h3 className="text-[17px] font-semibold text-[var(--color-text)]">
                        Spending Analytics &amp; Trends
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                        Understand your financial habits through visual cash flow charts,
                        category breakdowns, and monthly trends.
                      </p>
                    </div>
                  </div>
                </Reveal>

                {/* Bento Card 2: AI Natural Language Entry */}
                <Reveal delay={100}>
                  <div className="flex h-full flex-col justify-between rounded-[1.75rem] border border-[#CFE6FC] bg-gradient-to-b from-[#F2F8FF] to-white p-6 shadow-xs dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
                          <Sparkles className="h-3.5 w-3.5 text-[#2B75B6]" />
                          AI Expense Entry
                        </span>
                        <span className="rounded-full bg-[#EBF5FF] px-2.5 py-0.5 text-[10px] font-semibold text-[#1E3A5F] dark:bg-sky-950 dark:text-sky-300">
                          Auto-parsed
                        </span>
                      </div>

                      <div className="mt-3 rounded-xl bg-[var(--color-surface-sunken)] p-3 text-xs text-[var(--color-text)]">
                        &ldquo;Spent ৳1,200 at Agora Superstore for weekly groceries&rdquo;
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 font-medium text-[var(--color-text-muted)]">
                          Category: Groceries
                        </span>
                        <span className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 font-semibold tabular-nums text-[var(--color-text)]">
                          Amount: ৳1,200.00
                        </span>
                      </div>

                      <Link
                        href="/login?mode=signup"
                        className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#1E3A5F] text-xs font-medium text-white transition-colors hover:bg-[#162C49]"
                      >
                        Confirm Transaction
                      </Link>
                    </div>

                    <div className="mt-5">
                      <h3 className="text-[17px] font-semibold text-[var(--color-text)]">
                        Natural Language Expense Entry
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                        Record expenses using plain sentences and review AI-generated
                        transaction details before confirming them.
                      </p>
                    </div>
                  </div>
                </Reveal>

                {/* Bento Card 3: Quick Manual & Budget Form (Video 00:10 Bottom-Left) */}
                <Reveal delay={150}>
                  <div className="flex h-full flex-col justify-between rounded-[1.75rem] border border-[#CFE6FC] bg-gradient-to-b from-[#F2F8FF] to-white p-6 shadow-xs dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                      <p className="text-xs font-semibold text-[var(--color-text)]">
                        Monthly Budget Guardrails
                      </p>
                      <div className="mt-3 space-y-3">
                        {PREVIEW_BUDGETS.map((budget) => (
                          <div
                            key={budget.name}
                            className="rounded-xl bg-[var(--color-surface-sunken)] p-3"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-[var(--color-text)]">
                                {budget.name}
                              </span>
                              <span className="tabular-nums text-[var(--color-text-muted)]">
                                {budget.spent} / {budget.limit} ({budget.percent}%)
                              </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-[#1E3A5F] dark:bg-sky-400"
                                style={{ width: `${budget.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/login?mode=signup"
                        className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#1E3A5F] text-xs font-medium text-white transition-colors hover:bg-[#162C49]"
                      >
                        Manage Monthly Budgets
                      </Link>
                    </div>

                    <div className="mt-5">
                      <h3 className="text-[17px] font-semibold text-[var(--color-text)]">
                        Proactive Budget Management
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                        Set comfortable monthly limits across categories. Monitor your burn
                        rate and stay ahead of overspending.
                      </p>
                    </div>
                  </div>
                </Reveal>

                {/* Bento Card 4: Recent Activity & Bills (Video 00:10 Bottom-Right) */}
                <Reveal delay={220}>
                  <div className="flex h-full flex-col justify-between rounded-[1.75rem] border border-[#CFE6FC] bg-gradient-to-b from-[#F2F8FF] to-white p-6 shadow-xs dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--color-text)]">
                          Recent Ledger Activity
                        </span>
                        <span className="text-[11px] text-[#2B75B6]">Sample data</span>
                      </div>
                      <ul className="mt-3 divide-y divide-[var(--color-border)]">
                        {PREVIEW_ACTIVITY.map((item) => (
                          <li
                            key={item.name}
                            className="flex items-center justify-between gap-2 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                  item.income
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}
                              >
                                {item.income ? (
                                  <ArrowDownLeft className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-[var(--color-text)]">
                                  {item.name}
                                </p>
                                <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                                  {item.meta}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--color-text)]">
                              {item.amount}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5">
                      <h3 className="text-[17px] font-semibold text-[var(--color-text)]">
                        Unified Transaction Tracking System
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                        Keep track of daily expenses, recurring utility bills, and income
                        streams without missing a single detail.
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* All 6 Features Quick-Action Cards */}
              <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map(({ icon: Icon, title, copy, action }, idx) => (
                  <li key={title} className="min-w-0">
                    <Reveal delay={idx * 60}>
                      <Link
                        href="/login?mode=signup"
                        className="group flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5BA6EA]/60 hover:bg-[var(--color-surface-hover)]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF5FF] text-[#1E3A5F] dark:bg-sky-950/60 dark:text-sky-300">
                          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </span>
                        <h3 className="mt-4 text-[15px] font-semibold text-[var(--color-text)]">
                          {title}
                        </h3>
                        <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                          {copy}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2B75B6] dark:text-sky-400">
                          {action}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ==================================================================
              4. INTERACTIVE ACCORDION + PHONE SHOWCASE (Video 00:12 - 00:13)
              ================================================================== */}
          <section id="benefits" className="scroll-mt-20 py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
                {/* Left Accordion Column */}
                <Reveal className="lg:col-span-6">
                  <p className="text-xs font-semibold tracking-wider text-[#2B75B6] uppercase">
                    Why Ledgerly
                  </p>
                  <h2 className="mt-2 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.02em] text-[var(--color-text)] sm:text-[2.6rem]">
                    Finance Made
                    <br />
                    Simple For Everyone
                  </h2>

                  <div className="mt-8 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                    {BENEFITS.map((benefit, index) => {
                      const isOpen = index === activeBenefitIndex;
                      return (
                        <div key={benefit.title} className="py-4">
                          <button
                            type="button"
                            onClick={() => setActiveBenefitIndex(index)}
                            aria-expanded={isOpen}
                            className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
                          >
                            <span
                              className={`text-[16px] font-semibold transition-colors ${
                                isOpen
                                  ? 'text-[#1E3A5F] dark:text-sky-300'
                                  : 'text-[var(--color-text)] hover:text-[#2B75B6]'
                              }`}
                            >
                              {benefit.title}
                            </span>
                            <span className="text-xs font-medium tabular-nums text-[var(--color-text-muted)]">
                              0{index + 1}
                            </span>
                          </button>
                          {isOpen && (
                            <p className="mt-2.5 pr-6 text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
                              {benefit.copy}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8">
                    <Link
                      href="/login?mode=signup"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1E3A5F] px-6 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#162C49]"
                    >
                      Create your free account
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>

                {/* Right Rounded Sky-Blue Phone Showcase (Matches Video 00:13 "Earning" Screen) */}
                <Reveal delay={140} className="lg:col-span-6">
                  <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-[#BCE1FA] via-[#D9EEFD] to-[#EBF6FF] p-6 pt-10 pb-0 dark:from-[#122B4A] dark:via-[#0F223C] dark:to-[#0B182B]">
                    <div className="mx-auto max-w-[330px] rounded-t-[2.5rem] border-[6px] border-b-0 border-slate-900 bg-white p-5 pb-8 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                      <div className="mx-auto mb-4 h-4 w-20 rounded-full bg-slate-950 dark:bg-slate-800" />

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Monthly Overview
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Nov 2026
                        </span>
                      </div>

                      <div className="mt-6 text-center">
                        <p className="text-[11px] text-slate-500">
                          {activeBenefit.statLabel}
                        </p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
                          {activeBenefit.statValue}{' '}
                          <span className="text-xs font-semibold text-emerald-600">
                            {activeBenefit.statTrend}
                          </span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Total Income: ৳45,000 · Spent: ৳28,550
                        </p>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#F4F9FF] p-3 dark:bg-slate-900">
                          <p className="text-[10px] text-slate-500">To Collect</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                            ৳19,500.00
                          </p>
                          <p className="mt-1 text-[10px] text-emerald-600">2 active loans</p>
                        </div>
                        <div className="rounded-xl bg-[#F4F9FF] p-3 dark:bg-slate-900">
                          <p className="text-[10px] text-slate-500">Partial Repaid</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                            ৳27,000.00
                          </p>
                          <p className="mt-1 text-[10px] text-[#2B75B6]">Recorded</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ==================================================================
              5. THREE STEPS TIER CARDS (Video 00:15 - 00:16 Center Highlight Style)
              ================================================================== */}
          <section
            id="how-it-works"
            className="scroll-mt-20 border-t border-[var(--color-border)] bg-[var(--color-surface)] py-20 sm:py-28"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold tracking-wider text-[#2B75B6] uppercase">
                  How It Works
                </p>
                <h2 className="mt-2 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.02em] text-[var(--color-text)] sm:text-[2.6rem]">
                  Three Steps to Complete
                  <br />
                  Financial Clarity
                </h2>
                <p className="mt-3 text-[15px] text-[var(--color-text-muted)]">
                  Designed to be effortless and reliable, so tracking your finances never
                  feels like a chore.
                </p>
              </Reveal>

              <div className="mt-14 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
                {STEPS.map((step, idx) => {
                  const isFeatured = Boolean(step.featured);
                  return (
                    <Reveal key={step.number} delay={idx * 100}>
                      <div
                        className={`flex h-full flex-col rounded-[2rem] transition-all duration-300 ${
                          isFeatured
                            ? 'border-2 border-[#1E3A5F] bg-[#1E3A5F] p-1.5 shadow-[0_20px_50px_rgba(30,58,95,0.2)] lg:-translate-y-2'
                            : 'border border-[#CFE6FC] bg-gradient-to-b from-[#F4F9FF] to-white p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950'
                        }`}
                      >
                        {isFeatured && (
                          <div className="py-2 text-center text-xs font-semibold tracking-wide text-white">
                            {step.badge}
                          </div>
                        )}

                        <div
                          className={`flex flex-1 flex-col justify-between rounded-[1.6rem] ${
                            isFeatured
                              ? 'bg-white p-6 dark:bg-slate-950'
                              : ''
                          }`}
                        >
                          <div>
                            {!isFeatured && (
                              <span className="text-xs font-semibold text-[#2B75B6]">
                                {step.badge}
                              </span>
                            )}
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="font-display text-4xl font-semibold text-[var(--color-text)]">
                                {step.number}
                              </span>
                              <span className="text-lg font-semibold text-[var(--color-text)]">
                                · {step.title}
                              </span>
                            </div>
                            <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                              {step.copy}
                            </p>

                            <Link
                              href="/login?mode=signup"
                              className={`mt-6 flex h-10 w-full items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                                isFeatured
                                  ? 'bg-[#1E3A5F] text-white hover:bg-[#162C49]'
                                  : 'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                              }`}
                            >
                              Get Started Free
                            </Link>

                            <div className="my-6 flex items-center gap-3 text-[11px] font-semibold tracking-wider text-[var(--color-text-subtle)] uppercase">
                              <span className="h-px flex-1 bg-[var(--color-border)]" />
                              Capabilities
                              <span className="h-px flex-1 bg-[var(--color-border)]" />
                            </div>

                            <ul className="space-y-2.5">
                              {step.highlights.map((item) => (
                                <li
                                  key={item}
                                  className="flex items-center gap-2.5 text-[13px] text-[var(--color-text-muted)]"
                                >
                                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-white dark:bg-sky-400 dark:text-slate-950">
                                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                  </span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ==================================================================
              6. AI FINANCIAL ASSISTANT SHOWCASE (Interactive Cards + Live Preview)
              ================================================================== */}
          <section
            id="ai-assistant"
            className="scroll-mt-20 border-t border-[var(--color-border)] bg-[var(--color-bg)] py-20 sm:py-28"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold tracking-wider text-[#2B75B6] uppercase">
                  AI Financial Assistant
                </p>
                <h2 className="mt-2 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.02em] text-[var(--color-text)] sm:text-[2.6rem]">
                  Your Financial Questions,
                  <br />
                  Answered Instantly
                </h2>
                <p className="mt-3 text-[15px] text-[var(--color-text-muted)]">
                  Go beyond recording transactions. Select any question below to see how
                  Ledgerly AI analyzes your records.
                </p>
              </Reveal>

              <div className="mt-12 grid grid-cols-1 gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:gap-12">
                <Reveal>
                  <p className="text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                    Try a sample question
                  </p>
                  <div
                    className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1"
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
                          className={`cursor-pointer rounded-2xl border px-4 py-3 text-left text-[13.5px] transition-all ${
                            active
                              ? 'border-[#1E3A5F] bg-[#EBF5FF] font-semibold text-[#1E3A5F] shadow-xs dark:border-sky-400 dark:bg-sky-950/60 dark:text-sky-200'
                              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[#5BA6EA]/50 hover:text-[var(--color-text)]'
                          }`}
                        >
                          &ldquo;{demo.question}&rdquo;
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
                    This is a product demonstration. In the app, answers are generated from
                    your own transaction records — nothing is sent from this page.
                  </p>
                </Reveal>

                <Reveal delay={120}>
                  <div className="rounded-[1.75rem] border border-[#CFE6FC] bg-gradient-to-b from-[#F2F8FF] to-white p-5 shadow-sm sm:p-6 dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3.5">
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E3A5F] text-white">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-text)]">
                          Ledgerly AI
                        </span>
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-subtle)] shadow-2xs dark:bg-slate-800">
                        Sample data
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-xs bg-[#1E3A5F] px-4 py-2.5 text-[13px] font-medium text-white">
                        {activeDemo.question}
                      </p>

                      <div aria-live="polite" className="space-y-3.5">
                        <div className="flex items-start gap-2.5">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2B75B6]" />
                          <p className="text-[14px] leading-relaxed font-medium text-[var(--color-text)]">
                            {activeDemo.answer}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                          <div className="flex items-baseline justify-between text-[11px] font-semibold tracking-wider text-[var(--color-text-subtle)] uppercase">
                            <span>{activeDemo.columnLabel}</span>
                            <span>Amount</span>
                          </div>
                          <ul className="mt-2 divide-y divide-[var(--color-border)]">
                            {activeDemo.rows.map((row) => (
                              <li
                                key={row.label}
                                className="flex items-start justify-between gap-3 py-2.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-[var(--color-text)]">
                                    {row.label}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-[var(--color-text-subtle)]">
                                    {row.detail}
                                  </p>
                                </div>
                                <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--color-text)]">
                                  {row.amount}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ==================================================================
              7. FINAL SKY-CLOUD CALL TO ACTION (Video 00:20 - 00:22)
              ================================================================== */}
          <section className="relative overflow-hidden border-t border-[var(--color-border)] pt-20 pb-0 sm:pt-28">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[var(--color-bg)] via-[#D3ECFF]/70 to-[#BCE1FA]/90 dark:from-[var(--color-bg)] dark:via-[#0F253E]/60 dark:to-[#122B4A]/90"
            />

            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <Reveal className="mx-auto max-w-2xl">
                <h2 className="font-display text-[2.2rem] leading-[1.1] font-normal tracking-[-0.02em] text-[var(--color-text)] sm:text-[3rem]">
                  Take Full Control of Your
                  <br />
                  Financial Future
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                  Take the guesswork out of daily spending. Join Ledgerly today and build a
                  clearer picture of your money.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/login?mode=signup"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#1E3A5F] px-6 text-sm font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#162C49]"
                  >
                    Get started free
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/80 bg-white/80 px-6 text-sm font-medium text-[#1E3A5F] backdrop-blur-md transition-all hover:bg-white dark:border-white/15 dark:bg-slate-900/80 dark:text-white"
                  >
                    Sign in to dashboard
                  </Link>
                </div>
              </Reveal>

              {/* Center Rising Phone + Floating Side Callouts (Video 00:21) */}
              <Reveal delay={140} className="relative mx-auto mt-12 max-w-4xl">
                {/* Left Floating Surplus Pill */}
                <div className="animate-float-slow pointer-events-none absolute top-16 left-4 z-10 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-left shadow-lg backdrop-blur-md md:flex dark:border-white/10 dark:bg-slate-900/85">
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Monthly Surplus
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
                      ৳6,450.00
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                    +12.4%
                  </span>
                </div>

                {/* Right Floating AI Insight Pill */}
                <div className="animate-float-delayed pointer-events-none absolute top-24 right-4 z-10 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-left shadow-lg backdrop-blur-md md:flex dark:border-white/10 dark:bg-slate-900/85">
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Active Budget Status
                    </p>
                    <p className="text-xs font-semibold text-[var(--color-text)]">
                      63% used · 19 days left
                    </p>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EBF5FF] text-[#1E3A5F]">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                {/* Rising Bottom Phone Frame */}
                <div className="mx-auto max-w-[330px] rounded-t-[2.5rem] border-[7px] border-b-0 border-slate-900 bg-white p-4 pb-8 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                  <div className="mx-auto mb-3 h-4 w-20 rounded-full bg-slate-950 dark:bg-slate-800" />
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                    <span>Cash Flow Trend</span>
                    <span className="text-[#2B75B6]">Nov 2026</span>
                  </div>
                  <svg
                    viewBox="0 0 260 90"
                    className="mt-3 h-24 w-full overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="ctaAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 70 Q 45 25, 90 48 T 175 22 T 260 15 L 260 90 L 0 90 Z"
                      fill="url(#ctaAreaGrad)"
                    />
                    <path
                      d="M 0 70 Q 45 25, 90 48 T 175 22 T 260 15"
                      fill="none"
                      stroke="#1E3A5F"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="mt-3 space-y-2 text-left">
                    {HERO_CATEGORIES.slice(0, 3).map((cat) => (
                      <div
                        key={cat.name}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {cat.name}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {cat.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        </main>

        {/* ====================================================================
            8. FOOTER WITH WATERMARK TYPOGRAPHY (Video 00:23 - 00:24)
            ==================================================================== */}
        <footer className="relative overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] pt-14 pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Top Trust / Highlights Bar (Mirrors Video's 4-Column Top Strip) */}
            <div className="grid grid-cols-2 gap-4 border-b border-[var(--color-border)] pb-8 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase sm:grid-cols-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#2B75B6]" />
                <span>No Bank Link Needed</span>
              </div>
              <div className="flex items-center gap-2 sm:border-l sm:border-[var(--color-border)] sm:pl-6">
                <Lock className="h-4 w-4 text-[#2B75B6]" />
                <span>Isolated DB Records</span>
              </div>
              <div className="flex items-center gap-2 sm:border-l sm:border-[var(--color-border)] sm:pl-6">
                <Sparkles className="h-4 w-4 text-[#2B75B6]" />
                <span>AI Financial Insights</span>
              </div>
              <div className="flex items-center gap-2 sm:border-l sm:border-[var(--color-border)] sm:pl-6">
                <HandCoins className="h-4 w-4 text-[#2B75B6]" />
                <span>Debt &amp; Loan Audit</span>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
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
                  <span className="text-[16px] font-semibold tracking-tight text-[var(--color-text)]">
                    Ledgerly<span className="text-[#2B75B6]">.</span>
                  </span>
                </Link>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  A personal finance companion for daily spending, monthly budgets, and the
                  money you share with other people.
                </p>

                {/* Pill Quick-Start Bar */}
                <div className="mt-6 flex max-w-sm items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] p-1">
                  <span className="flex-1 truncate px-3 text-xs text-[var(--color-text-muted)]">
                    Ready to organize your finances?
                  </span>
                  <Link
                    href="/login?mode=signup"
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#1E3A5F] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#162C49]"
                  >
                    Start Free
                    <Send className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <nav aria-label="Product">
                <h2 className="text-xs font-semibold tracking-wider text-[var(--color-text)] uppercase">
                  Product
                </h2>
                <ul className="mt-3 space-y-2.5 text-[13px] text-[var(--color-text-muted)]">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="transition-colors hover:text-[var(--color-text)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label="Account">
                <h2 className="text-xs font-semibold tracking-wider text-[var(--color-text)] uppercase">
                  Account
                </h2>
                <ul className="mt-3 space-y-2.5 text-[13px] text-[var(--color-text-muted)]">
                  <li>
                    <Link
                      href="/login"
                      className="transition-colors hover:text-[var(--color-text)]"
                    >
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login?mode=signup"
                      className="transition-colors hover:text-[var(--color-text)]"
                    >
                      Create account
                    </Link>
                  </li>
                </ul>
              </nav>

              <div>
                <h2 className="text-xs font-semibold tracking-wider text-[var(--color-text)] uppercase">
                  Security
                </h2>
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

            {/* Oversized Faded Brand Watermark (Matches Video 00:24 Footer) */}
            <div
              aria-hidden="true"
              className="pointer-events-none mt-6 select-none overflow-hidden text-center"
            >
              <span className="block bg-gradient-to-b from-slate-900/[0.08] to-transparent bg-clip-text font-display text-[17vw] leading-[0.82] font-semibold tracking-tighter text-transparent dark:from-white/[0.08]">
                Ledgerly
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}