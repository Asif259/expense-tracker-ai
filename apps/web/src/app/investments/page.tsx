'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  listInvestments,
  fetchInvestmentSummary,
  fetchAllocation,
  Investment,
  InvestmentSummary,
  AllocationPoint,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { KpiStrip } from '@/components/dashboard/kpi-strip';
import { InvestmentAllocationChart } from '@/components/charts/investment-allocation-chart';
import { ResponsiveDataTable } from '@/components/responsive-table';
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SegmentedControl,
} from '@/components/ui';
import type { RowAction } from '@/components/responsive-table/types';
import type { BadgeTone } from '@/components/ui';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  TrendingUp,
  Plus,
  Eye,
  Pencil,
} from 'lucide-react';

const CURRENCY_OPTIONS = ['USD', 'BDT', 'VND'] as const;

function statusBadge(status: Investment['status']): { label: string; tone: BadgeTone } {
  if (status === 'sold') return { label: 'Sold', tone: 'neutral' };
  if (status === 'active') return { label: 'Active', tone: 'accent' };
  return { label: status, tone: 'neutral' };
}

function assetLabel(type: string): string {
  const labels: Record<string, string> = {
    gold: 'Gold',
    silver: 'Silver',
    fdr_dps: 'FDR/DPS',
    sanchaypatra: 'Sanchaypatra',
    stocks: 'Stocks',
    mutual_fund: 'Mutual Fund',
    real_estate: 'Real Estate',
    other: 'Other',
  };
  return labels[type] ?? type;
}

type ViewMode = 'market' | 'resale';

