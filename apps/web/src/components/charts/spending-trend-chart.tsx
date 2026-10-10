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
          borderColor: palette.receivable,
          backgroundColor: theme === 'dark' ? 'rgba(108, 179, 249, 0.12)' : 'rgba(108, 179, 249, 0.18)',
          fill: true,
          tension: 0.35,
          pointRadius: showPoints ? 3.5 : 0,
          pointHoverRadius: 5.5,
          pointBackgroundColor: palette.receivable,
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
    { key: 'spending', label: 'Spending Amount', isCurrency: true, align: 'right' as const },
    { key: 'count', label: 'Transactions', align: 'center' as const },
  ];

  return (
    <ChartCard
      title="Spending Trend"
      subtitle="Outflow trajectory over time"
      currency={currency}
      selectedRange={selectedRange}
      onRangeChange={onRangeChange}
      availableRanges={rangeButtons}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No spending records"
      emptyDescription={`No expense activity found for the selected period in ${currency}.`}
      emptyActionHref="/transactions/new"
      emptyActionLabel="+ Add Transaction"
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
      <div role="img" aria-label={`Spending trend line chart in ${currency}`} className="w-full h-full">
        <Line data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
