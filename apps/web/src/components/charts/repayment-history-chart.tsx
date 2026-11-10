'use client';

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import '@/lib/chart-registry';
import { useTheme } from '@/context/theme-context';
import { getBaseChartOptions, getChartPalette } from '@/lib/chart-theme';
import { RepaymentHistoryPoint } from '@/lib/chart-aggregation';
import { ChartCard } from './chart-card';
import { AccessibleChartTable } from './accessible-chart-table';

interface RepaymentHistoryChartProps {
  data: RepaymentHistoryPoint[];
  currency: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function RepaymentHistoryChart({
  data,
  currency,
  loading = false,
  error = null,
  onRetry,
  className = '',
}: RepaymentHistoryChartProps) {
  const { theme } = useTheme();
  const palette = getChartPalette(theme);

  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: 'Recovered from loans',
          data: data.map((d) => d.lentRepaid),
          backgroundColor: palette.income,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Repaid on loans',
          data: data.map((d) => d.borrowedRepaid),
          backgroundColor: palette.expense,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [data, palette]);

  const options = useMemo(() => {
    return getBaseChartOptions(theme, currency);
  }, [theme, currency]);

  const tableColumns = [
    { key: 'label', label: 'Period' },
    { key: 'lentRepaid', label: 'Recovered from loans', isCurrency: true, align: 'right' as const },
    {
      key: 'borrowedRepaid',
      label: 'Repaid on loans',
      isCurrency: true,
      align: 'right' as const,
    },
    { key: 'totalRepaid', label: 'Total', isCurrency: true, align: 'right' as const },
    { key: 'count', label: 'Repayments', align: 'center' as const },
  ];

  return (
    <ChartCard
      title="Repayments"
      subtitle="Loan repayments recorded over time"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No repayments yet"
      emptyDescription={`No loan repayments recorded in ${currency} yet. Record repayments on active loans to see them here.`}
      emptyActionHref="/loans"
      emptyActionLabel="View loans"
      accessibleTableView={
        <AccessibleChartTable
          caption={`Loan repayment history over time in ${currency}`}
          columns={tableColumns}
          data={data}
          currency={currency}
        />
      }
      className={className}
    >
      <div
        role="img"
        aria-label={`Loan repayment history chart in ${currency}`}
        className="h-full w-full"
      >
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
