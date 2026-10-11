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
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

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
      labels: ['Owed to You (Receivables)', 'You Owe (Payables)'],
      datasets: [
        {
          label: 'Outstanding Balance',
          data: [summary.outstandingReceivables, summary.outstandingPayables],
          backgroundColor: [palette.receivable, palette.payable],
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.5,
        },
        {
          label: 'Total Repaid',
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
        direction: 'Owed to You (Receivables)',
        principal: summary.totalLent,
        repaid: summary.repaidLent,
        outstanding: summary.outstandingReceivables,
      },
      {
        direction: 'You Owe (Payables)',
        principal: summary.totalBorrowed,
        repaid: summary.repaidBorrowed,
        outstanding: summary.outstandingPayables,
      },
    ];
  }, [summary]);

  const tableColumns = [
    { key: 'direction', label: 'Loan Direction' },
    { key: 'principal', label: 'Principal', isCurrency: true, align: 'right' as const },
    { key: 'repaid', label: 'Repaid', isCurrency: true, align: 'right' as const },
    { key: 'outstanding', label: 'Outstanding Balance', isCurrency: true, align: 'right' as const },
  ];

  const isEmpty =
    !summary ||
    (summary.totalLent === 0 &&
      summary.totalBorrowed === 0 &&
      summary.outstandingReceivables === 0 &&
      summary.outstandingPayables === 0);

  return (
    <ChartCard
      title="Debt & Loan Obligations"
      subtitle="Bilateral exposure and settlement balances"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyTitle="No loan records"
      emptyDescription={`No bilateral loan contracts or debts found in ${currency}. Record a loan to track liabilities.`}
      emptyActionHref="/loans/new"
      emptyActionLabel="+ Record a Loan"
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
      <div className="space-y-4">
        {/* Visual Chart Canvas */}
        <div className="h-44 w-full">
          <Bar data={chartData} options={options} />
        </div>

        {/* Dual Card Metrics - Neutral numbers with directional iconography */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)]">
            <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-[var(--color-pale-cyan)] text-[var(--color-text)] flex items-center justify-center text-xs font-bold shrink-0">
                  <ArrowDownLeft className="w-4 h-4 text-[#6CB3F9]" />
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                    Receivables (Owed to You)
                  </span>
                  <span className="text-sm tabular-nums font-bold text-[var(--color-text)] mt-0.5 block">
                    {formatMoney(summary.outstandingReceivables, currency)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] tabular-nums font-medium text-[var(--color-text-muted)]">
                Repaid: {formatMoney(summary.repaidLent, currency)}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-[var(--color-pale-yellow)] text-[var(--color-text)] flex items-center justify-center text-xs font-bold shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-[#5452CF]" />
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                    Payables (You Owe)
                  </span>
                  <span className="text-sm tabular-nums font-bold text-[var(--color-text)] mt-0.5 block">
                    {formatMoney(summary.outstandingPayables, currency)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] tabular-nums font-medium text-[var(--color-text-muted)]">
                Repaid: {formatMoney(summary.repaidBorrowed, currency)}
              </span>
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
