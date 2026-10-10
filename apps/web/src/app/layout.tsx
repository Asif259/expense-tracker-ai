import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { Toaster } from '@/components/toast';

export const metadata: Metadata = {
  title: 'Ledgerly — AI-Powered Expense Tracker',
  description: 'Track expenses effortlessly with natural language AI parsing',
};

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('ledgerly-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = (saved === 'dark' || (!saved && prefersDark)) ? 'dark' : 'light';
      var root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme;
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-150">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

