'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/components/toast';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { AlertCircle, ArrowLeft } from 'lucide-react';

/** Google wordmark SVG — inline to avoid an extra network request. */
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.709A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.709V4.959H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.041l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.959L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();

  const isSignup = searchParams.get('mode') === 'signup';
  const [mode, setMode] = useState<'signin' | 'signup'>(isSignup ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Show callback errors (e.g. OAuth failure redirected back here)
  useEffect(() => {
    const cbError = searchParams.get('error');
    if (cbError) {
      try {
        setErrorMsg(decodeURIComponent(cbError));
      } catch {
        setErrorMsg(cbError);
      }
    }
  }, [searchParams]);

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

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error);
        toast(error, 'error');
        setGoogleLoading(false);
      }
      // On success, Supabase redirects the browser — no further action needed here.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setErrorMsg(msg);
      toast(msg, 'error');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
      {/* Brand header */}
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-2 mb-2 cursor-pointer">
          <div className="relative h-10 w-10 shrink-0">
            <Image src="/logo.webp" alt="Ledgerly Logo" fill sizes="40px" className="object-contain" priority />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--color-text)]">
            Ledgerly<span className="text-[var(--color-primary)]">.</span>
          </span>
        </Link>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {mode === 'signin'
            ? 'Sign in to access your personal finance ledger'
            : 'Create an account to start tracking expenses with clarity'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl bg-[var(--color-surface-hover)] p-1 border border-[var(--color-border)] mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setErrorMsg(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'signin'
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
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
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="mb-6 p-3 rounded-xl border border-[var(--color-danger)]/50 bg-[var(--color-expense-bg)] text-xs text-[var(--color-expense)] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Google Sign-In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        aria-label="Continue with Google"
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] text-sm font-medium transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] mb-4"
      >
        {googleLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-dim)] border-t-transparent" />
        ) : (
          <GoogleIcon />
        )}
        <span>{googleLoading ? 'Redirecting…' : 'Continue with Google'}</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

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
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
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
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
          {mode === 'signup' && (
            <span className="text-[10px] text-[var(--color-text-dim)] mt-1 block">
              Minimum 6 characters.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          {loading && (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
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
