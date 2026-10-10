'use client';

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import '@/lib/chart-registry';
import { useTheme } from '@/context/theme-context';
import { getBaseChartOptions, getChartPalette } from '@/lib/chart-theme';
import { MonthlyCashFlowPoint } from '@/lib/chart-aggregation';
import { ChartCard } from './chart-card';
import { AccessibleChartTable } from './accessible-chart-table';

interface IncomeExpenseChartProps {
  data: MonthlyCashFlowPoint[];
  currency: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function IncomeExpenseChart({
  data,
  currency,
  loading = false,
  error = null,
  onRetry,
  className = '',
}: IncomeExpenseChartProps) {
  const { theme } = useTheme();
  const palette = getChartPalette(theme);

  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: 'Inflow',
          data: data.map((d) => d.income),
          backgroundColor: palette.income,
          hoverBackgroundColor: palette.income,
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
        {
          label: 'Outflow',
          data: data.map((d) => d.expense),
          backgroundColor: palette.expense,
          hoverBackgroundColor: palette.expense,
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
      ],
    };
  }, [data, palette]);

  const options = useMemo(() => {
    return getBaseChartOptions(theme, currency, {
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: palette.textMuted,
            font: { family: "'Inter', system-ui, sans-serif", size: 11, weight: 500 },
          },
        },
      },
    });
  }, [theme, currency, palette]);

  const tableColumns = [
    { key: 'label', label: 'Month' },
    { key: 'income', label: 'Inflow', isCurrency: true, align: 'right' as const },
    { key: 'expense', label: 'Outflow', isCurrency: true, align: 'right' as const },
    { key: 'net', label: 'Net Cash Flow', isCurrency: true, align: 'right' as const },
  ];

  return (
    <ChartCard
      title="Income vs Expenses"
      subtitle="Monthly cash flow comparison"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No cash flow recorded"
      emptyDescription={`No income or expense records found in ${currency}. Add transactions to generate this comparison.`}
      emptyActionHref="/transactions/new"
      emptyActionLabel="+ Add Transaction"
      accessibleTableView={
        <AccessibleChartTable
          caption={`Income versus Expenses comparison in ${currency}`}
          columns={tableColumns}
          data={data}
          currency={currency}
        />
      }
      className={className}
    >
      <div role="img" aria-label={`Income vs Expenses grouped bar chart in ${currency}`} className="w-full h-full">
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
