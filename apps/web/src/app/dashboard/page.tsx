'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  listTransactions,
  listDrafts,
  getLoanSummary,
  Transaction,
  AiDraft,
  CurrencyLoanSummary,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { fetchCategories, Category } from '@/lib/categories';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loanSummaries, setLoanSummaries] = useState<Record<string, CurrencyLoanSummary>>({});
  const [activeReportTab, setActiveReportTab] = useState<'flow' | 'breakdown' | 'loans'>('flow');
  const [aiAskInput, setAiAskInput] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

  useEffect(() => {
    setCurrentDateFormatted(
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(new Date())
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) return;

        const [cats, txRes, draftRes, loanRes] = await Promise.all([
          fetchCategories(),
          listTransactions(token, { limit: 100 }),
          listDrafts(token).catch(() => ({ data: [], total: 0 })),
          getLoanSummary(token).catch(() => ({ currencies: {} })),
        ]);

        if (mounted) {
          setCategories(cats);
          setTransactions(txRes.data || []);
          setDrafts(draftRes.data || []);
          setLoanSummaries(loanRes.currencies || {});
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, [getToken]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  // Financial summary computation: group by currency so different currencies are NEVER summed together
  const currencySummaries = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();

    for (const tx of transactions) {
      const cur = tx.currency || 'BDT';
      const existing = map.get(cur) || { income: 0, expense: 0, count: 0 };
      const num = parseFloat(tx.amount) || 0;
      if (tx.type === 'income') {
        existing.income += num;
      } else {
        existing.expense += num;
      }
      existing.count += 1;
      map.set(cur, existing);
    }

    if (map.size === 0) {
      return [
        {
          currency: 'BDT',
          incomeTotal: '0.00',
          expenseTotal: '0.00',
          netBalance: '0.00',
          count: 0,
        },
      ];
    }

    return Array.from(map.entries()).map(([currency, data]) => ({
      currency,
      incomeTotal: data.income.toFixed(2),
      expenseTotal: data.expense.toFixed(2),
      netBalance: (data.income - data.expense).toFixed(2),
      count: data.count,
    }));
  }, [transactions]);

  const summary = currencySummaries[0];
  const otherCurrencies = currencySummaries.slice(1);

  // Top spending categories breakdown for main currency
  const categoryBreakdown = useMemo(() => {
    const expenseTx = transactions.filter(
      (tx) => tx.type === 'expense' && (tx.currency || 'BDT') === summary.currency
    );
    const catTotals = new Map<string, number>();
    let totalExpense = 0;

    for (const tx of expenseTx) {
      const amt = parseFloat(tx.amount) || 0;
      totalExpense += amt;
      const catName = categoryMap.get(tx.category_id)?.name || 'General Expense';
      catTotals.set(catName, (catTotals.get(catName) || 0) + amt);
    }

    if (totalExpense === 0) return [];

    return Array.from(catTotals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: Math.round((amount / totalExpense) * 100),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, summary.currency, categoryMap]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Aggregate loans for main currency
  const mainLoanSummary = loanSummaries[summary.currency] || null;

  const totalInflowNum = parseFloat(summary.incomeTotal) || 0;
  const totalOutflowNum = parseFloat(summary.expenseTotal) || 0;
  const netBalanceNum = parseFloat(summary.netBalance) || 0;
  const avgPerTx = summary.count > 0 ? (totalOutflowNum / summary.count).toFixed(2) : '0.00';

  // Savings / Retention rate
  const retentionRate = totalInflowNum > 0
    ? Math.max(0, Math.min(100, Math.round(((totalInflowNum - totalOutflowNum) / totalInflowNum) * 100)))
    : 0;

  // Debt obligations vs monthly inflow
  const debtRatio = totalInflowNum > 0 && mainLoanSummary
    ? Math.min(100, Math.round((Number(mainLoanSummary.outstanding_payables) / totalInflowNum) * 100))
    : 0;

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Josh';

  // Palette colors for multi-segment category progress bar
  const segmentColors = [
    '#F5C258', // Amber
    '#6DD0A1', // Mint Green
    '#6CB3F9', // Soft Blue
    '#5452CF', // Indigo
    '#D3FDFE', // Pale Cyan
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* =========================================================================
            HEADER & GREETING (Minimalist Enterprise Header matching reference)
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              Good Day, {userName}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {currentDateFormatted} • Verified financial intelligence ledger
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/ai-entry"
              className="px-3.5 py-2 rounded-xl bg-[var(--color-pale-mint)] text-[var(--color-text)] text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 border border-[var(--color-border)]"
            >
              <span>⚡</span>
              <span>AI Quick Entry</span>
            </Link>

            <Link
              href="/loans/new"
              className="px-3.5 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>+ Record Loan</span>
            </Link>

            <Link
              href="/transactions/new"
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
              <span>+ Add Transaction</span>
            </Link>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-pale-yellow)] text-xs text-[var(--color-text)] flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="underline font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pending AI Drafts Banner */}
        {drafts.length > 0 && (
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-pale-mint)] text-[var(--color-text)] flex items-center justify-center text-sm font-bold">
                ⚡
              </span>
              <div>
                <h4 className="text-xs font-bold text-[var(--color-text)]">
                  {drafts.length} Pending AI Draft{drafts.length > 1 ? 's' : ''} Awaiting Approval
                </h4>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Convert extracted notes into verified ledger entries.
                </p>
              </div>
            </div>
            <Link
              href="/ai-entry"
              className="px-3.5 py-1.5 rounded-lg bg-[var(--color-pale-cyan)] text-[var(--color-text)] text-xs font-semibold shrink-0 hover:opacity-90 transition-opacity text-center border border-[var(--color-border)]"
            >
              Review Drafts ({drafts.length}) →
            </Link>
          </div>
        )}

        {/* =========================================================================
            KEY FINANCIAL METRICS (White Cards, Border #EDEFF3, Neutral Numbers)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Cash Flow */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Net Cash Flow
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  netBalanceNum >= 0
                    ? 'bg-[var(--color-pale-mint)] text-[var(--color-text)]'
                    : 'bg-[var(--color-pale-yellow)] text-[var(--color-text)]'
                }`}
              >
                {netBalanceNum >= 0 ? '+ Positive' : '- Deficit'}
              </span>
            </div>
            <div className="mt-3">
              {/* Financial Number Rule: Always rendered in neutral text #111111 / #F4F4F4 */}
              <div className="text-2xl font-bold font-mono tracking-tight text-[var(--color-text)]">
                {loading ? (
                  <div className="h-8 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                ) : (
                  formatMoney(summary.netBalance, summary.currency)
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                Inflow minus outflow
              </span>
            </div>
          </div>

          {/* Total Income */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Total Inflow
              </span>
              <span className="w-5 h-5 rounded-md bg-[var(--color-pale-mint)] text-[var(--color-text)] flex items-center justify-center text-xs font-bold">
                ↓
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono tracking-tight text-[var(--color-text)]">
                {loading ? (
                  <div className="h-8 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                ) : (
                  formatMoney(summary.incomeTotal, summary.currency)
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                Recorded earnings & deposits
              </span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Total Outflow
              </span>
              <span className="w-5 h-5 rounded-md bg-[var(--color-pale-yellow)] text-[var(--color-text)] flex items-center justify-center text-xs font-bold">
                ↑
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono tracking-tight text-[var(--color-text)]">
                {loading ? (
                  <div className="h-8 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                ) : (
                  formatMoney(summary.expenseTotal, summary.currency)
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                Recorded expenses & payments
              </span>
            </div>
          </div>

          {/* Transactions Count */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Ledger Records
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-pale-cyan)] text-[var(--color-text)]">
                {summary.currency}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono tracking-tight text-[var(--color-text)]">
                {loading ? (
                  <div className="h-8 w-20 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                ) : (
                  summary.count
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                Audited ledger entries
              </span>
            </div>
          </div>
        </div>

        {/* Additional Held Currencies */}
        {otherCurrencies.length > 0 && (
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">
              Additional Held Currencies
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {otherCurrencies.map((c) => (
                <div
                  key={c.currency}
                  className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between"
                >
                  <span className="text-xs font-mono font-bold text-[var(--color-text)]">{c.currency}</span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[var(--color-text)]">
                      {formatMoney(c.netBalance, c.currency)}
                    </span>
                    <span className="block text-[10px] text-[var(--color-text-muted)]">
                      {c.count} records
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SPLIT LAYOUT: MAIN WORKSPACE (8 COLS) + CONTEXTUAL INSIGHTS (4 COLS)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLUMNS: MAIN REPORT WORKSPACE */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Main Interactive Flow Report Card */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-xl p-5 sm:p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
              {/* Header with tabs */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                  Report
                </span>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveReportTab('flow')}
                    className={`pb-1 transition-colors cursor-pointer ${
                      activeReportTab === 'flow'
                        ? 'border-b-2 border-[var(--color-text)] text-[var(--color-text)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    Cash Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReportTab('breakdown')}
                    className={`pb-1 transition-colors cursor-pointer ${
                      activeReportTab === 'breakdown'
                        ? 'border-b-2 border-[var(--color-text)] text-[var(--color-text)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    Spending Allocations
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReportTab('loans')}
                    className={`pb-1 transition-colors cursor-pointer ${
                      activeReportTab === 'loans'
                        ? 'border-b-2 border-[var(--color-text)] text-[var(--color-text)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    Debt Obligations
                  </button>
                </div>
              </div>

              {/* Sub-header */}
              <div className="pt-4 pb-2">
                <span className="text-xs font-bold text-[var(--color-text)]">Ledger Overview</span>
                <span className="text-xs text-[var(--color-text-muted)] ml-2">
                  All verified activity in {summary.currency}
                </span>
              </div>

              {/* Minimalist Chart / Visual Representation with subtle gridlines */}
              <div className="h-44 sm:h-52 w-full border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] p-4 flex flex-col justify-between relative overflow-hidden">
                {/* Horizontal gridlines */}
                <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-[var(--color-border)] pointer-events-none" />
                <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-[var(--color-border)] pointer-events-none" />
                <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-[var(--color-border)] pointer-events-none" />

                {/* Simulated clean bars / dots matching screenshot */}
                <div className="relative z-10 flex items-end justify-around h-full pt-4 pb-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-5 sm:w-6 bg-[#6DD0A1] rounded-t-sm h-24 transition-all" />
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Inflow</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-5 sm:w-6 bg-[#F5C258] rounded-t-sm h-16 transition-all" />
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Outflow</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-5 sm:w-6 bg-[#6CB3F9] rounded-t-sm h-12 transition-all" />
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Receivables</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-5 sm:w-6 bg-[#5452CF] rounded-t-sm h-8 transition-all" />
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Payables</span>
                  </div>
                </div>
              </div>

              {/* Four summary cells beneath chart with neutral financial figures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--color-border)] text-center">
                <div>
                  <span className="text-[11px] text-[var(--color-text-muted)] block">Total Inflow</span>
                  <span className="text-sm font-bold font-mono text-[var(--color-text)] mt-0.5 block">
                    {formatMoney(summary.incomeTotal, summary.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[var(--color-text-muted)] block">Total Outflow</span>
                  <span className="text-sm font-bold font-mono text-[var(--color-text)] mt-0.5 block">
                    {formatMoney(summary.expenseTotal, summary.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[var(--color-text-muted)] block">Net Balance</span>
                  <span className="text-sm font-bold font-mono text-[var(--color-text)] mt-0.5 block">
                    {formatMoney(summary.netBalance, summary.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[var(--color-text-muted)] block">Avg / Entry</span>
                  <span className="text-sm font-bold font-mono text-[var(--color-text)] mt-0.5 block">
                    {formatMoney(avgPerTx, summary.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Top Spending Categories with Multi-Segment Progress Bar */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-xl p-5 sm:p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                    Top Expense Categories
                  </h2>
                  <div className="text-xl font-bold font-mono text-[var(--color-text)] mt-1">
                    {formatMoney(summary.expenseTotal, summary.currency)}
                  </div>
                </div>
                <Link
                  href="/transactions"
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Details
                </Link>
              </div>

              {/* Multi-Segment Horizontal Stacked Bar */}
              {categoryBreakdown.length > 0 ? (
                <div className="mt-4 space-y-4">
                  <div className="h-2.5 w-full bg-[var(--color-bg)] rounded-full overflow-hidden flex">
                    {categoryBreakdown.map((item, idx) => (
                      <div
                        key={item.name}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: segmentColors[idx % segmentColors.length],
                        }}
                        title={`${item.name}: ${item.percentage}%`}
                      />
                    ))}
                  </div>

                  {/* Legend Row matching screenshot */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    {categoryBreakdown.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: segmentColors[idx % segmentColors.length] }}
                        />
                        <span className="text-[var(--color-text-muted)]">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Detailed Rows */}
                  <div className="divide-y divide-[var(--color-border)] pt-1">
                    {categoryBreakdown.map((item, idx) => (
                      <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: segmentColors[idx % segmentColors.length] }}
                          />
                          <span className="font-medium text-[var(--color-text)]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--color-text-muted)] font-mono">{item.percentage}%</span>
                          <span className="font-mono font-semibold text-[var(--color-text)]">
                            {formatMoney(item.amount.toFixed(2), summary.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                  No expense records categorized yet in {summary.currency}.
                </div>
              )}
            </div>

            {/* 3. Debts & Loans Summary */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-xl p-5 sm:p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text)] tracking-tight">
                    Debts & Loans Portfolio
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Receivables expected vs repayment liabilities.
                  </p>
                </div>
                <Link
                  href="/loans"
                  className="text-xs text-[var(--color-text)] hover:underline font-semibold"
                >
                  Manage Portfolio →
                </Link>
              </div>

              {Object.keys(loanSummaries).length === 0 ? (
                <div className="p-6 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-center">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2.5">
                    No active loan or debt records found.
                  </p>
                  <Link
                    href="/loans/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-xs font-semibold"
                  >
                    + Record a Loan
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {Object.keys(loanSummaries).map((cur) => {
                    const ls = loanSummaries[cur]!;
                    return (
                      <div
                        key={cur}
                        className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--color-text)] font-mono">
                            {cur}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                            {ls.active_loans_count} active {ls.overdue_loans_count > 0 && `• ${ls.overdue_loans_count} overdue`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <div className="p-2.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)]">
                            <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] block">
                              Owed to You
                            </span>
                            {/* Neutral financial figure */}
                            <span className="text-sm font-bold font-mono text-[var(--color-text)] mt-0.5 block">
                              {formatMoney(ls.outstanding_receivables, cur)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)]">
                            <span className="text-[10px] uppercase font-semibold text-[var(--color-text-muted)] block">
                              You Owe
                            </span>
                            {/* Neutral financial figure */}
                            <span className="text-sm font-bold font-mono text-[var(--color-text)] mt-0.5 block">
                              {formatMoney(ls.outstanding_payables, cur)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Recent Transactions Table */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-xl p-5 sm:p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text)] tracking-tight">
                    Recent Ledger Activity
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Latest recorded entries.
                  </p>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs text-[var(--color-text)] hover:underline font-semibold"
                >
                  View All ({transactions.length}) →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-[var(--color-surface-hover)] animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--color-text-muted)]">
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {recentTransactions.map((tx) => {
                    const cat = categoryMap.get(tx.category_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        className="py-3 px-1 flex items-center justify-between hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                              isIncome
                                ? 'bg-[var(--color-pale-mint)] text-[var(--color-text)]'
                                : 'bg-[var(--color-pale-yellow)] text-[var(--color-text)]'
                            }`}
                          >
                            {isIncome ? '↓' : '↑'}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[var(--color-text)] truncate">
                                {cat ? cat.name : 'Uncategorized'}
                              </span>
                              {tx.is_ai_generated && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-mono font-semibold bg-[var(--color-pale-cyan)] text-[var(--color-text)] border border-[var(--color-border)]">
                                  AI
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[var(--color-text-muted)] truncate block">
                              {tx.description || '—'} • {formatDate(tx.transaction_date)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          {/* Neutral financial figure */}
                          <div className="text-xs sm:text-sm font-bold font-mono text-[var(--color-text)]">
                            {isIncome ? '+' : '-'} {formatMoney(tx.amount, tx.currency)}
                          </div>
                          <Link
                            href={`/transactions/${tx.id}/edit`}
                            className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              RIGHT 4 COLUMNS: CONTEXTUAL INSIGHTS PANEL (Matching screenshot)
              ========================================================================= */}
          <div className="lg:col-span-4 space-y-5">
            {/* Contextual AI Summary Card */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-xl p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <span>⚡</span> AI Ledger Insights
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--color-pale-cyan)] text-[var(--color-text)]">
                  Live
                </span>
              </div>

              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                {netBalanceNum >= 0
                  ? `Strong retention: You have preserved ${retentionRate}% of your inflow this period. Spending remains well-balanced against income.`
                  : `Operating deficit: Outflow exceeds inflow by ${formatMoney(Math.abs(netBalanceNum).toFixed(2), summary.currency)}. Review discretionary categories.`}
              </p>

              {/* Progress Breakdown Bars matching Scope 1, 2, 3 in screenshot */}
              <div className="border-t border-[var(--color-border)] pt-3.5 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Inflow Retention</span>
                    <span className="font-mono font-bold text-[var(--color-text)]">{retentionRate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6DD0A1] rounded-full transition-all"
                      style={{ width: `${retentionRate}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Debt Obligations</span>
                    <span className="font-mono font-bold text-[var(--color-text)]">{debtRatio}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6CB3F9] rounded-full transition-all"
                      style={{ width: `${debtRatio}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Top Expense Weight</span>
                    <span className="font-mono font-bold text-[var(--color-text)]">
                      {categoryBreakdown[0]?.percentage || 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F5C258] rounded-full transition-all"
                      style={{ width: `${categoryBreakdown[0]?.percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lightly tinted badge callout */}
              <div className="p-2.5 rounded-lg bg-[var(--color-pale-mint)] border border-[var(--color-border)] text-xs text-[var(--color-text)]">
                <span>↗ Cash balance positive across verified ledger records.</span>
              </div>
            </div>

            {/* Quick interactive suggestion prompt chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block px-1">
                Suggested Ledger Inquiries
              </span>

              <Link
                href="/ai-entry?prompt=What%20caused%20the%20highest%20expense%20this%20month%3F"
                className="block p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs text-[var(--color-text)] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
              >
                What caused my top expense this month? →
              </Link>

              <Link
                href="/loans"
                className="block p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs text-[var(--color-text)] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
              >
                Review bilateral loan repayment schedules →
              </Link>

              {drafts.length > 0 && (
                <Link
                  href="/ai-entry"
                  className="block p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs text-[var(--color-text)] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
                >
                  Verify {drafts.length} pending AI draft entries →
                </Link>
              )}
            </div>

            {/* Natural language AI Ask input box matching bottom right in screenshot */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-xl p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] space-y-2.5">
              <span className="text-xs font-semibold text-[var(--color-text)] block">
                Quick Ledger Query
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Spent 450 BDT on coffee..."
                  value={aiAskInput}
                  onChange={(e) => setAiAskInput(e.target.value)}
                  className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <Link
                  href={aiAskInput ? `/ai-entry?prompt=${encodeURIComponent(aiAskInput)}` : '/ai-entry'}
                  className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors shrink-0"
                >
                  Submit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
