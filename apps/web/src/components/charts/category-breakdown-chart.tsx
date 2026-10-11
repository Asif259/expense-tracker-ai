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
import { PieChart, BarChartHorizontal } from 'lucide-react';

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
          hoverOffset: 4,
        },
      ],
    };
  }, [data, colors, palette]);

  const horizontalBarData = useMemo(() => {
    return {
      labels: data.map((d) => d.categoryName),
      datasets: [
        {
          label: 'Spent Amount',
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
          bodyColor: palette.textPrimary, // Strict neutral text styling
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
            font: { family: CHART_FONT_FAMILY, size: 10, weight: 500 },
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
    { key: 'amount', label: 'Spent Amount', isCurrency: true, align: 'right' as const },
    { key: 'percentage', label: 'Share (%)', align: 'center' as const },
    { key: 'count', label: 'Entries', align: 'center' as const },
  ];

  return (
    <ChartCard
      title="Expense Categories"
      subtitle="Allocation across spending sectors"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No categorized expenses"
      emptyDescription={`No expense records found in ${currency}. Add transactions to view category allocations.`}
      emptyActionHref="/transactions/new"
      emptyActionLabel="+ Add Transaction"
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
      <div className="flex flex-col h-full gap-4">
        {/* Toggle between Doughnut and Horizontal Bar view */}
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs text-[var(--color-text-muted)]">
            Total:{' '}
            <strong className="tabular-nums font-semibold text-[var(--color-text)]">
              {formatMoney(totalExpense, currency)}
            </strong>
          </span>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-bg)]">
            <button
              type="button"
              onClick={() => setChartMode('doughnut')}
              aria-label="Switch to doughnut chart"
              title="Doughnut View"
              className={`p-1 rounded cursor-pointer transition-colors ${
                chartMode === 'doughnut'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              aria-label="Switch to horizontal bar chart"
              title="Horizontal Bar View"
              className={`p-1 rounded cursor-pointer transition-colors ${
                chartMode === 'bar'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <BarChartHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Chart Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 h-48 relative flex items-center justify-center">
            {chartMode === 'doughnut' ? (
              <>
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">
                    {data.length} Categories
                  </span>
                  <span className="text-xs tabular-nums font-bold text-[var(--color-text)]">
                    {formatMoney(totalExpense, currency)}
                  </span>
                </div>
              </>
            ) : (
              <Bar data={horizontalBarData} options={barOptions} />
            )}
          </div>

          {/* Accessible Side Legend with Neutral Monetary Values */}
          <div className="md:col-span-7 space-y-2 divide-y divide-[var(--color-border)] max-h-48 overflow-y-auto pr-1">
            {data.map((cat, idx) => (
              <div
                key={cat.categoryId}
                className="pt-2 first:pt-0 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: colors[idx] }}
                  />
                  <span className="text-[var(--color-text)] truncate font-medium">
                    {cat.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 pl-2">
                  <span className="text-[11px] tabular-nums font-medium text-[var(--color-text-muted)]">
                    {cat.percentage}%
                  </span>
                  <span className="tabular-nums font-semibold text-[var(--color-text)]">
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
