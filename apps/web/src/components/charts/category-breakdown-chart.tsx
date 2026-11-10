'use client';

import React, { useMemo, useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';
import '@/lib/chart-registry';
import { useTheme } from '@/context/theme-context';
import { getChartPalette, CHART_FONT_FAMILY } from '@/lib/chart-theme';
import { CategoryBreakdownPoint } from '@/lib/chart-aggregation';
import { formatMoney } from '@/lib/format';
import { ChartCard } from './chart-card';
import { AccessibleChartTable } from './accessible-chart-table';
import { SegmentedControl } from '@/components/ui';

interface CategoryBreakdownChartProps {
  data: CategoryBreakdownPoint[];
  currency: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function CategoryBreakdownChart({
  data,
  currency,
  loading = false,
  error = null,
  onRetry,
  className = '',
}: CategoryBreakdownChartProps) {
  const { theme } = useTheme();
  const palette = getChartPalette(theme);
  const [chartMode, setChartMode] = useState<'doughnut' | 'bar'>('doughnut');

  const totalExpense = useMemo(() => {
    return data.reduce((sum, d) => sum + d.amount, 0);
  }, [data]);

  const colors = useMemo(() => {
    return data.map((_, idx) => palette.categories[idx % palette.categories.length]);
  }, [data, palette]);

  const doughnutData = useMemo(() => {
    return {
      labels: data.map((d) => d.categoryName),
      datasets: [
        {
          data: data.map((d) => d.amount),
          backgroundColor: colors,
          borderColor: palette.cardBg,
          borderWidth: 2,
          hoverOffset: 3,
        },
      ],
    };
  }, [data, colors, palette]);

  const horizontalBarData = useMemo(() => {
    return {
      labels: data.map((d) => d.categoryName),
      datasets: [
        {
          label: 'Spent',
          data: data.map((d) => d.amount),
          backgroundColor: colors,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [data, colors]);

  const doughnutOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: palette.cardBg,
          titleColor: palette.textPrimary,
          bodyColor: palette.textPrimary,
          borderColor: palette.borderColor,
          borderWidth: 1,
          padding: 10,
          titleFont: { family: CHART_FONT_FAMILY, size: 12, weight: 600 },
          bodyFont: { family: CHART_FONT_FAMILY, size: 12, weight: 600 },
          callbacks: {
            label: (context: TooltipItem<'doughnut'>) => {
              const val = Number(context.parsed) || 0;
              const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
              return ` ${context.label}: ${formatMoney(val, currency)} (${pct}%)`;
            },
          },
        },
      },
      cutout: '72%',
    };
  }, [palette, totalExpense, currency]);

  const barOptions = useMemo(() => {
    return {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.cardBg,
          titleColor: palette.textPrimary,
          bodyColor: palette.textPrimary,
          borderColor: palette.borderColor,
          borderWidth: 1,
          padding: 10,
          titleFont: { family: CHART_FONT_FAMILY, size: 12, weight: 600 },
          bodyFont: { family: CHART_FONT_FAMILY, size: 12, weight: 600 },
          callbacks: {
            label: (context: TooltipItem<'bar'>) => {
              const val = Number(context.parsed.x) || 0;
              const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
              return ` ${context.label}: ${formatMoney(val, currency)} (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: palette.gridColor },
          ticks: {
            color: palette.textMuted,
            font: { family: CHART_FONT_FAMILY, size: 11, weight: 500 },
            callback: (val: string | number) => {
              const num = Number(val);
              return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : num;
            },
          },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: palette.textMuted,
            font: { family: CHART_FONT_FAMILY, size: 11 },
          },
          border: { color: palette.borderColor },
        },
      },
    };
  }, [palette, totalExpense, currency]);

  const tableColumns = [
    { key: 'categoryName', label: 'Category' },
    { key: 'amount', label: 'Spent', isCurrency: true, align: 'right' as const },
    { key: 'percentage', label: 'Share', align: 'center' as const },
    { key: 'count', label: 'Entries', align: 'center' as const },
  ];

  return (
    <ChartCard
      title="Expense categories"
      subtitle="Where your spending went"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No categories yet"
      emptyDescription={`No expenses recorded in ${currency} yet. Add a transaction to see where your money goes.`}
      emptyActionHref="/transactions/new"
      emptyActionLabel="Add a transaction"
      accessibleTableView={
        <AccessibleChartTable
          caption={`Expense distribution by category in ${currency}`}
          columns={tableColumns}
          data={data}
          currency={currency}
        />
      }
      className={className}
      heightClass="h-auto min-h-[320px]"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-secondary">
            Total{' '}
            <span className="text-card-title ml-0.5 tabular-nums">
              {formatMoney(totalExpense, currency)}
            </span>
          </span>

          <SegmentedControl
            label="Category chart type"
            size="sm"
            value={chartMode}
            onChange={setChartMode}
            options={[
              { value: 'doughnut', label: 'Share' },
              { value: 'bar', label: 'Bars' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
          <div className="relative flex h-48 items-center justify-center md:col-span-5">
            {chartMode === 'doughnut' ? (
              <>
                <div
                  className="h-full w-full"
                  role="img"
                  aria-label={`Expense share by category doughnut chart in ${currency}`}
                >
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-label text-[var(--color-text-muted)]">
                    {data.length} categories
                  </span>
                  <span className="text-metric-sm tabular-nums">
                    {formatMoney(totalExpense, currency)}
                  </span>
                </div>
              </>
            ) : (
              <div
                className="h-full w-full"
                role="img"
                aria-label={`Expense share by category bar chart in ${currency}`}
              >
                <Bar data={horizontalBarData} options={barOptions} />
              </div>
            )}
          </div>

          {/* Text legend doubles as the accessible summary of the chart */}
          <div className="max-h-48 space-y-0 divide-y divide-[var(--color-border)] overflow-y-auto pr-1 md:col-span-7">
            {data.map((cat, idx) => (
              <div key={cat.categoryId} className="flex items-center justify-between gap-2 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colors[idx] }}
                    aria-hidden="true"
                  />
                  <span className="text-label truncate text-[var(--color-text)]">
                    {cat.categoryName}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="text-caption tabular-nums text-[var(--color-text-muted)]">
                    {cat.percentage}%
                  </span>
                  <span className="text-label tabular-nums text-[var(--color-text)]">
                    {formatMoney(cat.amount, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
