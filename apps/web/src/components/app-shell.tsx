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
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (active) => (
      <LayoutDashboard
        className={`w-5 h-5 transition-colors ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'}`}
      />
    ),
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: (active) => (
      <ReceiptText
        className={`w-5 h-5 transition-colors ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'}`}
      />
    ),
  },
  {
    href: '/loans',
    label: 'Debts & Loans',
    icon: (active) => (
      <HandCoins
        className={`w-5 h-5 transition-colors ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'}`}
      />
    ),
  },
  {
    href: '/ai-entry',
    label: 'AI Smart Entry',
    badge: 'AI',
    icon: (active) => (
      <Sparkles
        className={`w-5 h-5 transition-colors ${active ? 'text-[var(--color-secondary)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'}`}
      />
    ),
  },
];

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


  // Modal behavior: background scroll locking, Escape key handler, focus restoration
  useEffect(() => {
    if (mobileNavOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Move focus into drawer close control on opening
      if (!prevOpenRef.current) {
        requestAnimationFrame(() => {
          drawerCloseBtnRef.current?.focus();
        });
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileNavOpen(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else if (prevOpenRef.current) {
      // Focus restoration on closing
      triggerButtonRef.current?.focus();
    }
    prevOpenRef.current = mobileNavOpen;
  }, [mobileNavOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-9 w-9 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
          <span className="text-xs font-medium text-[var(--color-text-muted)] tracking-wider uppercase">Loading Ledgerly...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isNavActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  const userInitials = (user.email || 'User')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex">
      {/* =========================================================================
          DESKTOP PERSISTENT SIDEBAR (w-64, elevated surface)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-surface-elevated)] border-r border-[var(--color-border)] fixed top-0 bottom-0 left-0 z-40 select-none">
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 shrink-0">
              <Image src="/logo.webp" alt="Ledgerly Logo" fill sizes="32px" className="object-contain" priority />
            </div>
            <div>
              <span className="text-base font-bold text-[var(--color-text)] tracking-tight group-hover:text-[var(--color-primary)] transition-colors">
                Ledgerly<span className="text-[var(--color-primary)]">.</span>
              </span>
              <span className="block text-[10px] text-[var(--color-text-dim)] font-semibold tracking-wider leading-none">
                PERSONAL FINANCE
              </span>
            </div>
          </Link>
        </div>

        {/* Quick CTA */}
        <div className="p-4">
          <Link
            href="/transactions/new"
            className="w-full h-10 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto" aria-label="Desktop primary navigation">
          <div className="px-3 pb-1 text-[11px] font-semibold text-[var(--color-text-dim)] uppercase tracking-wider">
            Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-[var(--color-pale-mint)] text-[var(--color-primary)] font-semibold border border-[var(--color-primary)]/20 shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform duration-150 ${active ? 'scale-110 text-[var(--color-primary)]' : 'group-hover:scale-105'}`}>
                    {item.icon(active)}
                  </div>
                  <span className={active ? 'font-semibold text-[var(--color-primary)]' : ''}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-pale-mint)] text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Account & Appearance / Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] space-y-2.5">
          <ThemeToggle variant="full" />

          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-hover)] flex items-center justify-center font-bold text-xs text-[var(--color-primary)] shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-[var(--color-text)] truncate">
                  Account
                </span>
                <span className="block text-[11px] text-[var(--color-text-dim)] truncate" title={user.email || ''}>
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              title="Sign out of Ledgerly"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense-bg)] transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOPBAR
          ========================================================================= */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)]">
        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
          <div className="relative w-7 h-7 shrink-0">
            <Image src="/logo.webp" alt="Ledgerly Logo" fill sizes="28px" className="object-contain" priority />
          </div>
          <span className="text-base font-bold text-[var(--color-text)] tracking-tight">
            Ledgerly<span className="text-[var(--color-primary)]">.</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <Link
            href="/transactions/new"
            className="w-9 h-9 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-contrast)] font-semibold flex items-center justify-center shadow-sm shadow-[var(--color-primary)]/20 active:scale-95 transition-transform cursor-pointer"
            aria-label="New transaction"
          >
            <Plus className="w-4 h-4" />
          </Link>
          <button
            ref={triggerButtonRef}
            onClick={() => setMobileNavOpen((open) => !open)}
            className="w-9 h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          MOBILE DRAWER OVERLAY (Full Viewport Modal Layering)
          ========================================================================= */}
      {/* Mobile Drawer Backdrop - covers complete viewport at z-50 */}
      <div
        className={`md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity duration-200 ${
          mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer Panel - full viewport height (100dvh) at z-[60] */}
      <div
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`md:hidden fixed inset-y-0 left-0 z-[60] w-72 sm:w-80 max-w-[calc(100vw-3rem)] h-dvh h-[100dvh] bg-[var(--color-surface-elevated)] border-r border-[var(--color-border)] shadow-2xl flex flex-col justify-between transform transition-transform duration-200 ease-out ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header with Logo & Explicit Close Button */}
        <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-[var(--color-border)] pt-[env(safe-area-inset-top,0px)]">
          <Link
            href="/dashboard"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="relative w-7 h-7 shrink-0">
              <Image src="/logo.webp" alt="Ledgerly Logo" fill sizes="28px" className="object-contain" priority />
            </div>
            <div>
              <span className="text-base font-bold text-[var(--color-text)] tracking-tight">
                Ledgerly<span className="text-[var(--color-primary)]">.</span>
              </span>
              <span className="block text-[9px] text-[var(--color-text-dim)] font-semibold tracking-wider leading-none">
                PERSONAL FINANCE
              </span>
            </div>
          </Link>
          <button
            ref={drawerCloseBtnRef}
            onClick={() => setMobileNavOpen(false)}
            className="w-9 h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick CTA */}
        <div className="p-4 shrink-0">
          <Link
            href="/transactions/new"
            onClick={() => setMobileNavOpen(false)}
            className="w-full h-10 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </Link>
        </div>

        {/* Scrollable Navigation List - independent scrolling on short mobile viewports */}
        <nav
          className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1.5"
          aria-label="Mobile drawer navigation"
        >
          <div className="px-3 pb-1 text-[11px] font-semibold text-[var(--color-text-dim)] uppercase tracking-wider">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-[var(--color-pale-mint)] text-[var(--color-primary)] font-semibold border border-[var(--color-primary)]/20 shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform duration-150 ${active ? 'scale-110 text-[var(--color-primary)]' : 'group-hover:scale-105'}`}>
                    {item.icon(active)}
                  </div>
                  <span className={active ? 'font-semibold text-[var(--color-primary)]' : ''}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-pale-mint)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Sticky Footer with Theme Toggle, Account Email, and Sign Out */}
        <div className="shrink-0 p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] space-y-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <ThemeToggle variant="full" />
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-hover)] flex items-center justify-center font-bold text-xs text-[var(--color-primary)] shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[var(--color-text)] truncate">
                  Account
                </span>
                <span className="block text-[11px] text-[var(--color-text-dim)] truncate" title={user.email || ''}>
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileNavOpen(false);
                signOut();
              }}
              title="Sign out of Ledgerly"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense-bg)] transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION (Persistent thumb-bar when drawer is closed)
          ========================================================================= */}
      <nav
        aria-label="Mobile bottom navigation"
        aria-hidden={mobileNavOpen ? 'true' : 'false'}
        className={`md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[var(--color-surface-elevated)]/95 backdrop-blur-md border-t border-[var(--color-border)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1 transition-all duration-200 ${
          mobileNavOpen ? 'opacity-0 pointer-events-none invisible' : 'opacity-100 pointer-events-auto'
        }`}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-colors ${
              pathname === '/dashboard'
                ? 'text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mb-0.5 ${pathname === '/dashboard' ? 'text-[var(--color-primary)]' : ''}`} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/transactions"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-colors ${
              pathname?.startsWith('/transactions') && pathname !== '/transactions/new'
                ? 'text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <ReceiptText className={`w-5 h-5 mb-0.5 ${pathname?.startsWith('/transactions') && pathname !== '/transactions/new' ? 'text-[var(--color-primary)]' : ''}`} />
            <span>Activity</span>
          </Link>

          <Link
            href="/transactions/new"
            className="flex flex-col items-center justify-center -mt-3.5"
            aria-label="New transaction"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-md shadow-[var(--color-primary)]/25 flex items-center justify-center active:scale-95 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-[var(--color-text)] mt-0.5">Add</span>
          </Link>

          <Link
            href="/loans"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-colors ${
              pathname?.startsWith('/loans')
                ? 'text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <HandCoins className={`w-5 h-5 mb-0.5 ${pathname?.startsWith('/loans') ? 'text-[var(--color-primary)]' : ''}`} />
            <span>Loans</span>
          </Link>

          <Link
            href="/ai-entry"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-colors ${
              pathname?.startsWith('/ai-entry')
                ? 'text-[var(--color-secondary)] font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Sparkles className={`w-5 h-5 mb-0.5 ${pathname?.startsWith('/ai-entry') ? 'text-[var(--color-secondary)]' : ''}`} />
            <span>AI</span>
          </Link>
        </div>
      </nav>

      {/* =========================================================================
          MAIN APPLICATION CONTENT AREA (offset by desktop sidebar & mobile chrome)
          ========================================================================= */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 mt-14 md:mt-0 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
          <div className="animate-spin h-9 w-9 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
        </div>
      }
    >
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}
