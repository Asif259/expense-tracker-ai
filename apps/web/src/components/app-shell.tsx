'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

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
          DESKTOP PERSISTENT SIDEBAR (w-64, #191919 elevated surface)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-surface-elevated)] border-r border-[var(--color-border)] fixed top-0 bottom-0 left-0 z-40 select-none">
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
              <span className="text-black font-extrabold text-sm tracking-tighter">L</span>
            </div>
            <div>
              <span className="text-base font-bold text-[var(--color-text)] tracking-tight group-hover:text-[var(--color-primary)] transition-colors">
                Ledgerly
              </span>
              <span className="block text-[10px] text-[var(--color-text-dim)] font-semibold tracking-wider leading-none">
                FINANCIAL AI
              </span>
            </div>
          </Link>
        </div>

        {/* Quick CTA */}
        <div className="p-4">
          <Link
            href="/transactions/new"
            className="w-full h-10 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[var(--color-primary)]/15 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
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
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform duration-150 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {item.icon(active)}
                  </div>
                  <span className={active ? 'font-semibold text-[var(--color-primary)]' : ''}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      item.badge === 'AI'
                        ? 'bg-[var(--color-secondary-bg)] text-[var(--color-secondary)] border border-[var(--color-secondary)]/20'
                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]'
                    }`}
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

          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-hover)] flex items-center justify-center font-bold text-xs text-[var(--color-primary)] shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-[var(--color-text)] truncate">
                  Account
                </span>
                <span className="block text-[11px] text-[var(--color-text-dim)] truncate">
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
          MOBILE TOPBAR + OVERLAY DRAWER
          ========================================================================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] z-30 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-md">
            <span className="text-black font-extrabold text-xs">L</span>
          </div>
          <span className="text-base font-bold text-[var(--color-text)] tracking-tight">
            Ledgerly
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
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="w-9 h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`md:hidden fixed top-14 bottom-0 left-0 w-72 bg-[var(--color-surface-elevated)] border-r border-[var(--color-border)] z-50 transform transition-transform duration-200 ease-out flex flex-col justify-between ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-2 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-semibold text-[var(--color-text-dim)] uppercase tracking-wider">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold border-l-2 border-[var(--color-primary)] pl-3'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon(active)}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-dim)]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] space-y-2.5">
          <ThemeToggle variant="full" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-dim)] truncate max-w-[180px]">
              {user.email}
            </span>
          </div>
          <button
            onClick={() => {
              setMobileNavOpen(false);
              signOut();
            }}
            className="w-full py-2 px-3 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:border-[var(--color-expense)] transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN APPLICATION CONTENT AREA (offset by desktop sidebar)
          ========================================================================= */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 mt-14 md:mt-0">
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
