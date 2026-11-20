# Plan: Editorial Taste with Refined Color Accents (`editorial-taste-accent-color-enhancement.md`)

## 1. Objective & Vision
Maintain the editorial elegance, typography hierarchy (`Geist` + `Geist Mono`), 5px spacing rhythm, and glass blur/hairlines established during the Editorial Taste redesign, while reintroducing **tasteful, high-contrast, purposeful color accents**:
1. **Semantic Financial Signals**: Clear, instant readability for finances — subtle emerald for income/surplus, refined rose for expenses/deficits, and warm amber for pending/overdue debts.
2. **Editorial Primary Accent**: A refined, understated sapphire/cerulean highlight for primary active states, selected tabs, focus rings, and active brand marks while keeping background and card surfaces quiet and neutral.
3. **Category Badging & Charts**: Distinct, elegant color ramps for category breakdowns and financial graphs without turning into chaotic rainbow gradients.

---

## 2. Architecture & Design Decisions

### A. Color Palette Strategy (Editorial Accents)
- **Neutral Canvas**: Maintain `#EDEDED` (light mode base), `#0A0A0A` (dark mode base), `#FFFFFF` / `#151515` (card surfaces), and `#15151529` / `#EDEDED29` (hairline borders).
- **Primary / Brand Accent**:
  - Light mode: Deep sapphire `#1E3A5F` / `#2B75B6` (cerulean text accent, soft tint `#EBF5FF` for active pill surfaces).
  - Dark mode: Electric sky `#38BDF8` (soft glow tint `rgba(56, 189, 248, 0.12)`).
- **Financial Status Colors**:
  - **Positive / Income**: Emerald `#059669` (light) / `#34D399` (dark) with 10% tinted badge backgrounds.
  - **Negative / Expense**: Rose `#E11D48` (light) / `#FB7185` (dark) with 10% tinted badge backgrounds.
  - **Warning / Pending**: Amber `#D97706` (light) / `#FBBF24` (dark).
- **Rule of Restraint**: 90% neutral canvas, 10% intentional accent color. Accents only appear on meaningful states (data numbers, active indicators, badges), never on large background fields.

### B. Affected Files
1. `apps/web/src/app/globals.css`: Update semantic CSS tokens (`--color-income`, `--color-expense`, `--color-warning`, `--color-primary-text`, `--color-primary-subtle`) while preserving `--font-heading`, `--font-body`, `--font-ui`, 5px rhythm, and `--blur-glass`.
2. `apps/web/src/components/dashboard/kpi-strip.tsx`: Restore clear green/red positive/negative delta indicators and badge highlights.
3. `apps/web/src/components/app-shell.tsx`: Add subtle primary tint for active navigation item and brand dot.
4. `apps/web/src/lib/chart-theme.ts`: Align chart palette with the refined semantic colors for cash flow and categories.

---

## 3. Orchestration Breakdown (Minimum 3 Agents)

### Phase 1: Planning (Current)
- **Agent**: `project-planner`
- **Output**: This blueprint (`editorial-taste-accent-color-enhancement.md`).
- **Gate**: User approval required before Phase 2.

### Phase 2: Implementation (Post-Approval)
- **Agent 1: `frontend-specialist`**
  - Implement the refined color tokens in `globals.css`.
  - Update `kpi-strip.tsx`, `button.tsx`, and `app-shell.tsx` to display semantic tints.
- **Agent 2: `performance-optimizer` / `data-architect`**
  - Audit `chart-theme.ts` for contrast accessibility (WCAG AA) and verify high-DPI chart rendering.
- **Agent 3: `test-engineer`**
  - Execute test suite (`vitest run`).
  - Run TypeScript compile checks (`tsc --noEmit`).
  - Verify zero regressions.

---

## 4. Verification Criteria
- [ ] Financial metrics clearly communicate positive vs negative cash flow at a glance.
- [ ] Active navigation tabs and buttons feel elevated without sacrificing the minimalist editorial look.
- [ ] WCAG AA compliance verified for all colored text on light and dark surfaces.
- [ ] 100% passing tests (`vitest`) and zero TypeScript errors.
