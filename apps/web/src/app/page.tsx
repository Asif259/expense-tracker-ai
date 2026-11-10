import type { Metadata } from 'next';
import { AuthRedirect } from '@/components/landing/auth-redirect';
import { SiteNav } from '@/components/landing/site-nav';
import { HeroSection } from '@/components/landing/hero-section';
import { ProductOverview } from '@/components/landing/product-overview';
import { FeaturesSection } from '@/components/landing/features-section';
import { FinancialConfidenceSection } from '@/components/landing/confidence-section';
import { AiAssistantShowcase } from '@/components/landing/ai-showcase';
import { HowItWorksSection } from '@/components/landing/how-it-works';
import { FinalCtaSection } from '@/components/landing/final-cta';
import { SiteFooter } from '@/components/landing/site-footer';

const PAGE_TITLE = 'Ledgerly | Make Sense of Your Money';
const PAGE_DESCRIPTION =
  'Track expenses, manage budgets, understand spending patterns, and organize debts with Ledgerly, your personal finance companion.';

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Ledgerly',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: '/Hero-image.webp',
        width: 1536,
        height: 1024,
        alt: 'Ledgerly personal finance dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ['/Hero-image.webp'],
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-[var(--color-primary-subtle)] selection:text-[var(--color-primary-text)]">
      <AuthRedirect />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-[var(--radius-md)] focus:border focus:border-[var(--color-border)] focus:bg-[var(--color-surface)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-text)] focus:shadow-[var(--shadow-md)]"
      >
        Skip to content
      </a>

      <SiteNav />

      <main id="main" className="flex-1">
        <HeroSection />
        <ProductOverview />
        <FeaturesSection />
        <FinancialConfidenceSection />
        <AiAssistantShowcase />
        <HowItWorksSection />
        <FinalCtaSection />
      </main>

      <SiteFooter />
    </div>
  );
}
