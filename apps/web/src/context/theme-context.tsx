'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'ledgerly-theme';

function applyTheme(newTheme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (newTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  // Update meta theme-color tag
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#090f1c' : '#f8fafc');
}

/** Resolve initial theme synchronously so server & client agree on first paint. */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ── External store ────────────────────────────────────────────────────────────
// Listeners are notified synchronously whenever the persisted theme changes.
// Subscribers receive the *current* value immediately on register so stale values never occur.

const listeners = new Set<(val: Theme) => void>();
let currentTheme = getInitialTheme();

function subscribe(cb: (val: Theme) => void) {
  cb(currentTheme); // deliver current value immediately
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function persistTheme(next: Theme) {
  currentTheme = next;
  try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  applyTheme(next);
  for (const l of listeners) l(next);
}

// Listen for OS preference changes when user hasn't explicitly set one
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', (e: MediaQueryListEvent) => {
    if (!localStorage.getItem(STORAGE_KEY)) persistTheme(e.matches ? 'dark' : 'light');
  });
  // Cross-tab sync via storage event
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      const t = e.newValue as Theme | null;
      if (t === 'light' || t === 'dark') persistTheme(t);
    }
  });
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Synchronous read of externally-mutated store via hooks.
  // Server snapshot = 'light'; client snapshot = getInitialTheme(). Match → no hydration warning.
  const externalTheme = useSyncExternalStore(subscribe, () => 'light', getInitialTheme) as Theme;

  // Local mount flag so consumers can guard SSR-vs-client rendering (e.g. chart color reactivity).
  const [mounted] = useState(() => typeof window !== 'undefined');

  // Apply DOM classes/attributes via effect — never call setState inside it.
  useEffect(() => {
    applyTheme(externalTheme);
  }, [externalTheme]);

  const setTheme = (next: Theme) => persistTheme(next);
  const toggleTheme = () => persistTheme(externalTheme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme: externalTheme, setTheme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
