---
# Ledgerly Design System: Minimalist Analytics (Light + Dark)
version: "3.0"
updated: "2026-10-10"

themes:
  light:
    bg: "#F9FBFC"                 # Near-white canvas from reference screenshot
    surface-elevated: "#FFFFFF"   # Sidebar, topbars, elevated panels
    surface: "#FFFFFF"            # Clean white cards, tables
    surface-hover: "#F3F4F7"      # Subtle hover surface
    border: "#EDEFF3"             # Thin, subtle gray borders
    border-hover: "#DDE0E6"       # Focused/hovered borders
    text: "#111111"               # Primary text & neutral financial numbers
    text-muted: "#6E7179"         # Muted gray supporting text & subtitles
    text-dim: "#9CA3AF"           # Tertiary text - timestamps, hints
    primary: "#6DD0A1"            # Mint green accent/primary CTA
    primary-hover: "#5BBF90"      # Mint green hover
    primary-contrast: "#111111"   # High-contrast text on mint CTA
    secondary: "#5452CF"          # Indigo secondary accent
    secondary-hover: "#4543B5"    # Indigo hover
    secondary-bg: "rgba(84, 82, 207, 0.08)"
    accent-blue: "#6CB3F9"        # Soft blue
    accent-amber: "#F5C258"       # Amber
    pale-mint: "#CEF1E4"          # Lightly tinted mint badge
    pale-cyan: "#D3FDFE"          # Lightly tinted cyan badge
    pale-yellow: "#FDF1B2"        # Lightly tinted yellow badge
    income: "#6DD0A1"             # Indicator direction only (icons/charts)
    income-bg: "#CEF1E4"          # Mint badge background
    expense: "#E11D48"            # Outgoing indicator direction only
    expense-bg: "rgba(225, 29, 72, 0.08)"
    warning: "#F5C258"            # Amber alerts
    warning-bg: "#FDF1B2"
    danger: "#DC2626"
    danger-hover: "#B91C1C"
    card-shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)" # Modest/near-flat shadow

  dark:
    bg: "#0B0B0B"                 # Dark canvas
    surface-elevated: "#161618"   # Dark sidebar & panels
    surface: "#1C1C1F"            # Dark cards & panels
    surface-hover: "#242428"      # Interactive hover
    border: "#2E2E32"             # Subtle dark borders
    border-hover: "#3E3E44"
    text: "#F4F4F4"               # Primary text & neutral financial numbers
    text-muted: "#9E9EA4"         # Muted supporting text
    text-dim: "#68686E"
    primary: "#6DD0A1"            # Mint green accent
    primary-hover: "#5BBF90"
    primary-contrast: "#0B0B0B"   # Deep dark text on mint
    secondary: "#7A78E0"          # Indigo / violet accent
    secondary-hover: "#6A68D5"
    secondary-bg: "rgba(122, 120, 224, 0.12)"
    accent-blue: "#6CB3F9"
    accent-amber: "#F5C258"
    pale-mint: "rgba(109, 208, 161, 0.15)"
    pale-cyan: "rgba(108, 179, 249, 0.15)"
    pale-yellow: "rgba(245, 194, 88, 0.15)"
    income: "#6DD0A1"
    income-bg: "rgba(109, 208, 161, 0.15)"
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
  family: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  mono: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
  heading-weight: 700
  body-weight: 400
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
