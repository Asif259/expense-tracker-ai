'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroIllustration } from '@/components/landing/hero-illustration';
import {
  Wallet,
  Target,
  BarChart3,
  HandCoins,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Receipt,
  ShieldCheck,
  ChevronRight,
  Lock,
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col bg-landing-bg text-landing-text selection:bg-landing-mint selection:text-landing-teal-dark overflow-x-hidden transition-colors duration-200">
      {/* Decorative Top-Left Organic Shape */}
      <div className="absolute top-0 left-0 w-[420px] sm:w-[580px] h-[360px] sm:h-[480px] -z-10 pointer-events-none opacity-80 overflow-hidden">
        <svg
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform -translate-x-12 -translate-y-16 scale-110"
        >
          <path
            d="M50 0C160 30 260 0 360 70C460 140 540 260 480 340C420 420 280 430 180 390C80 350 -10 280 -40 180C-70 80 -60 -30 50 0Z"
            fill="var(--color-landing-mint)"
          />
          <path
            d="M30 40C120 70 200 40 280 100C360 160 420 250 380 310C340 370 220 380 140 350C60 320 -10 260 -30 180C-50 100 -60 10 30 40Z"
            fill="var(--color-landing-aqua)"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* =========================================================================
          1. HEADER & NAVIGATION
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-landing-bg/90 backdrop-blur-md border-b border-landing-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-landing-teal rounded-lg p-1"
          >
            <div className="relative w-8 h-8 shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/logo.webp"
                alt="Ledgerly Logo"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-landing-text group-hover:text-landing-teal transition-colors">
              Ledgerly<span className="text-landing-teal">.</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-landing-text-muted" aria-label="Main navigation">
            <a
              href="#overview"
              className="hover:text-landing-text transition-colors py-1 focus-visible:outline-landing-teal"
            >
              Overview
            </a>
            <a
              href="#features"
              className="hover:text-landing-text transition-colors py-1 focus-visible:outline-landing-teal"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="hover:text-landing-text transition-colors py-1 focus-visible:outline-landing-teal"
            >
              Benefits
            </a>
            <a
              href="#how-it-works"
              className="hover:text-landing-text transition-colors py-1 focus-visible:outline-landing-teal"
            >
              How It Works
            </a>
          </nav>

          {/* Header Controls & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <ThemeToggle variant="compact" />

            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-landing-text hover:text-landing-teal transition-colors focus-visible:outline-landing-teal rounded-lg"
            >
              Sign In
            </Link>

            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-landing-teal hover:bg-landing-teal-hover text-white dark:text-slate-950 text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all shadow-sm hover:shadow-md hover:shadow-teal-900/10 active:scale-95 focus-visible:outline-landing-teal"
            >
              Get Started
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-landing-text-muted hover:text-landing-text focus-visible:outline-landing-teal rounded-lg"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-landing-border bg-landing-surface px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
            <a
              href="#overview"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-landing-text hover:bg-landing-mint/30"
            >
              Overview
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-landing-text hover:bg-landing-mint/30"
            >
              Features
            </a>
            <a
              href="#benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-landing-text hover:bg-landing-mint/30"
            >
              Benefits
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-landing-text hover:bg-landing-mint/30"
            >
              How It Works
            </a>
            <div className="pt-3 border-t border-landing-border flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium border border-landing-border rounded-xl text-landing-text hover:bg-landing-alt"
              >
                Sign In to Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION
          ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-6 sm:space-y-8 text-left">
              {/* Dominant Editorial Serif Heading (No kicker / eyebrow) */}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-landing-text font-normal tracking-tight leading-[1.08] max-w-xl">
                Make sense of your money.
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-landing-text-muted leading-relaxed max-w-lg">
                Ledgerly helps you track daily expenses, understand spending patterns,
                manage monthly budgets, and organize money you owe or are owed—safely and clearly.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-landing-teal hover:bg-landing-teal-hover text-white dark:text-slate-950 text-sm font-semibold tracking-wide uppercase shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer focus-visible:outline-landing-teal"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-landing-border bg-landing-surface-card hover:bg-landing-mint text-landing-text text-sm font-medium transition-colors cursor-pointer focus-visible:outline-landing-teal"
                >
                  Explore Features
                </a>
              </div>

              {/* Trust & Privacy Reassurance */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-landing-text-muted">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-landing-teal" />
                  <span>No Bank Credentials Needed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-landing-teal" />
                  <span>PostgreSQL Row-Level Security</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-landing-teal" />
                  <span>Exact Decimal Math</span>
                </div>
              </div>
            </div>

            {/* Hero Right Column: High-Fidelity Personal Finance Workspace Artwork */}
            <div className="lg:col-span-6 xl:col-span-6 flex justify-center">
              <div className="relative w-full max-w-[560px] mx-auto flex items-center justify-center">
                {/* Background Soft Organic Glow */}
                <div className="absolute -inset-4 sm:-inset-8 -z-10 pointer-events-none opacity-80 overflow-visible">
                  <svg
                    viewBox="0 0 600 500"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full transform scale-105"
                  >
                    <path
                      d="M480 220C520 320 460 440 360 490C250 540 130 500 70 400C10 300 20 170 110 90C200 10 340 30 420 90C470 125 450 165 480 220Z"
                      fill="var(--color-landing-mint)"
                      className="transition-colors duration-500"
                    />
                    <path
                      d="M500 170C540 250 490 370 420 410C340 450 260 400 220 340C180 280 200 190 260 130C320 70 430 70 480 110C495 125 490 145 500 170Z"
                      fill="var(--color-landing-aqua)"
                      opacity="0.6"
                      className="transition-colors duration-500"
                    />
                  </svg>
                </div>

                <Image
                  src="/Hero-image.webp"
                  alt="Ledgerly personal finance workspace with charts, category breakdown, and expense insights"
                  width={1536}
                  height={1024}
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                  className="w-full h-auto object-contain select-none drop-shadow-sm transition-transform duration-300 hover:scale-[1.01]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. "WHAT LEDGERLY DOES" SECTION
          ========================================================================= */}
      <section id="overview" className="py-20 bg-landing-alt border-y border-landing-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centered Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-landing-text font-normal tracking-tight">
              Everything you need to understand your money.
            </h2>
            <p className="text-sm sm:text-base text-landing-text-muted leading-relaxed">
              Ledgerly turns daily financial records into calm, dependable clarity.
              Organized around how you actually spend, review, and plan.
            </p>
          </div>

          {/* 3 Pillars Connected Horizontally */}
          <div className="relative max-w-4xl mx-auto">
            {/* Subtle horizontal connecting guide line (desktop) */}
            <div className="hidden md:block absolute top-12 left-24 right-24 h-px bg-landing-border -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative z-10">
              {/* Concept 1: Track */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-landing-surface-card border border-landing-border shadow-sm flex items-center justify-center text-landing-teal transition-transform hover:scale-105">
                  <Receipt className="w-8 h-8" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-lg text-landing-text">Track</h3>
                <p className="text-sm text-landing-text-muted leading-relaxed max-w-xs">
                  Organize daily income and expenses in one clear, unified financial ledger with multi-currency support.
                </p>
              </div>

              {/* Concept 2: Understand */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-landing-surface-card border border-landing-border shadow-sm flex items-center justify-center text-landing-teal transition-transform hover:scale-105">
                  <BarChart3 className="w-8 h-8" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-lg text-landing-text">Understand</h3>
                <p className="text-sm text-landing-text-muted leading-relaxed max-w-xs">
                  Use spending breakdowns, cash flow comparisons, and category analytics to see where your money goes.
                </p>
              </div>

              {/* Concept 3: Plan */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-landing-surface-card border border-landing-border shadow-sm flex items-center justify-center text-landing-teal transition-transform hover:scale-105">
                  <Target className="w-8 h-8" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-lg text-landing-text">Plan</h3>
                <p className="text-sm text-landing-text-muted leading-relaxed max-w-xs">
                  Set comfortable budget limits, monitor savings progress, and manage loans or debts shared with friends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FEATURE SHOWCASE
          ========================================================================= */}
      <section id="features" className="py-24 relative overflow-hidden">
        {/* Soft Organic Background Region */}
        <div className="absolute right-0 top-1/2 w-96 h-96 -translate-y-1/2 -z-10 pointer-events-none opacity-60">
          <svg viewBox="0 0 400 400" fill="none" className="w-full h-full">
            <path
              d="M300 120C380 180 390 300 330 360C270 420 160 400 100 340C40 280 60 160 120 100C180 40 220 60 300 120Z"
              fill="var(--color-landing-mint)"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div className="space-y-3 max-w-2xl">
              <h2 className="font-serif text-3xl sm:text-4xl text-landing-text font-normal tracking-tight">
                Designed around your financial life.
              </h2>
              <p className="text-sm sm:text-base text-landing-text-muted leading-relaxed">
                Every tool is crafted to give you control, confidence, and transparency without overwhelming complexity.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <div className="w-9 h-9 rounded-full border border-landing-border bg-landing-surface-card flex items-center justify-center text-landing-text-muted">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
              <div className="w-9 h-9 rounded-full bg-landing-teal text-white flex items-center justify-center shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Smart Expense Tracking */}
            <div className="group p-6 rounded-2xl bg-landing-surface-card border border-landing-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-landing-aqua/60 dark:bg-landing-aqua text-landing-teal flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg text-landing-text mb-2.5">
                  Smart Expense Tracking
                </h3>
                <p className="text-xs sm:text-sm text-landing-text-muted leading-relaxed mb-6">
                  Record daily transactions with exact categories, custom dates, notes, and strict fixed-precision decimal math.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-landing-teal hover:text-landing-teal-dark transition-colors mt-auto"
              >
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Budget Management (Grounded, non-AI) */}
            <div className="group p-6 rounded-2xl bg-landing-surface-card border border-landing-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg text-landing-text mb-2.5">
                  Budget Management
                </h3>
                <p className="text-xs sm:text-sm text-landing-text-muted leading-relaxed mb-6">
                  Set comfortable monthly limits across categories. Monitor your burn rate in real time and stay ahead of overspending.
                </p>
              </div>
              <a
                href="#benefits"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-landing-teal hover:text-landing-teal-dark transition-colors mt-auto"
              >
                <span>Manage budgets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Card 3: Spending Analytics */}
            <div className="group p-6 rounded-2xl bg-landing-surface-card border border-landing-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-landing-mint text-landing-teal flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg text-landing-text mb-2.5">
                  Spending Analytics
                </h3>
                <p className="text-xs sm:text-sm text-landing-text-muted leading-relaxed mb-6">
                  Understand your financial health with visual cash flow charts, category breakdown distributions, and monthly trends.
                </p>
              </div>
              <a
                href="#benefits"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-landing-teal hover:text-landing-teal-dark transition-colors mt-auto"
              >
                <span>View analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Card 4: Debt & Loans Management */}
            <div className="group p-6 rounded-2xl bg-landing-surface-card border border-landing-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  <HandCoins className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg text-landing-text mb-2.5">
                  Debt &amp; Loans Tracker
                </h3>
                <p className="text-xs sm:text-sm text-landing-text-muted leading-relaxed mb-6">
                  Keep track of money lent to friends, borrowed funds, repayments, and outstanding balances with clear audit records.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-landing-teal hover:text-landing-teal-dark transition-colors mt-auto"
              >
                <span>Track loans</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BENEFITS SECTION
          ========================================================================= */}
      <section id="benefits" className="py-20 sm:py-28 bg-landing-alt border-y border-landing-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Financial Clarity & Debt Showcase (Real Ledger UI Preview) */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <HeroIllustration />
            </div>

            {/* Right Column: Benefits Content & 2x2 Checklist */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-8 order-1 lg:order-2">
              <div className="space-y-3">
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-landing-text font-normal tracking-tight leading-tight">
                  Feel more confident about your money.
                </h2>
                <p className="text-base text-landing-text-muted leading-relaxed max-w-lg">
                  Ledgerly provides the structure, insights, and safety checks you need to replace financial anxiety with calm, intentional clarity.
                </p>
              </div>

              {/* 2-Column Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 pt-2">
                {/* Benefit 1 */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-landing-teal text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-landing-text mb-1">
                      Clear spending patterns
                    </h3>
                    <p className="text-xs text-landing-text-muted leading-relaxed">
                      See where money flows month over month with intuitive charts.
                    </p>
                  </div>
                </div>

                {/* Benefit 2 */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-landing-teal text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-landing-text mb-1">
                      Organized transactions
                    </h3>
                    <p className="text-xs text-landing-text-muted leading-relaxed">
                      Filter, sort, and search your finances by category, account, or notes.
                    </p>
                  </div>
                </div>

                {/* Benefit 3 */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-landing-teal text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-landing-text mb-1">
                      Track debts &amp; commitments
                    </h3>
                    <p className="text-xs text-landing-text-muted leading-relaxed">
                      Monitor money lent or borrowed with friendly settlement tracking.
                    </p>
                  </div>
                </div>

                {/* Benefit 4 (Data Privacy) */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-landing-teal text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-landing-text mb-1">
                      Complete data privacy
                    </h3>
                    <p className="text-xs text-landing-text-muted leading-relaxed">
                      Your records are strictly isolated via PostgreSQL RLS. No bank scraping.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supporting CTA */}
              <div className="pt-2">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-landing-teal hover:text-landing-teal-dark transition-colors"
                >
                  <span>Create your free account today</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. HOW IT WORKS
          ========================================================================= */}
      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-landing-text font-normal tracking-tight">
              Three steps to complete clarity.
            </h2>
            <p className="text-sm sm:text-base text-landing-text-muted leading-relaxed">
              Designed to be effortless and reliable, so tracking your finances never feels like a chore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-landing-surface-card border border-landing-border text-center space-y-4 shadow-sm hover:border-landing-teal/40 transition-colors">
              <span className="font-serif text-4xl font-semibold text-landing-teal/40 block">
                01
              </span>
              <h3 className="font-semibold text-lg text-landing-text">1. Record</h3>
              <p className="text-xs sm:text-sm text-landing-text-muted leading-relaxed">
                Add transactions with quick manual forms with custom categories, dates, and accounts.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-landing-surface-card border border-landing-border text-center space-y-4 shadow-sm hover:border-landing-teal/40 transition-colors">
              <span className="font-serif text-4xl font-semibold text-landing-teal/40 block">
                02
              </span>
              <h3 className="font-semibold text-lg text-landing-text">2. Analyze</h3>
              <p className="text-xs sm:text-sm text-landing-text-muted leading-relaxed">
                Inspect categorized entries. Confirm amounts and dates with complete confidence—exact math, zero guesswork.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-landing-surface-card border border-landing-border text-center space-y-4 shadow-sm hover:border-landing-teal/40 transition-colors">
              <span className="font-serif text-4xl font-semibold text-landing-teal/40 block">
                03
              </span>
              <h3 className="font-semibold text-lg text-landing-text">3. Plan</h3>
              <p className="text-xs sm:text-sm text-landing-text-muted leading-relaxed">
                Monitor monthly budget health, explore visual analytics, and keep tabs on money you&apos;ve lent or borrowed with friends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl p-8 sm:p-14 lg:p-16 bg-landing-mint/60 border border-landing-border text-center space-y-6 relative overflow-hidden shadow-sm">
          {/* Subtle decorative background organic rings */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-landing-aqua/50 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-landing-teal/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-landing-text font-normal tracking-tight">
              Start seeing your finances more clearly.
            </h2>
            <p className="text-sm sm:text-base text-landing-text-muted leading-relaxed">
              Take the guesswork out of daily spending. Join Ledgerly today—free, private, and built for peace of mind.
            </p>
          </div>

          <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-landing-teal hover:bg-landing-teal-hover text-white dark:text-slate-950 text-sm font-semibold tracking-wide uppercase transition-all shadow-sm hover:shadow-md active:scale-98 focus-visible:outline-landing-teal"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-4 rounded-full border border-landing-border bg-landing-surface-card hover:bg-landing-alt text-landing-text text-sm font-medium transition-colors focus-visible:outline-landing-teal"
            >
              Sign In to Dashboard
            </Link>
          </div>

          <p className="relative z-10 text-xs text-landing-text-muted pt-2">
            Free forever for personal records • Complete PostgreSQL Row-Level Security
          </p>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
          ========================================================================= */}
      <footer className="mt-auto border-t border-landing-border bg-landing-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-6 h-6">
                <Image
                  src="/logo.webp"
                  alt="Ledgerly Logo"
                  fill
                  sizes="24px"
                  className="object-contain dark:hidden"
                />
                <Image
                  src="/logo-dark.webp"
                  alt="Ledgerly Logo"
                  fill
                  sizes="24px"
                  className="object-contain hidden dark:block"
                />
              </div>
              <span className="font-bold text-base tracking-tight text-landing-text">
                Ledgerly<span className="text-landing-teal">.</span>
              </span>
            </div>
            <p className="text-xs text-landing-text-muted leading-relaxed max-w-sm">
              A soft, modern personal finance companion designed for clarity, mindful budgeting,
              and stress-free loan tracking.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-landing-text uppercase tracking-wider block">
              Navigation
            </span>
            <ul className="space-y-1.5 text-xs text-landing-text-muted">
              <li>
                <a href="#overview" className="hover:text-landing-teal transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-landing-teal transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#benefits" className="hover:text-landing-teal transition-colors">
                  Benefits
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-landing-teal transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Account & Security */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-landing-text uppercase tracking-wider block">
              Access &amp; Security
            </span>
            <ul className="space-y-1.5 text-xs text-landing-text-muted">
              <li>
                <Link href="/login" className="hover:text-landing-teal transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/login?mode=signup" className="hover:text-landing-teal transition-colors">
                  Create Account
                </Link>
              </li>
              <li className="pt-1 text-[11px] text-landing-text-muted">
                PostgreSQL RLS Protected
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-landing-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-landing-text-muted">
          <span>&copy; 2026 Ledgerly. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Multi-tenant database privacy active</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
