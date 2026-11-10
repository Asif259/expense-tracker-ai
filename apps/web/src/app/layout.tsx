import type { Metadata, Viewport } from 'next';
import { Inter, DM_Serif_Display, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { Toaster } from '@/components/toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
});

// Bengali UI strings (voice input examples, category names) fall back to this
// instead of a random system font. Preload is off: Latin pages never fetch it.
const bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600'],
  variable: '--font-bengali',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'Ledgerly — Expense tracker',
    template: '%s · Ledgerly',
  },
  description:
    'Record daily income and expenses, review spending by category, and keep track of money lent or borrowed. Your records stay private to your account.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f9f8' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f17' },
  ],
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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${inter.variable} ${dmSerif.variable} ${bengali.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-150"
      >
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

