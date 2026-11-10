'use client';

import React from 'react';
import { formatMoney } from '@/lib/format';

export interface AccessibleTableColumn {
  key: string;
  label: string;
  isCurrency?: boolean;
  align?: 'left' | 'right' | 'center';
}

interface AccessibleChartTableProps<T extends object = Record<string, unknown>> {
  caption: string;
  columns: AccessibleTableColumn[];
  data: T[];
  currency?: string;
  className?: string;
}

function alignClass(align: AccessibleTableColumn['align']) {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

/**
 * The text equivalent of a chart. Rendered inside ChartCard's table view, so it
 * stays a plain table: no extra card, border, or nested container.
 */
export function AccessibleChartTable<T extends object>({
  caption,
  columns,
  data,
  currency = 'BDT',
  className = '',
}: AccessibleChartTableProps<T>) {
  if (data.length === 0) {
    return <p className="text-secondary py-6">No rows to show for this chart.</p>;
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`.trim()}>
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`text-label py-2 pr-3 font-medium text-[var(--color-text-muted)] last:pr-0 ${alignClass(
                  col.align ?? (col.isCurrency ? 'right' : 'left'),
                )}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)]"
            >
              {columns.map((col) => {
                const rawVal = (row as Record<string, unknown>)[col.key];
                const displayVal = col.isCurrency
                  ? formatMoney(Number(rawVal) || 0, currency)
                  : rawVal !== null && rawVal !== undefined
                    ? String(rawVal)
                    : '—';

                return (
                  <td
                    key={col.key}
                    className={`text-label py-2.5 pr-3 last:pr-0 ${
                      col.isCurrency ? 'tabular-nums text-[var(--color-text)]' : 'text-[var(--color-text)]'
                    } ${alignClass(col.align ?? (col.isCurrency ? 'right' : 'left'))}`}
                  >
                    {displayVal}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
