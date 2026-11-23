'use client';

import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';
import '@/lib/chart-registry';
import { useTheme } from '@/context/theme-context';
import { getChartPalette, CHART_FONT_FAMILY } from '@/lib/chart-theme';
import { formatMoney } from '@/lib/format';
import { ChartCard } from './chart-card';
import { AllocationPoint } from '@/lib/api';

interface InvestmentAllocationChartProps {
  data: AllocationPoint[];
  currency: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function InvestmentAllocationChart({
  data,
  currency,
  loading = false,
  error = null,
  onRetry,
  className = '',
}: InvestmentAllocationChartProps) {
  const { theme } = useTheme();
  const palette = getChartPalette(theme);

  const totalInvested = useMemo(() => {
    return data.reduce((sum, d) => sum + parseFloat(d.invested), 0);
  }, [data]);

  const totalCurrent = useMemo(() => {
    return data.reduce((sum, d) => sum + parseFloat(d.current), 0);
  }, [data]);

  const colors = useMemo(() => {
    return data.map((_, idx) => palette.categories[idx % palette.categories.length]);
  }, [data, palette]);

  const doughnutData = useMemo(() => {
    return {
      labels: data.map((d) => d.type),
      datasets: [
        {
          data: data.map((d) => parseFloat(d.invested)),
          backgroundColor: colors,
          borderColor: palette.cardBg,
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [data, colors, palette]);

  const doughnutOptions = useMemo(() => {
    return {
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
            label: (context: TooltipItem<'doughnut'>) => {
              const val = Number(context.parsed) || 0;
              const pct = totalInvested > 0 ? Math.round((val / totalInvested) * 100) : 0;
              return ` ${context.label}: ${formatMoney(val, currency)} (${pct}%)`;
            },
          },
        },
      },
      cutout: '72%',
    };
  }, [palette, totalInvested, currency]);

  return (
    <ChartCard
      title="Allocation by type"
      subtitle="Portfolio distribution"
      currency={currency}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyTitle="No investments yet"
      emptyDescription="Add your first investment to see the allocation chart."
      className={className}
      heightClass="h-auto min-h-[320px]"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-secondary">
            Total{' '}
            <span className="text-card-title ml-0.5 tabular-nums">
              {formatMoney(totalInvested, currency)}
            </span>
          </span>
          <span className="text-secondary">
            Current{' '}
            <span className="text-card-title ml-0.5 tabular-nums">
              {formatMoney(totalCurrent, currency)}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
          <div className="relative flex h-48 items-center justify-center md:col-span-5">
            <div className="h-full w-full" role="img" aria-label={`Investment allocation by type doughnut chart in ${currency}`}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-label text-[var(--color-text-muted)]">{data.length} types</span>
              <span className="text-metric-sm tabular-nums">{formatMoney(totalInvested, currency)}</span>
            </div>
          </div>

          <div className="max-h-48 space-y-0 divide-y divide-[var(--color-border)] overflow-y-auto pr-1 md:col-span-7">
            {data.map((point, idx) => (
              <div key={point.type} className="flex items-center justify-between gap-2 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[idx] }} aria-hidden="true" />
                  <span className="text-label truncate text-[var(--color-text)]">{point.type}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="text-caption tabular-nums text-[var(--color-text-muted)]">
                    {totalInvested > 0 ? Math.round((parseFloat(point.invested) / totalInvested) * 100) : 0}%
                  </span>
                  <span className="text-label tabular-nums text-[var(--color-text)]">
                    {formatMoney(point.invested, currency)}
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
