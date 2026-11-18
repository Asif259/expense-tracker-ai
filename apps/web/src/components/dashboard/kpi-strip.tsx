import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui';
import type { Delta } from '@/lib/dashboard-metrics';

export interface KpiTile {
  label: string;
  /** Formatted value, or null when it can't be stated honestly (shown as "—"). */
  value: string | null;
  /** Colour the value as a problem (e.g. a negative net). */
  bad?: boolean;
  icon?: ReactNode;
  /** Explanation lives in the tooltip, never on a sub-line. */
  title?: string;
  delta?: Delta | null;
  prevLabel?: string;
  /** Replaces the delta line, e.g. a warm "overdue" flag or compact facts. */
  note?: ReactNode;
}

/** One card of 2–4 report-only tiles divided by hairlines. */
export function KpiStrip({
  tiles,
  baseline,
  loading,
  label,
}: {
  tiles: KpiTile[];
  baseline: string;
  loading: boolean;
  label: string;
}) {
  return (
    <section
      aria-label={label}
      className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] lg:grid-cols-4"
    >
      {tiles.map((t, i) => (
        <div
          key={t.label}
          title={t.title}
          className={`min-w-0 border-[var(--color-border)] p-4 sm:p-5 ${i % 2 === 1 ? 'border-l' : ''} ${
            i >= 2 ? 'border-t lg:border-t-0' : ''
          } ${i === 2 ? 'lg:border-l' : ''}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-[var(--color-text-muted)]">{t.label}</span>
            {t.icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] [&>svg]:h-4 [&>svg]:w-4">
                {t.icon}
              </span>
            )}
          </div>
          <div
            className={`mt-2 break-all text-[22px] font-semibold leading-tight tracking-[-0.03em] tabular-nums sm:text-[28px] ${
              t.bad && t.value ? 'text-[var(--color-expense)]' : 'text-[var(--color-text)]'
            }`}
          >
            {loading ? <Skeleton className="w-28" style={{ height: 30 }} /> : (t.value ?? '—')}
          </div>
          <div className="mt-1.5 min-h-5 text-xs">
            {loading ? (
              <Skeleton className="w-24" style={{ height: 12 }} />
            ) : t.note ? (
              t.note
            ) : t.delta ? (
              <DeltaBadge d={t.delta} prevLabel={t.prevLabel ?? ''} baseline={baseline} />
            ) : (
              <span className="text-[var(--color-text-subtle)]">—</span>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export function DeltaBadge({ d, prevLabel, baseline }: { d: Delta; prevLabel: string; baseline: string }) {
  if (d.kind === 'none') return null;
  if (d.kind === 'was') {
    return (
      <span className="text-[var(--color-text-muted)]" title={`${baseline}: ${prevLabel}`}>
        was {prevLabel}
      </span>
    );
  }
  const color =
    d.tone === 'good'
      ? 'text-[var(--color-income)]'
      : d.tone === 'bad'
        ? 'text-[var(--color-expense)]'
        : 'text-[var(--color-text-muted)]';
  const arrow = d.pct > 0 ? '▲' : d.pct < 0 ? '▼' : '±';
  const pct = Math.abs(d.pct) > 999 ? '999+' : String(Math.abs(d.pct));
  return (
    <span className="tabular-nums" title={`${baseline}: ${prevLabel}`}>
      <span className={`font-medium ${color}`}>
        {arrow} {pct}%
      </span>{' '}
      <span className="text-[var(--color-text-muted)]">vs {baseline}</span>
    </span>
  );
}
