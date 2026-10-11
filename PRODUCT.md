# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are individuals, freelancers, and mindful savers tracking personal cash flow, daily living expenses, and shared IOUs or debts with friends. They value financial clarity and privacy, preferring to maintain direct control over their records without linking bank accounts or granting automated scraping credentials.

## Product Purpose

Ledgerly turns daily financial records into calm, dependable clarity. It eliminates the friction and anxiety of personal money management through fast natural language capture, dual-layer draft reviews, visual cash flow analytics, and dedicated debt settlement tracking. Success means knowing exactly where money goes, staying within planned budgets, and keeping mutual financial commitments transparent.

## Positioning

Ledgerly differentiates itself through safe, non-invasive financial tooling:
- **Dual-Layer AI Staging**: Natural language entries are parsed by Groq Llama 3 into pending drafts (`ai_draft_transactions`). Zero direct database mutations occur without explicit human confirmation.
- **Fixed-Precision Math**: Transactions utilize exact decimal strings (up to 13 integer digits, 2 decimals) to prevent IEEE-754 floating-point drift.
- **Privacy-First Database Isolation**: Built on Supabase PostgreSQL with strict Row-Level Security (RLS) policies per user tenant, completely avoiding third-party bank credential harvesting.
- **Integrated Loan Ledger**: Tracks money lent to and borrowed from friends alongside daily living expenses.

## Operating Context

A responsive web application accessible across desktop, tablet, and mobile browsers:
- **Daily Quick Entry**: Rapid expense logging via natural language prompt or concise manual forms.
- **Staging Review**: Inspecting AI-categorized drafts, confirming amounts, tags, and accounts before committing.
- **Monthly Budget Review**: Monitoring category limits, cash flow balances, and burn rate via visual charts.
- **Mutual Debt Settlement**: Recording partial repayments and marking friend-to-friend loans as settled.

## Capabilities and Constraints

- **Confirmed Functionality**:
  - Public marketing & onboarding landing page (`/`).
  - Secure authentication via Supabase Auth (`/login`, `/login?mode=signup`).
  - Natural Language AI Entry with Groq inference (`/ai-entry`).
  - Transaction manager with search, category filtering, and edit/delete (`/transactions`, `/transactions/new`, `/transactions/[id]/edit`).
  - Interactive visual analytics including cash flow charts and category doughnuts (`/dashboard`).
  - Debt & Loans manager with repayment logs (`/loans`, `/loans/new`, `/loans/[id]`).
- **Technical Constraints**:
  - Next.js 16 App Router with Turbopack, React 19, and Tailwind CSS v4.
  - System font stack with Bengali fallback (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Bengali", sans-serif`).
  - Editorial serif headings (`"New York", Charter, Georgia, Cambria, "Times New Roman", Times, serif`).
  - Strict absence of heavy animation runtimes (no Framer Motion).
  - Multi-tenant database isolation enforced at PostgreSQL RLS layer.

## Brand Commitments

- **Name**: Ledgerly
- **Visual Personality**: Soft Modern SaaS—calm, editorial, trustworthy, and approachable.
- **Color Language**: Soft white/charcoal canvas, pale mint and soft aqua background regions, primary teal-green accents (`#3CA995`), and dark teal interactive elements.
- **Typography**: Large editorial serif headlines paired with clean, readable sans-serif interface text and tabular numerals for financial figures.
- **Tone of Voice**: Clear, encouraging, transparent, respectful; never lecturing, preachy, or corporate.

## Evidence on Hand

- Fully functional Next.js App Router workspace at `apps/web`.
- Shared type validation package at `packages/shared-types` (`amount.schema`, `loan.schema`, `date.schema`).
- Real database migration and schema definitions under `supabase/migrations`.
- Passing Vitest unit test suite covering precision math, loans, date validations, and chart aggregations.

## Product Principles

1. **Zero Direct AI Mutation**: AI is an intelligent assistant that drafts entries; the user remains the sole authority who confirms records into the ledger.
2. **Fixed-Precision Integrity**: Financial figures are never converted to standard binary floats; monetary calculations must remain deterministic and exact.
3. **Privacy by Design**: User financial data is isolated at the database level with PostgreSQL RLS. No third-party bank scraping or account linking required.
4. **Calm Financial Visibility**: Present financial truths with scannable visual charts, clear hierarchy, and gentle color contrast to replace anxiety with confidence.

## Accessibility & Inclusion

- Compliance with WCAG 2.1 AA standards for control contrast, interactive touch targets (minimum 44x44px), and keyboard focus rings.
- Tabular numerals (`font-variant-numeric: tabular-nums`) for currency alignment across tables and metric cards.
- Native script rendering support for Bengali (`Noto Sans Bengali`) alongside standard Latin system typography.
- Full light and dark theme persistence with high-contrast surfaces in both modes.
