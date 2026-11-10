'use client';

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';
import '@/lib/chart-registry';
import { useTheme } from '@/context/theme-context';
import { getChartPalette, CHART_FONT_FAMILY } from '@/lib/chart-theme';
import { BudgetItemProgress } from '@/lib/chart-aggregation';
import { formatMoney } from '@/lib/format';
import { ChartCard } from './chart-card';
import { AccessibleChartTable } from './accessible-chart-table';
import { Badge } from '@/components/ui';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetProgressChartProps {
  data: BudgetItemProgress[];
  currency: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

/** Chart.js canvases need concrete colours; alpha is derived from the palette value. */
function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BudgetProgressChart({
  data,
  currency,
  loading = false,
  error = null,
  onRetry,
  className = '',
}: BudgetProgressChartProps) {
  const { theme } = useTheme();
  const palette = getChartPalette(theme);

  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.name),
      datasets: [
        {
          label: 'Spent',
          data: data.map((d) => d.spent),
          backgroundColor: data.map((d) => (d.isOverBudget ? palette.expense : palette.income)),
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.6,
        },
        {
          label: 'Limit',
          data: data.map((d) => d.limit),
          backgroundColor: withAlpha(palette.textMuted, theme === 'dark' ? 0.32 : 0.16),
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.6,
        },
      ],
    };
  }, [data, palette, theme]);

  const options = useMemo(() => {
    return {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            color: palette.textMuted,
            boxWidth: 10,
            boxHeight: 10,
            font: { family: CHART_FONT_FAMILY, size: 11, weight: 500 },
          },
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
            label: (context: TooltipItem<'bar'>) => {
              const val = Number(context.parsed.x) || 0;
              const label = context.dataset.label || '';
              return ` ${label}: ${formatMoney(val, currency)}`;
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
  }, [palette, currency]);

  const tableColumns = [
    { key: 'name', label: 'Budget' },
    { key: 'spent', label: 'Spent', isCurrency: true, align: 'right' as const },
    { key: 'limit', label: 'Limit', isCurrency: true, align: 'right' as const },
    { key: 'remaining', label: 'Remaining', isCurrency: true, align: 'right' as const },
    { key: 'percent', label: 'Used', align: 'center' as const },
  ];

  return (
    <ChartCard
      title="Budget progress"
      subtitle="How spending compares to each limit"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No budgets yet"
      emptyDescription={`No spending limits are set in ${currency}. Add a budget to compare spending against it here.`}
      emptyActionHref="/transactions"
      emptyActionLabel="View transactions"
      accessibleTableView={
        <AccessibleChartTable
          caption={`Budget limits and utilization in ${currency}`}
          columns={tableColumns}
          data={data}
          currency={currency}
        />
      }
      className={className}
      heightClass="h-auto min-h-[300px]"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="h-44 w-full">
          <Bar data={chartData} options={options} />
        </div>

        <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {data.map((b) => (
            <li
              key={b.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                    b.isOverBudget
                      ? 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                      : 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                  }`}
                >
                  {b.isOverBudget ? (
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <span className="text-card-title truncate">{b.name}</span>
                <span className="text-caption tabular-nums">{b.percent}% used</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-9 tabular-nums sm:justify-end sm:pl-0">
                <span className="text-caption">
                  Spent{' '}
                  <span className="text-label text-[var(--color-text)]">
                    {formatMoney(b.spent, currency)}
                  </span>
                </span>
                <span className="text-caption">
                  Limit{' '}
                  <span className="text-label text-[var(--color-text)]">
                    {formatMoney(b.limit, currency)}
                  </span>
                </span>
                <Badge tone={b.isOverBudget ? 'warning' : 'success'}>
                  {b.isOverBudget
                    ? `Over by ${formatMoney(Math.abs(b.remaining), currency)}`
                    : `${formatMoney(b.remaining, currency)} left`}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
