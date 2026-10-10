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

export function AccessibleChartTable<T extends object>({
  caption,
  columns,
  data,
  currency = 'BDT',
  className = '',
}: AccessibleChartTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
        No tabular data available to display.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`py-2 px-3 font-semibold text-[var(--color-text-muted)] ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-[var(--color-surface-hover)] transition-colors">
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
                    className={`py-2.5 px-3 ${col.isCurrency ? 'tabular-nums font-medium text-[var(--color-text)]' : 'text-[var(--color-text)]'} ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
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
