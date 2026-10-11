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
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetProgressChartProps {
  data: BudgetItemProgress[];
  currency: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
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
          label: 'Spent Amount',
          data: data.map((d) => d.spent),
          backgroundColor: data.map((d) =>
            d.isOverBudget ? palette.expense : palette.income
          ),
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.6,
        },
        {
          label: 'Budget Limit',
          data: data.map((d) => d.limit),
          backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
            font: { family: CHART_FONT_FAMILY, size: 11, weight: 500 },
          },
        },
        tooltip: {
          backgroundColor: palette.cardBg,
          titleColor: palette.textPrimary,
          bodyColor: palette.textPrimary, // Strict neutral text
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
  }, [palette, currency]);

  const tableColumns = [
    { key: 'name', label: 'Budget Target' },
    { key: 'spent', label: 'Spent', isCurrency: true, align: 'right' as const },
    { key: 'limit', label: 'Limit', isCurrency: true, align: 'right' as const },
    { key: 'remaining', label: 'Remaining', isCurrency: true, align: 'right' as const },
    { key: 'percent', label: 'Utilized (%)', align: 'center' as const },
  ];

  return (
    <ChartCard
      title="Budget Progress"
      subtitle="Spending limits and utilization"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No budgets configured"
      emptyDescription={`No spending budget limits defined for this period in ${currency}. Set limits to monitor budget velocity.`}
      emptyActionHref="/transactions"
      emptyActionLabel="View Transactions"
      accessibleTableView={
        <AccessibleChartTable
          caption={`Budget limits and utilization progress in ${currency}`}
          columns={tableColumns}
          data={data}
          currency={currency}
        />
      }
      className={className}
      heightClass="h-auto min-h-[300px]"
    >
      <div className="space-y-4">
        {/* Visual Chart */}
        <div className="h-44 w-full">
          <Bar data={chartData} options={options} />
        </div>

        {/* Detailed status row with neutral financial amounts */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--color-border)]">
          {data.map((b) => (
            <div
              key={b.id}
              className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                {b.isOverBudget ? (
                  <AlertTriangle className="w-4 h-4 text-[var(--color-expense)] shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-[var(--color-text)]">{b.name}</span>
                  <span className="text-[11px] text-[var(--color-text-muted)] ml-2">
                    {b.percent}% utilized
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 tabular-nums text-right">
                <span className="text-[var(--color-text-muted)] text-[11px]">
                  Spent:{' '}
                  <strong className="text-[var(--color-text)] font-semibold">
                    {formatMoney(b.spent, currency)}
                  </strong>
                </span>
                <span className="text-[var(--color-text-muted)] text-[11px]">
                  Limit:{' '}
                  <strong className="text-[var(--color-text)] font-semibold">
                    {formatMoney(b.limit, currency)}
                  </strong>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    b.isOverBudget
                      ? 'bg-[var(--color-pale-yellow)] text-[var(--color-text)]'
                      : 'bg-[var(--color-pale-mint)] text-[var(--color-text)]'
                  }`}
                >
                  {b.isOverBudget
                    ? `Over by ${formatMoney(Math.abs(b.remaining), currency)}`
                    : `${formatMoney(b.remaining, currency)} left`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
