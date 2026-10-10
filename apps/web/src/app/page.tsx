'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShieldCheck, Calculator, Zap, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center font-bold text-[var(--color-primary-contrast)] text-base shadow-sm">
            L
          </div>
          <span className="font-bold text-lg tracking-tight">Ledgerly</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="compact" />
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            href="/login?mode=signup"
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] transition-colors shadow-sm cursor-pointer"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-muted)] mb-8">
          <span className="h-2 w-2 rounded-full bg-[var(--color-income)]" />
          Powered by Groq Llama 3 &amp; Supabase RLS
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl leading-tight sm:leading-none mb-6">
          Track money at the speed of thought.
        </h1>

        <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mb-10">
          Describe any expense or income in plain natural language. Ledgerly parses,
          categorizes, and safeguards every transaction with dual-layer confirmation
          and precise string decimal math.
        </p>

        {/* Live prompt mock display */}
        <div className="w-full max-w-xl p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-left mb-10 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] border-b border-[var(--color-border)] pb-2 mb-3">
            <span>Natural Language Input</span>
            <span className="text-[var(--color-mint)] font-medium inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>0.2s Groq Inference</span>
            </span>
          </div>
          <p className="text-sm text-[var(--color-text)] mb-3 font-mono">
            &quot;Paid 1,200 BDT for grocery items at Agora yesterday evening&quot;
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--color-border)]/50 text-xs">
            <div>
              <span className="text-[var(--color-text-dim)] block">Amount</span>
              <span className="font-semibold text-[var(--color-text)]">৳1,200.00</span>
            </div>
            <div>
              <span className="text-[var(--color-text-dim)] block">Category</span>
              <span className="font-semibold text-[var(--color-text)]">Food &amp; Dining</span>
            </div>
            <div>
              <span className="text-[var(--color-text-dim)] block">Safety</span>
              <span className="font-semibold text-[var(--color-text)]">Draft Review</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login?mode=signup"
            className="px-6 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] font-semibold text-sm transition-colors shadow-sm cursor-pointer inline-flex items-center gap-2"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-medium text-sm transition-colors cursor-pointer"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </main>

      {/* Feature Pillars */}
      <section className="max-w-6xl mx-auto px-6 py-12 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold mb-2">Zero Direct AI Mutation</h3>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            AI suggestions are created as pending drafts. Never inserted directly into ledger without explicit user confirmation.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-mint)]/10 text-[var(--color-mint)] flex items-center justify-center mb-3">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold mb-2">Fixed-Precision Arithmetic</h3>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Exact decimal strings prevent IEEE-754 floating point drift. Up to 13 integer digits and 2 decimal places.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-amber)]/10 text-[var(--color-amber)] flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold mb-2">Supabase Row-Level Security</h3>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Database-enforced isolation. Multi-tenant privacy backed by PostgreSQL SECURITY DEFINER procedures.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 py-6 text-center text-xs text-[var(--color-text-dim)]">
        &copy; 2026 Ledgerly. All financial records strictly isolated by Supabase RLS.
      </footer>
    </div>
  );
}
