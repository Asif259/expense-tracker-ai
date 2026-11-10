---
# Ledgerly Design System: Minimalist Analytics (Light + Dark)
version: "4.0"
updated: "2026-11-10"

themes:
  # Implemented in apps/web/src/app/globals.css — that file is the source of truth.
  light:
    bg: "#F7F9F8"
    surface-elevated: "#FFFFFF"
    surface: "#FFFFFF"
    surface-hover: "#F1F5F3"
    surface-sunken: "#F2F6F4"
    border: "#E1E7E4"
    border-strong: "#C8D2CD"
    border-hover: "#B4C1BB"
    text: "#16201D"
    text-secondary: "#4E5853"
    text-muted: "#5A6560"
    text-subtle: "#626D68"
    primary: "#1F7F6E"            # Solid CTAs, active states, focus (4.86:1 with white)
    primary-hover: "#1A6D5F"
    primary-active: "#14594D"
    primary-contrast: "#FFFFFF"
    primary-subtle: "#E3F3EE"
    primary-text: "#14695B"
    brand: "#3CA995"             # Graphics only (logo, charts) — not for text on white
    brand-soft: "#D7F4EC"
    income: "#0F7A5C"
    income-subtle: "#E0F3EA"
    expense: "#C81E4B"
    expense-subtle: "#FBE7EC"
    warning: "#8A5A00"
    warning-subtle: "#FBF0D4"
    danger: "#C0272D"
    danger-hover: "#A21D23"
    danger-contrast: "#FFFFFF"
    focus: "#1F7F6E"
    scrim: "rgba(11, 22, 19, 0.52)"
    shadow-xs: "0 1px 2px rgba(15, 23, 20, 0.04)"
    shadow-sm: "0 1px 3px rgba(15, 23, 20, 0.06), 0 1px 2px rgba(15, 23, 20, 0.04)"
    shadow-md: "0 8px 24px -14px rgba(15, 23, 20, 0.22)"
    shadow-lg: "0 18px 48px -24px rgba(15, 23, 20, 0.3)"
    card-shadow: "none"          # Cards use a hairline border, not elevation

  dark:
    bg: "#0B0F17"
    surface-elevated: "#111726"
    surface: "#151D30"
    surface-hover: "#1E293B"
    surface-sunken: "#0F1622"
    border: "#263449"
    border-strong: "#34455E"
    border-hover: "#40536F"
    text: "#EDF2F7"
    text-secondary: "#C3CFDD"
    text-muted: "#A3B1C2"
    text-subtle: "#8B9BAE"
    primary: "#45B8A3"            # Luminous teal CTA with dark text (6.33:1)
    primary-hover: "#52C7B2"
    primary-active: "#3AA48F"
    primary-contrast: "#05231E"
    primary-subtle: "rgba(69, 184, 163, 0.14)"
    primary-text: "#7FD6C4"
    brand: "#45B8A3"
    brand-soft: "rgba(69, 184, 163, 0.18)"
    income: "#4CC79F"
    income-subtle: "rgba(76, 199, 159, 0.15)"
    expense: "#FF7A93"
    expense-subtle: "rgba(255, 122, 147, 0.14)"
    warning: "#F5C258"
    warning-subtle: "rgba(245, 194, 88, 0.14)"
    danger: "#FF8A8A"
    danger-hover: "#FFA3A3"
    danger-contrast: "#2A0507"
    focus: "#7FD6C4"
    scrim: "rgba(2, 6, 12, 0.66)"
    shadow-xs: "0 1px 2px rgba(0, 0, 0, 0.4)"
    shadow-sm: "0 1px 3px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.35)"
    shadow-md: "0 10px 28px -16px rgba(0, 0, 0, 0.7)"
    shadow-lg: "0 22px 56px -26px rgba(0, 0, 0, 0.8)"
    card-shadow: "none"

