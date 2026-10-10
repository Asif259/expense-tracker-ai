'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/components/toast';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { AlertCircle, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, signUp, loading: authLoading } = useAuth();

  const isSignup = searchParams.get('mode') === 'signup';
  const [mode, setMode] = useState<'signin' | 'signup'>(isSignup ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error);
          toast(error, 'error');
        } else {
          toast('Successfully signed in!', 'success');
          router.replace('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setErrorMsg(error);
          toast(error, 'error');
        } else {
          toast('Account created! Please check your email or proceed.', 'success');
          router.replace('/dashboard');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
      {/* Brand header */}
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-2 mb-2 cursor-pointer">
          <div className="relative h-10 w-10 shrink-0">
            <Image src="/logo.webp" alt="Ledgerly Logo" fill sizes="40px" className="object-contain dark:hidden" priority />
            <Image src="/logo-dark.webp" alt="Ledgerly Logo" fill sizes="40px" className="object-contain hidden dark:block" priority />
          </div>
          <span className="text-xl font-bold tracking-tight">Ledgerly</span>
        </Link>
        <p className="text-xs text-[var(--color-text-muted)]">
          {mode === 'signin'
            ? 'Sign in to access your ledger and AI drafts'
            : 'Create an account to start tracking expenses with AI'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg bg-[var(--color-bg)] p-1 border border-[var(--color-border)] mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setErrorMsg(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            mode === 'signin'
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setErrorMsg(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            mode === 'signup'
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg border border-[var(--color-danger)]/50 bg-[var(--color-expense-bg)] text-xs text-[var(--color-expense)] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Auth form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
          {mode === 'signup' && (
            <span className="text-[10px] text-[var(--color-text-dim)] mt-1 block">
              Minimum 6 characters.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-md shadow-[var(--color-primary)]/15"
        >
          {loading && (
            <div className="animate-spin h-4 w-4 border-2 border-[var(--color-primary-contrast)] border-t-transparent rounded-full" />
          )}
          <span>
            {loading
              ? 'Processing...'
              : mode === 'signin'
                ? 'Sign In to Ledgerly'
                : 'Register Account'}
          </span>
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--color-text-dim)]">
        <Link href="/" className="hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1 cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Homepage</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg)] text-[var(--color-text)] relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="compact" />
      </div>
      <Suspense
        fallback={
          <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