export default function InvestmentsPage() {
  const { getToken } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('market');
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [allocations, setAllocations] = useState<AllocationPoint[]>([]);
  const [holdings, setHoldings] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');

  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tokenPromise = getToken();
    tokenPromise.then((token) => {
      if (!token || cancelled) return;
      Promise.all([
        fetchInvestmentSummary(token),
        fetchAllocation(token),
        listInvestments(token, { limit: 50 }),
      ]).then(([summaryRes, allocRes, holdingsRes]) => {
        if (!cancelled) {
          setSummary(summaryRes);
          setAllocations(allocRes);
          setHoldings(holdingsRes.data ?? []);
        }
      }).catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [getToken, reloadCount]);

  const handleRetry = () => { setReloadCount((c) => c + 1); };

  const kpiTiles = useMemo(() => {
    if (!summary || loading) return null;
    const pnlValue = viewMode === 'market'
      ? summary.unrealizedPnlMarket
      : summary.unrealizedPnlResale;
    const currentValue = viewMode === 'market'
      ? summary.currentValue
      : summary.resaleValue;
    const returnPct = viewMode === 'market'
      ? summary.returnPctMarket
      : summary.returnPctResale;

    return [
      {
        label: 'Total Invested',
        value: formatMoney(summary.totalInvested, currency),
        icon: <Coins className="h-3.5 w-3.5" />,
      },
      {
        label: viewMode === 'market' ? 'Current Value' : 'Resale Value',
        value: formatMoney(currentValue, currency),
        icon: <ArrowUpRight className="h-3.5 w-3.5" />,
      },
      {
        label: 'Unrealized P&L',
        value: `${parseFloat(pnlValue) >= 0 ? '+' : ''}${formatMoney(pnlValue, currency)}`,
        bad: parseFloat(pnlValue) < 0,
        icon: parseFloat(pnlValue) >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />,
      },
      {
        label: 'Active Holdings',
        value: String(summary.activeCount),
        note: <span className="text-[var(--color-text-subtle)]">{returnPct} return</span>,
        icon: <TrendingUp className="h-3.5 w-3.5" />,
      },
    ];
  }, [summary, loading, viewMode, currency]);

  const columns = [
    {
      id: 'name',
      header: 'Name',
      role: 'identity' as const,
      priority: 1,
      render: (value: string) => <span className="font-medium text-[var(--color-text)]">{value}</span>,
    },
    {
      id: 'asset_type',
      header: 'Type',
      role: 'detail' as const,
      priority: 2,
      render: (value: string) => (
        <Badge tone="neutral">{assetLabel(value)}</Badge>
      ),
    },
    {
      id: 'invested_amount',
      header: 'Invested',
      role: 'detail' as const,
      priority: 3,
      render: (value: string) => (
        <span className="tabular-nums text-[var(--color-text)]">{formatMoney(value, currency)}</span>
      ),
    },
    {
      id: 'current_value',
      header: 'Current',
      role: 'value' as const,
      priority: 4,
      render: (value: string) => (
        <span className="tabular-nums text-[var(--color-text)]">{formatMoney(value, currency)}</span>
      ),
    },
    {
      id: 'pnl',
      header: 'P&L',
      role: 'detail' as const,
      priority: 5,
      render: (_value: string, row: Investment) => {
        const invested = parseFloat(row.invested_amount);
        const current = parseFloat(row.current_value);
        const pnl = current - invested;
        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
        return (
          <span className={`tabular-nums ${pnl >= 0 ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'}`}>
            {pnl >= 0 ? '+' : ''}{formatMoney(Math.abs(pnl).toString(), currency)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
          </span>
        );
      },
    },
    {
      id: 'purchased_date',
      header: 'Date',
      role: 'detail' as const,
      priority: 6,
      render: (value: string) => formatDate(value),
    },
    {
      id: 'status',
      header: 'Status',
      role: 'state' as const,
      priority: 7,
      render: (value: string) => {
        const badge = statusBadge(value as Investment['status']);
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      role: 'action' as const,
      priority: 8,
      className: 'w-12',
    },
  ];

  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'gold', label: 'Gold' },
    { value: 'silver', label: 'Silver' },
    { value: 'stocks', label: 'Stocks' },
    { value: 'fdr_dps', label: 'FDR/DPS' },
    { value: 'real_estate', label: 'Real Estate' },
  ];
  const [filterType, setFilterType] = useState('all');

  const rowActions = useCallback(
    (row: Investment): RowAction<Investment>[] => [
      {
        id: 'view',
        label: 'View',
        icon: <Eye className="h-3.5 w-3.5" />,
        onClick: (row) => router.push(`/investments/${row.id}`),
        variant: 'default',
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: (row) => router.push(`/investments/${row.id}`),
        variant: 'default',
      },
    ],
    [router],
  );

  const filteredHoldings = useMemo(() => {
    if (filterType === 'all') return holdings;
    return holdings.filter((h) => h.asset_type === filterType);
  }, [holdings, filterType]);

  return (
    <AppShell wide>
      <div className="space-y-6">
        <PageHeader
          title="Investments"
          description="Track your portfolio performance"
          actions={
            <div className="flex items-center gap-2">
              <ButtonLink href="/investments/gold-calculator" variant="secondary" leadingIcon={<TrendingUp className="h-4 w-4" />}>
                Gold Calculator
              </ButtonLink>
              <ButtonLink href="/investments/new" variant="primary" leadingIcon={<Plus className="h-4 w-4" />}>
                Add Investment
              </ButtonLink>
            </div>
          }
        />

        {/* KPI Strip */}
        <KpiStrip
          tiles={kpiTiles ?? []}
          baseline={currency}
          loading={loading}
          label="Investment summary"
        />

        {/* Currency selector */}
        <div className="flex items-center gap-2">
          <span className="text-label text-[var(--color-text-muted)]">Currency:</span>
          <SegmentedControl
            label="Select currency"
            size="sm"
            value={currency}
            onChange={(v) => setCurrency(v as typeof currency)}
            options={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))}
          />
        </div>

        {/* Market/Resale toggle */}
        <SegmentedControl
          label="Valuation mode"
          size="md"
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
          options={[
            { value: 'market', label: 'Market Value' },
            { value: 'resale', label: 'Resale Value' },
          ]}
        />

        {/* Allocation Chart */}
        <InvestmentAllocationChart
          data={allocations}
          currency={currency}
          loading={loading}
          error={error}
          onRetry={() => window.location.reload()}
          className="mb-6"
        />

        {/* Holdings Table */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-card-title">Holdings</h2>
            <span className="text-caption text-[var(--color-text-muted)]">{filteredHoldings.length} investments</span>
          </div>
          <Card>
            <div className="mb-4 flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterType(tab.value)}
                  className={`rounded-[var(--radius-md)] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    filterType === tab.value
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {error ? (
              <ErrorState description={error} onRetry={handleRetry} />
            ) : loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-12 w-full" />
                ))}
              </div>
            ) : filteredHoldings.length === 0 ? (
              <EmptyState
                title="No investments found"
                description="Start building your portfolio by adding your first investment."
                action={
                  <ButtonLink href="/investments/new" size="sm" variant="primary">Add Investment</ButtonLink>
                }
                icon={<Coins className="h-8 w-8" />}
              />
            ) : (
              <ResponsiveDataTable<Investment>
                data={filteredHoldings}
                columns={columns}
                keyExtractor={(row) => row.id}
                loadingRowCount={3}
                emptyTitle="No investments match this filter"
                emptyDescription="Try adjusting your filter criteria."
                actions={rowActions}
              />
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