rules:
  financial_numbers:
    rule: "Never use colorful text for financial amounts, metric values, counts, or percentage figures."
    numeric_variant: "font-variant-numeric: tabular-nums lining-nums; (Inter primary, NOT monospace)"
    light: "Render in #111111 (var(--color-text))"
    dark: "Render in #F4F4F4 (var(--color-text))"
    direction_indicators: "Use small arrows, icons, lightly tinted badges (pale-mint, pale-cyan, pale-yellow), or thin chart lines"
    badge_text: "Keep text inside metric badges neutral where readable contrast permits"
    alignment: "Right-align monetary columns in tables with consistent currency symbol positioning"

typography:
  family: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  serif: "var(--font-dm-serif), 'DM Serif Display', Georgia, Cambria, 'Times New Roman', Times, serif"
  display: "var(--font-dm-serif), 'DM Serif Display', Georgia, Cambria, 'Times New Roman', Times, serif"
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
  heading-weight: 600
  body-weight: 400
  stack_strategy:
    dashboard: "Inter for fintech dashboards, forms, and transaction tables"
    marketing: "DM Serif Display (.font-display) for homepage hero and editorial headings"
    financial_figures: "tabular-nums for all currency amounts, metrics, and dates"
  scale:
    page-title:
      size: "clamp(1.5rem, 2.2vw, 1.875rem)" # 24px - 30px
      weight: 600
      line-height: 1.18
      tracking: "-0.022em"
      role: "Page headings (.text-page-title)"
    section-title:
      size: "1.0625rem" # 17px
      weight: 600
      line-height: 1.3
      tracking: "-0.012em"
      role: "Section headings (.text-section-title)"
    card-title:
      size: "0.875rem" # 14px
      weight: 600
      line-height: 1.35
      role: "Card and widget titles (.text-card-title)"
    metric-xl:
      size: "clamp(1.75rem, 2.4vw, 2.25rem)" # 28px - 36px
      weight: 600
      line-height: 1.1
      tracking: "-0.025em"
      numeric: "tabular-nums lining-nums"
      role: "The single dominant number on a screen (.text-metric-xl)"
    metric:
      size: "1.375rem" # 22px
      weight: 600
      line-height: 1.2
      tracking: "-0.02em"
      numeric: "tabular-nums lining-nums"
      role: "Supporting metrics (.text-metric)"
    metric-sm:
      size: "1.0625rem" # 17px
      weight: 600
      line-height: 1.25
      numeric: "tabular-nums lining-nums"
      role: "Secondary balances, inline totals (.text-metric-sm)"
    body:
      size: "0.875rem" # 14px
      weight: 400
      line-height: 1.55
      role: "Reading text, inputs (.text-body)"
    secondary:
      size: "0.8125rem" # 13px
      weight: 400
      line-height: 1.5
      role: "Descriptions, supporting cells (.text-secondary)"
    label:
      size: "0.75rem" # 12px
      weight: 500
      line-height: 1.4
      role: "Field labels, compact metadata (.text-label)"
    caption:
      size: "0.75rem" # 12px
      weight: 400
      line-height: 1.45
      role: "Hints and timestamps (.text-caption) — 12px is the floor for real text"
    eyebrow:
      size: "0.6875rem" # 11px
      weight: 600
      tracking: "0.07em"
      role: "Rare compact group labels only (.text-eyebrow)"
  unit: "4px"
  space-scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]

rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"    # controls: buttons, inputs, badges
  lg: "10px"
  xl: "12px"   # cards, panels, dialogs on mobile
  2xl: "16px"  # sheets/hero previews only
  full: "9999px"

components:
  sidebar:
    width: "256px"
    bg: "surface-elevated"
    border: "border"
  card:
    bg: "surface"
    border: "border"
    radius: "xl"
    padding: "6"
  button:
    radius: "md"        # 8px, sentence-case labels, no uppercase
    height: "36px / 44px (mobile)"
    font-weight: 500
  input:
    bg: "surface"
    border: "border-strong"
    radius: "md"
    height: "40px"
---

> **Implementation note (2026-11-10).** The tokens above are mirrored in
> `apps/web/src/app/globals.css` (light + dark) and consumed through the
> `@theme inline` Tailwind bridge. Reusable components live in
> `apps/web/src/components/ui/` — see its README for the component contract.
> The previous indigo/purple secondary accent has been retired: the AI
> features now use the single teal accent. The old "light beige" rationale
> below is kept as history; the current values in this file and
> `globals.css` take precedence.

