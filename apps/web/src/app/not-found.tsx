import Link from 'next/link';
import { Compass } from 'lucide-react';
import { buttonStyles } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6 py-16 text-[var(--color-text)]">
      <div className="w-full max-w-md">
        <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="text-page-title mt-4">Page not found</h1>
        <p className="text-secondary mt-2 max-w-sm">
          This page doesn&apos;t exist, or the link you followed is out of date.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/dashboard" className={buttonStyles('primary', 'md')}>
            Go to your dashboard
          </Link>
          <Link href="/" className={buttonStyles('secondary', 'md')}>
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
