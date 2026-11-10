'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the technical detail in the console for debugging, not on screen.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6 py-16 text-[var(--color-text)]">
      <div className="w-full max-w-md">
        <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)]">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="text-page-title mt-4">This page couldn&apos;t load</h1>
        <p className="text-secondary mt-2 max-w-sm">
          Something interrupted the page. Your saved records are not affected — try loading it
          again.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link href="/dashboard" className={buttonStyles('secondary', 'md')}>
            Go to your dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="text-caption mt-6">Reference: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
