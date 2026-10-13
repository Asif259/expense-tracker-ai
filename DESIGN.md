---
# Ledgerly Design System: Minimalist Analytics (Light + Dark)
version: "3.0"
updated: "2026-10-10"

themes:
  light:
    bg: "#F8FAF9"                 # Soft calm canvas matching homepage
    surface-elevated: "#FFFFFF"   # Sidebar, topbars, elevated panels
    surface: "#FFFFFF"            # Clean white cards, tables
    surface-hover: "#F2F7F5"      # Subtle sage/mint-tinted hover
    border: "#E8EEEB"             # Soft warm sage border matching homepage
    border-hover: "#D5DFDC"       # Focused/hovered borders
    text: "#171A1C"               # Deep charcoal text & neutral financial numbers
    text-muted: "#747B80"         # Muted supporting text & subtitles
    text-dim: "#9CA3AF"           # Tertiary text - timestamps, hints
    primary: "#3CA995"            # Signature Ledgerly SaaS teal accent/CTA
    primary-hover: "#329683"      # Deep teal hover
    primary-contrast: "#FFFFFF"   # Crisp white text on teal CTA
    secondary: "#5452CF"          # Indigo secondary accent
    secondary-hover: "#4543B5"    # Indigo hover
    secondary-bg: "rgba(60, 169, 149, 0.08)"
    accent-blue: "#6CB3F9"        # Soft blue
    accent-amber: "#F5C258"       # Amber
    pale-mint: "#E6F7F1"          # Tinted mint badge
    pale-cyan: "#D7F4EC"          # Tinted aqua badge
    pale-yellow: "#FDF1B2"        # Tinted yellow badge
    income: "#3CA995"             # Indicator direction only (icons/charts)
    income-bg: "#E6F7F1"          # Mint badge background
    expense: "#E11D48"            # Outgoing indicator direction only
    expense-bg: "rgba(225, 29, 72, 0.08)"
    warning: "#F5C258"            # Amber alerts
    warning-bg: "#FDF1B2"
    danger: "#DC2626"
    danger-hover: "#B91C1C"
    card-shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)" # Modest/near-flat shadow

  dark:
    bg: "#0B0F17"                 # Midnight slate canvas matching homepage
    surface-elevated: "#111726"   # Deep slate elevated sidebar & panels
    surface: "#151D30"            # Deep slate cards & panels
    surface-hover: "#1E293B"      # Interactive hover surface
    border: "#1E293B"             # Subtle slate borders matching homepage
    border-hover: "#2E3E57"
    text: "#F1F5F9"               # Slate 100 primary text & neutral financial numbers
    text-muted: "#94A3B8"         # Slate 400 supporting text
    text-dim: "#64748B"           # Slate 500 tertiary hints
    primary: "#3CA995"            # Signature Ledgerly teal accent
    primary-hover: "#45B8A3"      # Luminous teal hover
    primary-contrast: "#FFFFFF"   # High contrast text on teal
    secondary: "#7A78E0"          # Indigo / violet accent
    secondary-hover: "#6A68D5"
    secondary-bg: "rgba(60, 169, 149, 0.12)"
    accent-blue: "#6CB3F9"
    accent-amber: "#F5C258"
    pale-mint: "rgba(60, 169, 149, 0.15)"
    pale-cyan: "rgba(84, 199, 178, 0.12)"
    pale-yellow: "rgba(245, 194, 88, 0.15)"
    income: "#45B8A3"
    income-bg: "rgba(60, 169, 149, 0.15)"
    expense: "#F43F5E"
    expense-bg: "rgba(244, 63, 94, 0.15)"
    warning: "#F5C258"
    warning-bg: "rgba(245, 194, 88, 0.15)"
    danger: "#EF4444"
    danger-hover: "#DC2626"
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
  heading-weight: 700
  body-weight: 400
  stack_strategy:
    dashboard: "Inter for fintech dashboards, forms, and transaction tables"
    marketing: "DM Serif Display (.font-display) for homepage hero and editorial headings"
    financial_figures: "tabular-nums for all currency amounts, metrics, and dates"
  scale:
    page-title:
      size: "clamp(1.5rem, 2.5vw, 1.875rem)" # 24px - 30px
      weight: 700
      line-height: 1.2
      tracking: "-0.025em"
      role: "Main page headings"
    section-title:
      size: "clamp(1.125rem, 1.5vw, 1.25rem)" # 18px - 20px
      weight: 600
      line-height: 1.3
      tracking: "-0.015em"
      role: "Secondary section headings, major card headers"
    card-title:
      size: "0.9375rem" # 15px
      weight: 600
      line-height: 1.35
      role: "Widget & card titles"
    metric:
      size: "clamp(1.5rem, 2vw, 1.875rem)" # 24px - 30px
      weight: 700
      line-height: 1.2
      tracking: "-0.02em"
      numeric: "tabular-nums lining-nums"
      role: "Primary dashboard financial amounts"
    metric-sm:
      size: "1.125rem" # 18px
      weight: 600
      line-height: 1.25
      numeric: "tabular-nums lining-nums"
      role: "Secondary balances, budget totals"
    body:
      size: "0.875rem" # 14px
      weight: 400
      line-height: 1.5
      role: "Standard reading text, inputs"
    secondary:
      size: "0.8125rem" # 13px
      weight: 400
      line-height: 1.45
      role: "Descriptions, secondary table cells"
    label:
      size: "0.75rem" # 12px
      weight: 600
      line-height: 1.4
      tracking: "0.02em"
      role: "Form labels, table headers, metadata badges"
    caption:
      size: "0.6875rem" # 11px
      weight: 400
      line-height: 1.35
      role: "Timestamps, tertiary hints, chart axis subtext"
  unit: "4px"
  scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]

rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
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
    radius: "lg"
    height: "38px"
    font-weight: 600
  input:
    bg: "surface"
    border: "border"
    radius: "lg"
    height: "42px"
---

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

