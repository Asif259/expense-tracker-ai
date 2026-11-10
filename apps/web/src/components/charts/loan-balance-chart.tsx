'use client';

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import '@/lib/chart-registry';
import { useTheme } from '@/context/theme-context';
import { getBaseChartOptions, getChartPalette } from '@/lib/chart-theme';
import { LoanPortfolioSummary } from '@/lib/chart-aggregation';
import { formatMoney } from '@/lib/format';
import { ChartCard } from './chart-card';
import { AccessibleChartTable } from './accessible-chart-table';

interface LoanBalanceChartProps {
  summary: LoanPortfolioSummary | null;
  currency: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function LoanBalanceChart({
  summary,
  currency,
  loading = false,
  error = null,
  onRetry,
  className = '',
}: LoanBalanceChartProps) {
  const { theme } = useTheme();
  const palette = getChartPalette(theme);

  const chartData = useMemo(() => {
    if (!summary) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: ['Owed to you', 'You owe'],
      datasets: [
        {
          label: 'Outstanding',
          data: [summary.outstandingReceivables, summary.outstandingPayables],
          backgroundColor: [palette.receivable, palette.expense],
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.5,
        },
        {
          label: 'Repaid',
          data: [summary.repaidLent, summary.repaidBorrowed],
          backgroundColor: [palette.income, palette.income],
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.5,
        },
      ],
    };
  }, [summary, palette]);

  const options = useMemo(() => {
    return getBaseChartOptions(theme, currency);
  }, [theme, currency]);

  const tableData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        direction: 'Owed to you',
        principal: summary.totalLent,
        repaid: summary.repaidLent,
        outstanding: summary.outstandingReceivables,
      },
      {
        direction: 'You owe',
        principal: summary.totalBorrowed,
        repaid: summary.repaidBorrowed,
        outstanding: summary.outstandingPayables,
      },
    ];
  }, [summary]);

  const tableColumns = [
    { key: 'direction', label: 'Direction' },
    { key: 'principal', label: 'Principal', isCurrency: true, align: 'right' as const },
    { key: 'repaid', label: 'Repaid', isCurrency: true, align: 'right' as const },
    { key: 'outstanding', label: 'Outstanding', isCurrency: true, align: 'right' as const },
  ];

  const isEmpty =
    !summary ||
    (summary.totalLent === 0 &&
      summary.totalBorrowed === 0 &&
      summary.outstandingReceivables === 0 &&
      summary.outstandingPayables === 0);

  return (
    <ChartCard
      title="Debts and loans"
      subtitle="Outstanding balances and amounts repaid"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyTitle="No loans yet"
      emptyDescription={`No loans or debts recorded in ${currency} yet. Record one to track what you owe and what is owed to you.`}
      emptyActionHref="/loans/new"
      emptyActionLabel="Record a loan"
      accessibleTableView={
        <AccessibleChartTable
          caption={`Debt and loan obligations breakdown in ${currency}`}
          columns={tableColumns}
          data={tableData}
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

        {/* Plain hairline summary — ChartCard already provides the surface. */}
        {summary && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-[var(--color-border)] pt-3 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-label text-[var(--color-text-muted)]">Owed to you</dt>
              <dd className="text-metric-sm mt-0.5 tabular-nums">
                {formatMoney(summary.outstandingReceivables, currency)}
              </dd>
              <p className="text-caption mt-0.5">
                {formatMoney(summary.repaidLent, currency)} repaid so far
              </p>
            </div>
            <div className="min-w-0">
              <dt className="text-label text-[var(--color-text-muted)]">You owe</dt>
              <dd className="text-metric-sm mt-0.5 tabular-nums">
                {formatMoney(summary.outstandingPayables, currency)}
              </dd>
              <p className="text-caption mt-0.5">
                {formatMoney(summary.repaidBorrowed, currency)} repaid so far
              </p>
            </div>
          </dl>
        )}
      </div>
    </ChartCard>
  );
}
