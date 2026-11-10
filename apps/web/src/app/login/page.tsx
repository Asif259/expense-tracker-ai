'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/components/toast';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, Button, Field, Input, Spinner } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

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

  // Derive callback error (e.g. OAuth failure redirected back here)
  const callbackError = useMemo(() => {
    const cbError = searchParams.get('error');
    if (!cbError) return null;
    try {
      return decodeURIComponent(cbError);
    } catch {
      return cbError;
    }
  }, [searchParams]);

  const activeError = errorMsg || callbackError;

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
          toast('Signed in', 'success');
          router.replace('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setErrorMsg(error);
          toast(error, 'error');
        } else {
          toast('Account created. Check your email to continue.', 'success');
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
      const next = searchParams.get('next');
      const { error } = await signInWithGoogle({
        returnPath: next || undefined,
      });
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

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setErrorMsg(null);
  };

  const activeTabClass =
    'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]';
  const inactiveTabClass =
    'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]';

  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md sm:p-8">
        {/* Brand + short product line */}
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <span className="relative h-8 w-8 shrink-0">
              <Image
                src="/logo.webp"
                alt=""
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </span>
            <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
              Ledgerly<span className="text-[var(--color-primary)]">.</span>
            </span>
          </Link>

          <h1 className="mt-5 font-display text-2xl font-normal tracking-tight text-[var(--color-text)]">
            {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            {mode === 'signin'
              ? 'Sign in to open your ledger.'
              : 'Start with one transaction. It takes a minute.'}
          </p>
        </div>

        {/* Mode switch */}
        <div
          role="group"
          aria-label="Account mode"
          className="mt-6 flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-1"
        >
          <button
            type="button"
            aria-pressed={mode === 'signin'}
            onClick={() => switchMode('signin')}
            className={`flex-1 cursor-pointer rounded-[var(--radius-sm)] border py-2 text-[13px] font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
              mode === 'signin' ? activeTabClass : inactiveTabClass
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            aria-pressed={mode === 'signup'}
            onClick={() => switchMode('signup')}
            className={`flex-1 cursor-pointer rounded-[var(--radius-sm)] border py-2 text-[13px] font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
              mode === 'signup' ? activeTabClass : inactiveTabClass
            }`}
          >
            Create account
          </button>
        </div>

        {/* Error notification */}
        {activeError && (
          <Alert tone="danger" className="mt-5">
            {activeError}
          </Alert>
        )}

        {/* Google Sign-In */}
        <Button
          variant="secondary"
          size="lg"
          className="mt-5 w-full"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          loading={googleLoading}
          leadingIcon={<GoogleIcon />}
        >
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </Button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-subtle)]">or</span>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field id="email" label="Email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field
            id="password"
            label="Password"
            required
            hint="At least 6 characters."
          >
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-2 w-full"
            loading={loading}
            disabled={googleLoading}
          >
            {loading
              ? mode === 'signin'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12 text-[var(--color-text)]">
      <div className="absolute right-4 top-4">
        <ThemeToggle variant="compact" />
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Spinner className="h-6 w-6" label="Loading sign-in form" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
