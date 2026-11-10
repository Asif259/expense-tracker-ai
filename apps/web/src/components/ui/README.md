# Ledgerly UI primitives

A small, unopinionated layer that keeps the product visually consistent. Use
these instead of hand-rolling classes on every page.

## Tokens

All tokens are CSS custom properties in `src/app/globals.css`, defined for both
the light and dark themes. Tailwind utilities read them through the
`@theme inline` bridge.

| Group | Tokens | Use |
| --- | --- | --- |
| Surfaces | `--color-bg`, `--color-surface`, `--color-surface-elevated`, `--color-surface-hover`, `--color-surface-sunken` | Page canvas, cards, sidebar, hover/selected, inset areas |
| Lines | `--color-border`, `--color-border-strong`, `--color-border-hover` | Hairlines, control borders, hover |
| Text | `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-text-subtle` | Heading, label, supporting, metadata |
| Accent | `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-primary-subtle`, `--color-primary-text` | Actions, active states, focus, one meaningful highlight |
| State | `--color-income`, `--color-expense`, `--color-warning`, `--color-danger` (+ `-subtle`) | Direction indicators, validation, destructive actions |
| Elevation | `--shadow-xs/sm/md/lg` | Floating layers only (menus, dialogs, toasts) |
| Radius | `--radius-sm/md/lg/xl/2xl/full` | Controls `md`, cards `xl`, overlays `2xl` |
| Motion | `--duration-fast/base/slow`, `--ease-standard`, `--ease-out` | 120–240ms interactions |

Rules of thumb:

- Borders separate content. Shadows are for things that float.
- One accent per view. Never use state colors as decoration.
- Financial figures stay neutral; direction is communicated by sign + icon + label.
- 12px is the smallest readable text size; 11px is limited to compact badges and eyebrows.

## Typography classes

`text-page-title`, `text-section-title`, `text-card-title`, `text-metric-xl`,
`text-metric`, `text-metric-sm`, `text-body`, `text-secondary`, `text-label`,
`text-caption`, `text-eyebrow`, `tabular-nums`.

## Components

```tsx
import {
  Button, ButtonLink, IconButton,
  Input, Select, Textarea, Field,
  Badge, Alert, EmptyState, ErrorState, Skeleton, Spinner,
  PageHeader, Card, Section, Metric, StatStrip,
  SegmentedControl,
} from '@/components/ui';
```

- `Button` – `variant: primary | secondary | ghost | danger`, `size: sm | md | lg`,
  `loading`, `leadingIcon`, `trailingIcon`. Defaults to `type="button"`.
  Use exactly one `primary` per action group.
- `ButtonLink` – same visual language for navigation.
- `IconButton` – square icon-only control; `label` is required.
- `Field` – label + control + hint/error and `aria-describedby`/`aria-invalid`
  wiring. Give the control the same `id` you pass to `Field`.
- `Alert` – inline `info | success | warning | danger` message.
- `EmptyState` / `ErrorState` – always explain the situation and offer a next step.
- `Skeleton` – layout-preserving loading placeholder; `lines` for text blocks.
- `PageHeader` – page title, description, meta, actions.
- `Card` – bordered surface for real grouping only (never for every section).
- `Section` – labelled section without a container; prefers whitespace/hairlines.
- `Metric` / `StatStrip` – hierarchy for numeric summaries; use one dominant
  metric per screen and subordinate the rest.
- `SegmentedControl` – pressed-button semantics for view/filter switches.

## Motion

Prefer `transition-colors` / border / opacity with `var(--duration-fast)`.
Global `prefers-reduced-motion` handling exists in `globals.css`. Do not add
scale, bounce, ping, or decorative keyframes.

## Maintenance

If a page needs a one-off layout, compose with Tailwind + tokens rather than
forking a primitive. If a token is missing, add it to `globals.css` for both
themes instead of hardcoding a hex value.
