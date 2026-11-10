'use client';

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import '@/lib/chart-registry';
import { useTheme } from '@/context/theme-context';
import { getBaseChartOptions, getChartPalette } from '@/lib/chart-theme';
import { SpendingTrendPoint, DateRangePreset } from '@/lib/chart-aggregation';
import { ChartCard } from './chart-card';
import { AccessibleChartTable } from './accessible-chart-table';

interface SpendingTrendChartProps {
  data: SpendingTrendPoint[];
  currency: string;
  selectedRange?: DateRangePreset;
  onRangeChange?: (range: DateRangePreset) => void;
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

export function SpendingTrendChart({
  data,
  currency,
  selectedRange = '30d',
  onRangeChange,
  loading = false,
  error = null,
  onRetry,
  className = '',
}: SpendingTrendChartProps) {
  const { theme } = useTheme();
  const palette = getChartPalette(theme);

  const rangeButtons: { id: DateRangePreset; label: string }[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '6m', label: '6M' },
    { id: '12m', label: '1Y' },
  ];

  const chartData = useMemo(() => {
    // Avoid excessive point markers on dense datasets (> 14 points)
    const showPoints = data.length <= 14;

    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: 'Spending',
          data: data.map((d) => d.spending),
          borderColor: palette.expense,
          backgroundColor: withAlpha(palette.expense, theme === 'dark' ? 0.16 : 0.08),
          fill: true,
          tension: 0.35,
          pointRadius: showPoints ? 3 : 0,
          pointHoverRadius: 5,
          pointBackgroundColor: palette.expense,
          pointBorderColor: palette.cardBg,
          pointBorderWidth: 2,
          borderWidth: 2,
        },
      ],
    };
  }, [data, palette, theme]);

  const options = useMemo(() => {
    return getBaseChartOptions(theme, currency, {
      plugins: {
        legend: {
          display: false,
        },
      },
    });
  }, [theme, currency]);

  const tableColumns = [
    { key: 'label', label: 'Date' },
    { key: 'spending', label: 'Spending', isCurrency: true, align: 'right' as const },
    { key: 'count', label: 'Transactions', align: 'center' as const },
  ];

  return (
    <ChartCard
      title="Spending trend"
      subtitle="How your spending moves over time"
      currency={currency}
      selectedRange={selectedRange}
      onRangeChange={onRangeChange}
      availableRanges={rangeButtons}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No spending yet"
      emptyDescription={`No expenses recorded in ${currency} for this period.`}
      emptyActionHref="/transactions/new"
      emptyActionLabel="Add a transaction"
      accessibleTableView={
        <AccessibleChartTable
          caption={`Spending trend timeline in ${currency}`}
          columns={tableColumns}
          data={data}
          currency={currency}
        />
      }
      className={className}
    >
      <div
        role="img"
        aria-label={`Spending trend line chart in ${currency}`}
        className="h-full w-full"
      >
        <Line data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
