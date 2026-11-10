import Link from 'next/link';
import Image from 'next/image';
import { CurrentYear } from './current-year';

const PRODUCT_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#features', label: 'Features' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#how-it-works', label: 'How it works' },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
              <span className="relative h-6 w-6 shrink-0">
                <Image src="/logo.webp" alt="" fill sizes="24px" className="object-contain" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
                Ledgerly<span className="text-[var(--color-primary)]">.</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              A personal finance companion for daily spending, monthly budgets, and the money
              you share with other people.
            </p>
          </div>

          <nav aria-label="Product">
            <h2 className="text-label">Product</h2>
            <ul className="mt-3 space-y-2 text-[13px] text-[var(--color-text-muted)]">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded-[var(--radius-xs)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
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
                <Link
                  href="/login"
                  className="rounded-[var(--radius-xs)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/login?mode=signup"
                  className="rounded-[var(--radius-xs)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
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
            © <CurrentYear /> Ledgerly. All rights reserved.
          </p>
          <p>Your records are private to your account.</p>
        </div>
      </div>
    </footer>
  );
}
