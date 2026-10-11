'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  listTransactions,
  listDrafts,
  getLoanSummary,
  listLoans,
  Transaction,
  AiDraft,
  Loan,
  CurrencyLoanSummary,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { fetchCategories, Category } from '@/lib/categories';
import {
  aggregateMonthlyCashFlow,
  aggregateSpendingTrend,
  aggregateCategoryBreakdown,
  aggregateLoanPortfolio,
  aggregateRepaymentHistory,
  aggregateBudgetProgress,
  getCurrenciesFromTransactions,
  DateRangePreset,
} from '@/lib/chart-aggregation';
import {
  IncomeExpenseChart,
  SpendingTrendChart,
  CategoryBreakdownChart,
  BudgetProgressChart,
  LoanBalanceChart,
  RepaymentHistoryChart,
} from '@/components/charts';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanSummaries, setLoanSummaries] = useState<Record<string, CurrencyLoanSummary>>({});
  const [activeReportTab, setActiveReportTab] = useState<'flow' | 'breakdown' | 'loans'>('flow');
  const [selectedRange, setSelectedRange] = useState<DateRangePreset>('30d');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('BDT');
  const [aiAskInput, setAiAskInput] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const [nowDate, setNowDate] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setNowDate(now);
    setCurrentDateFormatted(
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(now)
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

        const [cats, txRes, draftRes, loanSummaryRes, loanListRes] = await Promise.all([
          fetchCategories(),
          listTransactions(token, { limit: 100 }),
          listDrafts(token).catch(() => ({ data: [], total: 0 })),
          getLoanSummary(token).catch(() => ({ currencies: {} })),
          listLoans(token, { limit: 100 }).catch(() => ({ data: [], total: 0, limit: 100, offset: 0 })),
        ]);

        if (mounted) {
          setCategories(cats);
          const txList = txRes.data || [];
          setTransactions(txList);
          setDrafts(draftRes.data || []);
          setLoanSummaries(loanSummaryRes.currencies || {});
          setLoans(loanListRes.data || []);

          // Automatically select first available active currency if transactions exist
          const distinctCurrencies = getCurrenciesFromTransactions(txList);
          if (distinctCurrencies.length > 0 && !distinctCurrencies.includes(selectedCurrency)) {
            setSelectedCurrency(distinctCurrencies[0]);
          }
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

  // Extract distinct currency options
  const allCurrencies = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      if (tx.currency) set.add(tx.currency);
    }
    for (const cur of Object.keys(loanSummaries)) {
      set.add(cur);
    }
    if (set.size === 0) set.add('BDT');
    return Array.from(set);
  }, [transactions, loanSummaries]);

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
          currency: selectedCurrency,
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
  }, [transactions, selectedCurrency]);

  const currentSummary = useMemo(() => {
    const match = currencySummaries.find((s) => s.currency === selectedCurrency);
    if (match) return match;
    return {
      currency: selectedCurrency,
      incomeTotal: '0.00',
      expenseTotal: '0.00',
      netBalance: '0.00',
      count: 0,
    };
  }, [currencySummaries, selectedCurrency]);

  const otherCurrencies = useMemo(() => {
    return currencySummaries.filter((s) => s.currency !== selectedCurrency && s.count > 0);
  }, [currencySummaries, selectedCurrency]);

  // Chart datasets derived safely using pure aggregation functions
  const monthlyCashFlowData = useMemo(() => {
    return aggregateMonthlyCashFlow(transactions, selectedCurrency);
  }, [transactions, selectedCurrency]);

  const spendingTrendData = useMemo(() => {
    return aggregateSpendingTrend(transactions, selectedCurrency, selectedRange, nowDate);
  }, [transactions, selectedCurrency, selectedRange, nowDate]);

  const categoryBreakdownData = useMemo(() => {
    return aggregateCategoryBreakdown(transactions, categories, selectedCurrency);
  }, [transactions, categories, selectedCurrency]);

  const loanPortfolioSummary = useMemo(() => {
    const summaryFromApi = loanSummaries[selectedCurrency];
    if (summaryFromApi) {
      return {
        currency: selectedCurrency,
        totalLent: summaryFromApi.total_lent,
        totalBorrowed: summaryFromApi.total_borrowed,
        repaidLent: summaryFromApi.total_repaid_lent,
        repaidBorrowed: summaryFromApi.total_repaid_borrowed,
        outstandingReceivables: summaryFromApi.outstanding_receivables,
        outstandingPayables: summaryFromApi.outstanding_payables,
        activeCount: summaryFromApi.active_loans_count,
        settledCount: summaryFromApi.settled_loans_count,
        overdueCount: summaryFromApi.overdue_loans_count,
      };
    }
    return aggregateLoanPortfolio(loans, selectedCurrency);
  }, [loanSummaries, loans, selectedCurrency]);

  const repaymentHistoryData = useMemo(() => {
    return aggregateRepaymentHistory(loans, selectedCurrency);
  }, [loans, selectedCurrency]);

  // Budget progress data (using actual category totals vs empty/zero limits)
  const budgetProgressData = useMemo(() => {
    return aggregateBudgetProgress(transactions, [], selectedCurrency);
  }, [transactions, selectedCurrency]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const totalInflowNum = parseFloat(currentSummary.incomeTotal) || 0;
  const totalOutflowNum = parseFloat(currentSummary.expenseTotal) || 0;
  const netBalanceNum = parseFloat(currentSummary.netBalance) || 0;
  const avgPerTx = currentSummary.count > 0 ? (totalOutflowNum / currentSummary.count).toFixed(2) : '0.00';

  // Savings / Retention rate
  const retentionRate = totalInflowNum > 0
    ? Math.max(0, Math.min(100, Math.round(((totalInflowNum - totalOutflowNum) / totalInflowNum) * 100)))
    : 0;

  // Debt obligations ratio vs monthly inflow
  const debtRatio = totalInflowNum > 0 && loanPortfolioSummary
    ? Math.min(100, Math.round((Number(loanPortfolioSummary.outstandingPayables) / totalInflowNum) * 100))
    : 0;

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Josh';

  return (
    <AppShell>
      <div className="space-y-6">
        {/* =========================================================================
            HEADER & GREETING WITH CURRENCY SELECTOR
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[var(--color-text)] font-normal tracking-tight">
              Good Day, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
              {currentDateFormatted} • Verified financial intelligence ledger
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Currency Selector */}
            {allCurrencies.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                <Wallet className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Currency:</span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[var(--color-text)] focus:outline-none cursor-pointer"
                  aria-label="Select currency for charts and analytics"
                >
                  {allCurrencies.map((c) => (
                    <option key={c} value={c} className="bg-[var(--color-surface)] text-[var(--color-text)]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              href="/ai-entry"
              className="px-3.5 py-2 rounded-xl bg-[var(--color-pale-mint)] text-[var(--color-primary)] text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 border border-[var(--color-primary)]/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Quick Entry</span>
            </Link>

            <Link
              href="/loans/new"
              className="px-3.5 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>+ Record Loan</span>
            </Link>

            <Link
              href="/transactions/new"
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md active:scale-[0.98]"
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
                <Sparkles className="w-4 h-4" />
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
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between shadow-[var(--shadow-card)] hover:border-[var(--color-border-hover)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Net Cash Flow
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  netBalanceNum >= 0
                    ? 'bg-[var(--color-pale-mint)] text-[var(--color-primary)] border border-[var(--color-primary)]/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {netBalanceNum >= 0 ? '+ Positive' : '- Deficit'}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-metric">
                {loading ? (
                  <div className="h-8 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                ) : (
                  formatMoney(currentSummary.netBalance, currentSummary.currency)
                )}
              </div>
              <span className="text-caption mt-1 block">
                Inflow minus outflow in {currentSummary.currency}
              </span>
            </div>
          </div>

          {/* Total Income */}
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between shadow-[var(--shadow-card)] hover:border-[var(--color-border-hover)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Total Inflow
              </span>
              <span className="w-7 h-7 rounded-lg bg-[var(--color-pale-mint)] text-[var(--color-primary)] flex items-center justify-center text-xs font-bold">
                <ArrowDownLeft className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-metric">
                {loading ? (
                  <div className="h-8 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                ) : (
                  formatMoney(currentSummary.incomeTotal, currentSummary.currency)
                )}
              </div>
              <span className="text-caption mt-1 block">
                Recorded earnings & deposits
              </span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between shadow-[var(--shadow-card)] hover:border-[var(--color-border-hover)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Total Outflow
              </span>
              <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-metric">
                {loading ? (
                  <div className="h-8 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                ) : (
                  formatMoney(currentSummary.expenseTotal, currentSummary.currency)
                )}
              </div>
              <span className="text-caption mt-1 block">
                Recorded expenses & payments
              </span>
            </div>
          </div>

          {/* Transactions Count */}
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between shadow-[var(--shadow-card)] hover:border-[var(--color-border-hover)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Ledger Records
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-pale-cyan)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 tabular-nums">
                {currentSummary.currency}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-metric">
                {loading ? (
                  <div className="h-8 w-20 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                ) : (
                  currentSummary.count
                )}
              </div>
              <span className="text-caption mt-1 block">
                Audited ledger entries
              </span>
            </div>
          </div>
        </div>

        {/* Additional Held Currencies */}
        {otherCurrencies.length > 0 && (
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Additional Held Currencies
              </h4>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Click a currency to switch analytics view
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {otherCurrencies.map((c) => (
                <button
                  key={c.currency}
                  type="button"
                  onClick={() => setSelectedCurrency(c.currency)}
                  className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] transition-all flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-[var(--color-text)]">{c.currency}</span>
                  <div className="text-right">
                    <span className="text-xs tabular-nums font-bold text-[var(--color-text)] block">
                      {formatMoney(c.netBalance, c.currency)}
                    </span>
                    <span className="block text-[10px] text-[var(--color-text-muted)]">
                      {c.count} records • Click to view
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SPLIT LAYOUT: MAIN WORKSPACE (8 COLS) + CONTEXTUAL INSIGHTS (4 COLS)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLUMNS: MAIN CHART & REPORT WORKSPACE */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visual Analytics Tab Navigation */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl p-4 shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold tracking-tight text-[var(--color-text)]">
                Analytics Domain
              </span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-surface-hover)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveReportTab('flow')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeReportTab === 'flow'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Cash Flow & Trend
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReportTab('breakdown')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeReportTab === 'breakdown'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Allocations & Budgets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReportTab('loans')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeReportTab === 'loans'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Debt & Loans
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: CASH FLOW & SPENDING TREND */}
            {activeReportTab === 'flow' && (
              <div className="space-y-6">
                <IncomeExpenseChart
                  data={monthlyCashFlowData}
                  currency={selectedCurrency}
                  loading={loading}
                />

                <SpendingTrendChart
                  data={spendingTrendData}
                  currency={selectedCurrency}
                  selectedRange={selectedRange}
                  onRangeChange={setSelectedRange}
                  loading={loading}
                />
              </div>
            )}

            {/* TAB CONTENT 2: ALLOCATIONS & BUDGETS */}
            {activeReportTab === 'breakdown' && (
              <div className="space-y-6">
                <CategoryBreakdownChart
                  data={categoryBreakdownData}
                  currency={selectedCurrency}
                  loading={loading}
                />

                <BudgetProgressChart
                  data={budgetProgressData}
                  currency={selectedCurrency}
                  loading={loading}
                />
              </div>
            )}

            {/* TAB CONTENT 3: DEBT & LOANS OBLIGATIONS */}
            {activeReportTab === 'loans' && (
              <div className="space-y-6">
                <LoanBalanceChart
                  summary={loanPortfolioSummary}
                  currency={selectedCurrency}
                  loading={loading}
                />

                <RepaymentHistoryChart
                  data={repaymentHistoryData}
                  currency={selectedCurrency}
                  loading={loading}
                />
              </div>
            )}

            {/* Recent Ledger Activity Table */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-card)]">
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
                                <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-[var(--color-pale-cyan)] text-[var(--color-text)] border border-[var(--color-border)]">
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
                          <div className="text-xs sm:text-sm font-bold tabular-nums text-[var(--color-text)]">
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
              RIGHT 4 COLUMNS: CONTEXTUAL INSIGHTS PANEL
              ========================================================================= */}
          <div className="lg:col-span-4 space-y-5">
            {/* Contextual AI Summary Card */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl p-5 shadow-[var(--shadow-card)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Ledger Insights
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--color-pale-cyan)] text-[var(--color-text)]">
                  Live
                </span>
              </div>

              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                {netBalanceNum >= 0
                  ? `Strong retention: You have preserved ${retentionRate}% of your inflow this period in ${selectedCurrency}. Spending remains well-balanced against income.`
                  : `Operating deficit: Outflow exceeds inflow by ${formatMoney(Math.abs(netBalanceNum).toFixed(2), selectedCurrency)}. Review discretionary categories.`}
              </p>

              {/* Progress Breakdown Bars */}
              <div className="border-t border-[var(--color-border)] pt-3.5 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Inflow Retention</span>
                    <span className="tabular-nums font-bold text-[var(--color-text)]">{retentionRate}%</span>
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
                    <span className="tabular-nums font-bold text-[var(--color-text)]">{debtRatio}%</span>
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
                    <span className="tabular-nums font-bold text-[var(--color-text)]">
                      {categoryBreakdownData[0]?.percentage || 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F5C258] rounded-full transition-all"
                      style={{ width: `${categoryBreakdownData[0]?.percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lightly tinted badge callout */}
              <div className="p-2.5 rounded-lg bg-[var(--color-pale-mint)] border border-[var(--color-border)] text-xs text-[var(--color-text)] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                <span>Cash balance verified across records in {selectedCurrency}.</span>
              </div>
            </div>

            {/* Quick interactive suggestion prompt chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block px-1">
                Suggested Ledger Inquiries
              </span>

              <Link
                href="/ai-entry?prompt=What%20caused%20the%20highest%20expense%20this%20month%3F"
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs text-[var(--color-text)] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] cursor-pointer"
              >
                <span>What caused my top expense this month?</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
              </Link>

              <Link
                href="/loans"
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs text-[var(--color-text)] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] cursor-pointer"
              >
                <span>Review bilateral loan repayment schedules</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
              </Link>

              {drafts.length > 0 && (
                <Link
                  href="/ai-entry"
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs text-[var(--color-text)] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] cursor-pointer"
                >
                  <span>Verify {drafts.length} pending AI draft entries</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                </Link>
              )}
            </div>

            {/* Natural language AI Ask input box */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-xl p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] space-y-2.5">
              <span className="text-xs font-semibold text-[var(--color-text)] block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
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
                  className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span>Submit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
