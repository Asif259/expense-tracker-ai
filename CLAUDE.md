# CLAUDE.md — Ledgerly Monorepo

## 1. Project Snapshot
Ledgerly is a privacy-first personal finance and peer-to-peer debt management platform featuring natural language expense parsing via Groq Llama 3.3 70B, dual-layer human confirmation, and fixed-precision financial math. It is organized as an npm monorepo with `apps/web` (Next.js 16 App Router, React 19, Tailwind CSS v4, Chart.js), `apps/api` (NestJS 10, Supabase SDK, Groq SDK), and `packages/shared-types` (Zod schemas). Data storage and authentication are powered by Supabase (PostgreSQL with Row-Level Security, Supabase Auth SSR).

## 2. Commands (Verified)
- **Setup**: `npm install && npm run build:shared` (shared-types must build before apps)
- **Dev Servers** (run in separate terminals):
  - Backend API (`http://localhost:3001`): `npm run start:dev --workspace=api`
  - Frontend Web (`http://localhost:3000`): `npm run dev --workspace=web`
- **Build**:
  - Shared types: `npm run build:shared`
  - Backend API: `npm run build:api`
  - Frontend Web: `npm run build:web`
  - All workspaces: `npm run build:all`
- **Typecheck**: `npm run typecheck` (tsc `--noEmit` across all workspaces)
- **Lint**:
  - Backend API: `npm run lint --workspace=api` (oxlint)
  - Frontend Web: `npm run lint --workspace=web` (eslint)
  - Full repo: `npm run lint`
- **Tests**:
  - Full test suite: `npm test` (Vitest across monorepo)
  - Single test file: `npm test -- <path>` (e.g. `npm test -- tests/charts/chart-aggregation.spec.ts`)
  - API unit tests: `npm test --workspace=api`
  - API E2E tests: `npm run test:e2e --workspace=api`
- **Database & Migrations**:
  - Apply migrations: Execute `supabase/migrations/*.sql` in numerical order via Supabase Dashboard SQL Editor or Supabase CLI.
  - Seed categories: Execute `supabase/seed.sql` in Supabase SQL Editor.

## 3. Architecture & Key Conventions
- **Fixed-Precision Math**: Never use JavaScript floating-point numbers (`number`) for currency. All monetary amounts must be exact 2-decimal strings (`/^\d{1,13}\.\d{2}$/`) validated by `@ledgerly/shared-types` and stored in PostgreSQL as `NUMERIC(15,2)` with `scale(amount) <= 2`.
- **Dual-Layer AI Staging**: Groq AI extractions must NEVER write directly to `transactions`. AI parses text into `ai_draft_transactions` (status `pending`). Transactions are only committed to the ledger when the user explicitly triggers `POST /ai-drafts/:id/confirm`.
- **Per-User RLS & Token Scoping**: NestJS API routes use `SupabaseAuthGuard` to validate the Bearer JWT and pass it to `SupabaseService.getClientForToken(token)`. Never bypass PostgreSQL Row-Level Security using `service_role` for user CRUD.
- **Shared Contracts**: Common types and Zod schemas live in `packages/shared-types/src/schemas/`. Always run `npm run build:shared` after editing shared contracts so consumers receive updated definitions.
- **Git Conventions**: Conventional Commits in lowercase imperative (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`). Development commits target `main` directly per repository conventions.

## 4. Non-Negotiable Rules & Gotchas
- **Zero Secret Leakage**: `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` are backend-only. Never prefix them with `NEXT_PUBLIC_` or expose them to `apps/web`.
- **Never Mutate Historical Migrations**: Existing files in `supabase/migrations/` must never be modified in-place once applied. Add new incremental SQL migration files sequentially (e.g. `0007_*.sql`).
- **Protected Paths**: Never hand-edit `package-lock.json` (use npm CLI), compiled artifacts (`dist/`, `.next/`), or `.agents/` registry unless modifying agent system configs.
- **CSS Import Order**: In `apps/web/src/app/globals.css`, external `@import url(...)` statements must always precede `@import "tailwindcss";` to satisfy CSS specifications and prevent Turbopack build failures.
- **URL Configuration**: `SUPABASE_URL` must be the base project URL without trailing slashes or `/rest/v1`.

## 5. Verification Loop (Definition of Done)
Before marking any task complete, run and verify the following sequence:
1. `npm run build:shared` (if `packages/shared-types` was touched)
2. `npm run typecheck` (must exit code 0 across all workspaces)
3. `npm test` (all unit & integration tests must pass)
4. `npm run lint --workspace=api` (oxlint must pass with 0 errors)
5. `git status -s` (confirm only expected, task-relevant files are modified)

## 6. Multi-Agent Coordination Rules
- **Instruction Precedence**: Current user prompt > project rules (`.agents/rules/`) > `CLAUDE.md`. Root security boundaries (no secret leakage, RLS preservation, exact-decimal money) are immutable.
- **Scope Discipline**: Modify only files strictly relevant to the task. Do not touch or reformat unrelated files. Never modify or delete tests solely to force a pass—fix the implementation code.
- **Stop-and-Ask Triggers**:
  - Destructive database schema changes (dropping tables, columns, or RLS policies).
  - Missing environment variables, credentials, or third-party API keys.
  - Ambiguous financial state transitions (e.g. conflicting loan repayment or settlement rules).

## 7. Reference Docs
- Data Schema & Constraints: `data/schema.md`
- Multi-Tier System Data Flow: `data/data-flow.md`
- Entity Relationships: `data/relationships.md`
- Production Deployment Architecture: `DEPLOYMENT.md`
- Visual Design & Screenshots: `README.md` and `docs/screenshots/`