# Design Rationale: Dual-Theme Architecture

## Light Mode Rationale
Following clean, spacious dashboard aesthetics (Creative Tim reference model):
- `#F5F5F5` canvas with crisp `#FFFFFF` cards and sidebar.
- High-contrast `#292929` body text with `#595959` muted labels.
- Restrained teal-blue `#159EAC` with crisp white button text.
- Subtle card borders `#E2E4E7` paired with soft micro-shadows (`--shadow-card`).
- Balanced emerald `#059669` and rose `#E11D48` metrics.

## Dark Mode Rationale
Following sleek financial management dark dashboards:
- `#0B0B0B` deep canvas with `#191919` sidebar and `#222222` charcoal cards.
- High-contrast `#F4F4F4` text and `#A3A3A3` muted labels.
- `#00D6C8` primary teal accent paired with `#050505` black button text (12:1 WCAG AAA).
- `#A970F5` purple accent selectively for AI Smart Entry, badges, and secondary indicators.
- Border-delineated surfaces (`#363636`) without artificial glow.

## Theme Switching Mechanics
- Pure CSS Custom Properties dynamically mapped to `:root, [data-theme="light"], .light` and `[data-theme="dark"], .dark`.
- Synchronized client-side state via `ThemeContext`, persistent in `localStorage`.
- Zero-FOUC (Flash of Unstyled Content) inline `<head>` script reading stored preference or OS `prefers-color-scheme`.
- Accessible Sun/Moon toggle with tooltip and `aria-label` in persistent sidebar footer and mobile drawer.

---

# Global Responsive Table Design Pattern: System Specification

All data tables across Ledgerly adhere to the **"Rank by use, not position"** responsive table architecture.

## 1. Column Semantic Classification
Every column is classified into one of 5 distinct semantic roles:
- **IDENTITY** (Priority 1): Who or what is this row? (e.g. Category, Tenant, Person). Left-aligned.
- **VALUE** (Priority 2): Primary numeric/currency information (e.g. Transaction Amount, Rent, Due). Reserved right-aligned slot in tabular-nums; **never truncated**.
- **STATE** (Priority 3): Current lifecycle condition (e.g. ● Expense, ● Income, ● Overdue, ● Paid). Compact dot indicator placed near identity on Line 2.
- **DETAIL** (Priority 4–7): Supporting metadata (e.g. Dates, References, Descriptions). Ambiguous values must be labeled ("Due Sep 10", "Ref: #1234").
- **ACTION** (Priority 8): Operations (Edit, Delete, Pay). Grouped in accessible 44×44px touch targets behind kebab `⋮` or primary CTA.

## 2. Desktop vs Mobile Dual-View Hierarchy
- **Desktop (Breadth)**: Standard semantic `<table>` showing all columns horizontally when viewport/container space permits.
- **Mobile (Priority & Density)**: Two clear visual lines per row:
  - **Line 1**: `[Primary Identity]` (Left, truncate if long) ------------ `[Primary Value]` (Right, tabular-nums, never truncated)
  - **Line 2**: `● [State] · [Supporting Detail]` (Left) ---------------- `[⋮ Menu / Primary CTA]` (Right, min 44×44px)
- **Expanded Drawer (Completeness)**: "Hidden isn't deleted." Tapping any row opens an accessible bottom sheet drawer or accordion revealing 100% of the underlying record details with explicit semantic labels and full action buttons.

## 3. Container-Aware Breakpoints ("The Table Owns the Breakpoint")
- Tables use CSS Container Queries (`container-type: inline-size`) with `.responsive-table-container`.
- Layout switches based on container width rather than arbitrary window viewport widths, ensuring seamless responsiveness when placed in side drawers, dashboards, split layouts, or dialogs:
  - `sm`: <= 600px
  - `md`: <= 760px (Standard Default)
  - `lg`: <= 900px
  - `xl`: <= 1040px
- Preserves sorting on mobile via a dedicated `[Sort: Date ↓]` trigger button when table headers are compressed.

