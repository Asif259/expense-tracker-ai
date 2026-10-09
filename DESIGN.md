---
# Ledgerly Design System
version: "1.0"
updated: "2026-10-09"

palette:
  bg: "#0a0a0f"
  surface: "#12121a"
  surface-hover: "#1a1a26"
  border: "#1e1e2e"
  border-hover: "#2a2a3e"
  text: "#e4e4ef"
  text-muted: "#8888a4"
  text-dim: "#5a5a72"
  primary: "#6366f1"       # Indigo-500 — trust, precision
  primary-hover: "#818cf8"
  income: "#34d399"        # Emerald — positive cash flow
  income-bg: "rgba(52, 211, 153, 0.08)"
  expense: "#f87171"       # Red-400 — outgoing money
  expense-bg: "rgba(248, 113, 113, 0.08)"
  warning: "#fbbf24"
  danger: "#ef4444"

typography:
  family: "'Inter', system-ui, -apple-system, sans-serif"
  heading-weight: 700
  body-weight: 400
  mono: "'JetBrains Mono', monospace"

spacing:
  unit: "4px"
  scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]

rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"

components:
  card:
    bg: "surface"
    border: "border"
    radius: "lg"
    padding: "6"
  button:
    radius: "md"
    height: "36px"
    font-weight: 500
  input:
    bg: "bg"
    border: "border"
    radius: "md"
    height: "40px"
---

# Design Rationale

## Direction
Ledgerly targets a premium dark financial dashboard aesthetic. The deep near-black background
conveys seriousness about money. Indigo as the accent provides trust without being the standard
blue seen in banking apps.

## Color Logic
- **Income/Expense**: Emerald green for incoming money, soft red for outgoing. These colors are
  semantically universal for financial apps.
- **No purple**: Avoided intentionally. Indigo sits close but reads as professional, not playful.
- **Muted text hierarchy**: Three text levels (bright, muted, dim) create depth without noise.

## Typography
Inter for its exceptional numeric legibility — critical for a finance app displaying monetary
amounts. Tabular nums enabled where amounts are listed.

## Layout
Single-column max-width 7xl container. Cards with subtle borders rather than shadows for the
dark theme. Responsive breakpoints at md (768px) for nav collapse.

## Interaction
Minimal animation: color transitions on hover (150ms), loading spinners. No decorative
motion. Financial tools need to feel fast and stable.
