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
          label: 'Receivables Recovered',
          data: data.map((d) => d.lentRepaid),
          backgroundColor: palette.income,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Payables Settled',
          data: data.map((d) => d.borrowedRepaid),
          backgroundColor: palette.payable,
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
    { key: 'label', label: 'Payment Period' },
    { key: 'lentRepaid', label: 'Recovered (Lent)', isCurrency: true, align: 'right' as const },
    { key: 'borrowedRepaid', label: 'Settled (Borrowed)', isCurrency: true, align: 'right' as const },
    { key: 'totalRepaid', label: 'Total Volume', isCurrency: true, align: 'right' as const },
    { key: 'count', label: 'Repayments', align: 'center' as const },
  ];

  return (
    <ChartCard
      title="Repayment Velocity"
      subtitle="Actual recorded loan repayment installments"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No repayment history"
      emptyDescription={`No recorded repayment installments found for loans in ${currency}. Record repayments on active loans to track history.`}
      emptyActionHref="/loans"
      emptyActionLabel="View Loans"
      accessibleTableView={
        <AccessibleChartTable
          caption={`Repayment installments history over time in ${currency}`}
          columns={tableColumns}
          data={data}
          currency={currency}
        />
      }
      className={className}
    >
      <div role="img" aria-label={`Loan repayment installments history chart in ${currency}`} className="w-full h-full">
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
