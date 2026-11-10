'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ButtonLink } from '@/components/ui';

const NAV_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#features', label: 'Features' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#how-it-works', label: 'How it works' },
] as const;

export function SiteNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (mobileMenuOpen) {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [mobileMenuOpen]);

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
        if (visible[0]?.target.id) {
          setActiveSection(`#${visible[0].target.id}`);
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-sm supports-[backdrop-filter]:bg-[var(--color-bg)]/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        >
          <span className="relative h-7 w-7 shrink-0 sm:h-8 sm:w-8">
            <Image src="/logo.webp" alt="" fill sizes="32px" className="object-contain" priority />
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
          <ThemeToggle variant="compact" />
          <Link
            href="/login"
            className="hidden h-9 items-center rounded-[var(--radius-md)] px-3 text-[13px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:inline-flex"
          >
            Sign in
          </Link>
          <span className="hidden sm:block">
            <ButtonLink href="/login?mode=signup" variant="primary" size="md">
              Get started
            </ButtonLink>
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

      {/* Mobile menu: animates open and closed; closed controls are inert. */}
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
            <ButtonLink
              href="/login?mode=signup"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={closeMobileMenu}
            >
              Get started
            </ButtonLink>
            <ButtonLink
              href="/login"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={closeMobileMenu}
            >
              Sign in
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
