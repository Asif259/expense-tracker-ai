'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  ReceiptText,
  HandCoins,
  Sparkles,
  Plus,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ReceiptText },
  { href: '/loans', label: 'Debts & loans', icon: HandCoins },
  { href: '/ai-entry', label: 'AI quick add', icon: Sparkles },
];

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <Image
        src="/logo.webp"
        alt=""
        fill
        sizes={`${size}px`}
        className="object-contain"
        priority
      />
    </span>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(href) ?? false;

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2 text-[13px] transition-colors duration-[var(--duration-fast)] ${
              active
                ? 'bg-[var(--color-primary-subtle)] font-semibold text-[var(--color-primary-text)]'
                : 'font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </span>
            {item.badge && (
              <span className="rounded-[var(--radius-xs)] border border-[var(--color-border)] px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountRow({ email, initials, onSignOut }: { email?: string | null; initials: string; onSignOut: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-2 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-[11px] font-semibold text-[var(--color-text-secondary)]"
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-[var(--color-text)]">Your account</span>
          <span
            className="block truncate text-[11px] text-[var(--color-text-subtle)]"
            title={email ?? undefined}
          >
            {email}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        title="Sign out"
        aria-label="Sign out"
        className="shrink-0 cursor-pointer rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-subtle)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)]"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <div className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 md:block">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton mt-6 h-9 w-full" />
        <div className="mt-6 space-y-2">
          <div className="skeleton h-9 w-full" />
          <div className="skeleton h-9 w-full" />
          <div className="skeleton h-9 w-full" />
          <div className="skeleton h-9 w-full" />
        </div>
      </div>
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="skeleton h-8 w-56" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
          </div>
          <div className="skeleton h-80 w-full" />
        </div>
      </div>
    </div>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Dialog behaviour: scroll lock, Escape, focus in/out.
  useEffect(() => {
    if (mobileNavOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      if (!prevOpenRef.current) {
        requestAnimationFrame(() => drawerCloseBtnRef.current?.focus());
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileNavOpen(false);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else if (prevOpenRef.current) {
      triggerButtonRef.current?.focus();
    }
    prevOpenRef.current = mobileNavOpen;
  }, [mobileNavOpen]);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (loading) return <ShellSkeleton />;
  if (!user) return null;

  const initials = (user.email || 'A').slice(0, 2).toUpperCase();
  const newTransactionButton = (
    <Link
      href="/transactions/new"
      className="flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-[13px] font-medium text-[var(--color-primary-contrast)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-primary-hover)]"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span>New transaction</span>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-[var(--radius-md)] focus:bg-[var(--color-surface)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-text)] focus:shadow-[var(--shadow-md)]"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed top-0 bottom-0 left-0 z-40 hidden w-64 select-none flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] md:flex">
        <div className="flex h-16 items-center px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
              Ledgerly<span className="text-[var(--color-primary)]">.</span>
            </span>
          </Link>
        </div>

        <div className="px-3 pb-1">{newTransactionButton}</div>

        <SidebarNav />

        <div className="space-y-2 border-t border-[var(--color-border)] p-3">
          <ThemeToggle variant="full" />
          <AccountRow email={user.email} initials={initials} onSignOut={signOut} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 pt-[env(safe-area-inset-top,0px)] md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
            Ledgerly<span className="text-[var(--color-primary)]">.</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <ThemeToggle variant="compact" />
          <Link
            href="/transactions/new"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
            aria-label="New transaction"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)]"
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 bg-[var(--color-scrim)] transition-opacity duration-200 md:hidden ${
          mobileNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <div
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 z-[60] flex h-[100dvh] w-72 max-w-[calc(100vw-3rem)] transform flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-lg)] transition-transform duration-200 ease-[var(--ease-out)] md:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 pt-[env(safe-area-inset-top,0px)]">
          <Link
            href="/dashboard"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-2.5"
          >
            <BrandMark size={28} />
            <span className="text-[15px] font-semibold tracking-tight">Ledgerly</span>
          </Link>
          <button
            ref={drawerCloseBtnRef}
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)]"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 pt-3">{newTransactionButton}</div>
        <SidebarNav onNavigate={() => setMobileNavOpen(false)} />

        <div className="space-y-2 border-t border-[var(--color-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <ThemeToggle variant="full" />
          <AccountRow
            email={user.email}
            initials={initials}
            onSignOut={() => {
              setMobileNavOpen(false);
              signOut();
            }}
          />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className={`fixed right-0 bottom-0 left-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] transition-opacity duration-200 md:hidden ${
          mobileNavOpen ? 'pointer-events-none invisible opacity-0' : 'opacity-100'
        }`}
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          {[
            { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
            { href: '/transactions', label: 'Activity', icon: ReceiptText },
            { href: '/loans', label: 'Loans', icon: HandCoins },
            { href: '/ai-entry', label: 'AI add', icon: Sparkles },
          ].map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href) ?? false;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  active ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-text-muted)]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <main
          id="main-content"
          className="mx-auto mt-14 w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 md:mt-0 md:py-8 md:pb-10 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}
