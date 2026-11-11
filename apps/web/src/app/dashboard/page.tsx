'use client';

import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  Input,
  Metric,
  PageHeader,
  Section,
  SegmentedControl,
  Select,
  Skeleton,
} from '@/components/ui';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ReceiptText,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanSummaries, setLoanSummaries] = useState<Record<string, CurrencyLoanSummary>>({});
  const [activeReportTab, setActiveReportTab] = useState<'flow' | 'breakdown' | 'loans'>('flow');
  const [selectedRange, setSelectedRange] = useState<DateRangePreset>('30d');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('BDT');
  const [aiAskInput, setAiAskInput] = useState('');
  const [today, setToday] = useState<{ date: Date; label: string } | null>(null);

  // Resolved after mount so the server and client render the same empty meta.
  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only date, read once after hydration
    setToday({
      date: now,
      label: new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(now),
    });
  }, []);

  const nowDate = today?.date ?? null;
  const currentDateFormatted = today?.label ?? '';

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
    // `selectedCurrency` is only read to pick an initial value; adding it would
    // refetch the whole dashboard every time the user switches currency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, reloadToken]);

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
  const avgPerTx =
    currentSummary.count > 0 ? (totalOutflowNum / currentSummary.count).toFixed(2) : '0.00';

  // Savings / Retention rate
  const retentionRate =
    totalInflowNum > 0
      ? Math.max(
          0,
          Math.min(100, Math.round(((totalInflowNum - totalOutflowNum) / totalInflowNum) * 100)),
        )
      : 0;

  // Debt obligations ratio vs monthly inflow
  const debtRatio =
    totalInflowNum > 0 && loanPortfolioSummary
      ? Math.min(
          100,
          Math.round((Number(loanPortfolioSummary.outstandingPayables) / totalInflowNum) * 100),
        )
      : 0;

  const topCategory = categoryBreakdownData[0];

  // Use the real account name only when Supabase returns one — never invent one.
  const rawMetaName = user?.user_metadata?.name;
  const metaName =
    typeof rawMetaName === 'string' && rawMetaName.trim() ? rawMetaName.trim() : null;

  const handleRetry = () => {
    setReloadToken((token) => token + 1);
  };

  const handleAskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = aiAskInput.trim();
    router.push(prompt ? `/ai-entry?prompt=${encodeURIComponent(prompt)}` : '/ai-entry');
  };

  const reportOptions: { value: 'flow' | 'breakdown' | 'loans'; label: string }[] = [
    { value: 'flow', label: 'Cash flow' },
    { value: 'breakdown', label: 'Categories' },
    { value: 'loans', label: 'Loans' },
  ];

  const draftCountLabel = `${drafts.length} draft${drafts.length === 1 ? '' : 's'} to review`;

  // Don't present failed loads as measured zero totals.
  const totalsUnavailable = Boolean(error) && transactions.length === 0;

  const atAGlanceCopy = totalsUnavailable
    ? 'Totals are unavailable right now. Retry once your connection is back.'
    : totalInflowNum > 0 && netBalanceNum >= 0
      ? `You kept ${retentionRate}% of the ${formatMoney(
          currentSummary.incomeTotal,
          currentSummary.currency,
        )} that came in across ${currentSummary.count} transaction${
          currentSummary.count === 1 ? '' : 's'
        }.`
      : totalInflowNum > 0
        ? `You spent ${formatMoney(
            Math.abs(netBalanceNum).toFixed(2),
            currentSummary.currency,
          )} more than came in across ${currentSummary.count} transaction${
            currentSummary.count === 1 ? '' : 's'
          }.`
        : currentSummary.count > 0
          ? `No income recorded in ${currentSummary.currency} yet, and ${formatMoney(
              currentSummary.expenseTotal,
              currentSummary.currency,
            )} has gone out.`
          : `No transactions in ${currentSummary.currency} yet. Add one and this panel will fill in.`;

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Overview"
          meta={
            <span className="flex min-h-5 max-w-full flex-wrap items-center gap-x-2 gap-y-1 break-words">
              {currentDateFormatted ? <span>{currentDateFormatted}</span> : null}
              {currentDateFormatted && metaName ? (
                <span aria-hidden="true" className="text-[var(--color-text-subtle)]">
                  ·
                </span>
              ) : null}
              {metaName ? <span>{metaName}</span> : null}
            </span>
          }
          actions={
            <>
              <ButtonLink
                href="/ai-entry"
                variant="secondary"
                leadingIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
              >
                Add with AI
              </ButtonLink>

              <ButtonLink href="/loans/new" variant="ghost">
                Record a loan
              </ButtonLink>

              <ButtonLink
                href="/transactions/new"
                variant="primary"
                className="order-first w-full sm:order-none sm:w-auto"
              >
                New transaction
              </ButtonLink>
            </>
          }
        />

        {/* Load failure — plain language with a retry */}
        {error && (
          <Alert
            tone="danger"
            title="We couldn't load your dashboard"
            action={
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            }
          >
            Check your connection and try again. Nothing has been changed or lost.
          </Alert>
        )}

        {/* Drafts waiting for confirmation */}
        {drafts.length > 0 && (
          <Alert
            tone="info"
            title={draftCountLabel}
            action={
              <ButtonLink href="/ai-entry" variant="secondary" size="sm">
                Review drafts
              </ButtonLink>
            }
          >
            Nothing is saved until you confirm each draft.
          </Alert>
        )}

        {/* Net cash flow is the one dominant number; the rest are a quiet strip. */}
        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border-sky)] bg-gradient-to-b from-[#f2f8ff] to-[var(--color-surface)] p-1.5 shadow-[var(--shadow-sm)] dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
          <section
            aria-labelledby="cash-flow-summary"
            className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6"
          >
          <h2 id="cash-flow-summary" className="sr-only">
            Cash flow summary
          </h2>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <Metric
              label="Net cash flow"
              size="lg"
              className="min-w-0 break-words"
              value={
                loading ? (
                  <Skeleton className="w-44" style={{ height: 36 }} />
                ) : totalsUnavailable ? (
                  <span aria-label="Totals unavailable">—</span>
                ) : (
                  formatMoney(currentSummary.netBalance, currentSummary.currency)
                )
              }
              hint={`Inflow minus outflow in ${currentSummary.currency}`}
            />

            <div className="flex flex-wrap items-center gap-2">
              {allCurrencies.length > 1 && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="dashboard-currency"
                    className="text-label whitespace-nowrap text-[var(--color-text-muted)]"
                  >
                    Currency
                  </label>
                  <div className="w-24 shrink-0">
                    <Select
                      id="dashboard-currency"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                    >
                      {allCurrencies.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

              {loading ? (
                <Skeleton className="h-5 w-20" />
              ) : totalsUnavailable ? null : currentSummary.count === 0 ? (
                <Badge tone="neutral" dot>
                  No activity
                </Badge>
              ) : netBalanceNum === 0 ? (
                <Badge tone="neutral" dot>
                  Balanced
                </Badge>
              ) : (
                <Badge tone={netBalanceNum > 0 ? 'success' : 'danger'} dot>
                  {netBalanceNum > 0 ? 'In surplus' : 'In deficit'}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)] pt-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-4 sm:py-0 sm:pr-5">
              <Metric
                label="Inflow"
                className="min-w-0 break-words"
                value={
                  loading ? (
                    <Skeleton className="w-32" style={{ height: 26 }} />
                  ) : totalsUnavailable ? (
                    <span aria-label="Totals unavailable">—</span>
                  ) : (
                    formatMoney(currentSummary.incomeTotal, currentSummary.currency)
                  )
                }
                hint="Income and deposits"
              />
            </div>
            <div className="py-4 sm:px-5 sm:py-0">
              <Metric
                label="Outflow"
                className="min-w-0 break-words"
                value={
                  loading ? (
                    <Skeleton className="w-32" style={{ height: 26 }} />
                  ) : totalsUnavailable ? (
                    <span aria-label="Totals unavailable">—</span>
                  ) : (
                    formatMoney(currentSummary.expenseTotal, currentSummary.currency)
                  )
                }
                hint="Spending and payments"
              />
            </div>
            <div className="py-4 sm:pl-5 sm:py-0">
              <Metric
                label="Transactions"
                className="min-w-0 break-words"
                value={
                  loading ? (
                    <Skeleton className="w-16" style={{ height: 26 }} />
                  ) : totalsUnavailable ? (
                    <span aria-label="Totals unavailable">—</span>
                  ) : (
                    currentSummary.count
                  )
                }
                hint={
                  loading ? (
                    <Skeleton className="w-40" style={{ height: 12 }} />
                  ) : currentSummary.count > 0 ? (
                    `Average ${formatMoney(avgPerTx, currentSummary.currency)} per transaction`
                  ) : (
                    'Nothing recorded yet'
                  )
                }
              />
            </div>
          </div>
          </section>
        </div>

        {/* Other currencies held in the account */}
        {otherCurrencies.length > 0 && (
          <Section
            title="Other currencies"
            description={`You also have activity in ${otherCurrencies.length} other ${
              otherCurrencies.length === 1 ? 'currency' : 'currencies'
            }.`}
          >
            <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {otherCurrencies.map((c) => (
                <li key={c.currency}>
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency(c.currency)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="text-card-title">{c.currency}</span>
                      <span className="text-caption truncate">
                        {c.count} transaction{c.count === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-card-title tabular-nums">
                        {formatMoney(c.netBalance, c.currency)}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 text-[var(--color-text-subtle)]"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Show the dashboard in {c.currency}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Main workspace: charts + recent activity */}
          <div className="space-y-8 lg:col-span-8">
            <Section
              title="Charts"
              actions={
                <SegmentedControl
                  label="Chart view"
                  size="sm"
                  value={activeReportTab}
                  onChange={setActiveReportTab}
                  options={reportOptions}
                />
              }
            >
              <div className="space-y-6">
                {activeReportTab === 'flow' && (
                  <>
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
                  </>
                )}

                {activeReportTab === 'breakdown' && (
                  <>
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
                  </>
                )}

                {activeReportTab === 'loans' && (
                  <>
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
                  </>
                )}
              </div>
            </Section>

            <Section
              title="Recent activity"
              actions={
                <ButtonLink href="/transactions" variant="ghost" size="sm">
                  View all transactions
                </ButtonLink>
              }
            >
              {loading ? (
                <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex items-center gap-3 py-3">
                      <Skeleton className="h-8 w-8 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="w-32" style={{ height: 14 }} />
                        <Skeleton className="w-48" style={{ height: 12 }} />
                      </div>
                      <Skeleton className="h-4 w-20 shrink-0" />
                    </li>
                  ))}
                </ul>
              ) : recentTransactions.length === 0 ? (
                <EmptyState
                  icon={<ReceiptText aria-hidden="true" />}
                  title="No transactions yet"
                  description="Add your first transaction and your cash flow, categories and recent activity will appear here."
                  action={
                    <ButtonLink href="/transactions/new" variant="primary" size="sm">
                      Add your first transaction
                    </ButtonLink>
                  }
                />
              ) : (
                <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  {recentTransactions.map((tx) => {
                    const cat = categoryMap.get(tx.category_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between gap-3 py-3 transition-colors duration-[var(--duration-fast)]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                              isIncome
                                ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                                : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            )}
                          </span>

                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="text-card-title truncate">
                                {cat ? cat.name : 'Uncategorized'}
                              </span>
                              {tx.is_ai_generated && <Badge tone="outline">AI entry</Badge>}
                            </div>
                            <p className="text-caption truncate">
                              {tx.description || 'No description'} ·{' '}
                              <span className="tabular-nums">
                                {formatDate(tx.transaction_date)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-card-title tabular-nums">
                            <span className="sr-only">{isIncome ? 'Inflow of' : 'Outflow of'}</span>{' '}
                            {isIncome ? '+' : '−'}&nbsp;
                            {formatMoney(tx.amount, tx.currency)}
                          </span>
                          <Link
                            href={`/transactions/${tx.id}/edit`}
                            className="link-quiet text-label whitespace-nowrap"
                          >
                            Edit
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          </div>

          {/* Context column: a calm summary and question entry */}
          <div className="space-y-8 lg:col-span-4">
            <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border-sky)] bg-gradient-to-b from-[#f2f8ff] to-[var(--color-surface)] p-1.5 shadow-[var(--shadow-sm)] dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
              <Card className="rounded-[var(--radius-xl)] p-5">
                <h2 className="text-card-title">At a glance</h2>

              <div className="text-secondary mt-1.5">
                {loading ? (
                  <Skeleton lines={2} />
                ) : (
                  <p>{atAGlanceCopy}</p>
                )}
              </div>

              <dl className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                <div className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-secondary">Kept from inflow</dt>
                    <dd className="text-label tabular-nums text-[var(--color-text)]">
                      {loading ? <Skeleton className="w-8" style={{ height: 12 }} /> : `${retentionRate}%`}
                    </dd>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-sunken)]"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-[var(--radius-full)] bg-[var(--color-primary)]"
                      style={{ width: `${loading ? 0 : retentionRate}%` }}
                    />
                  </div>
                </div>

                <div className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-secondary">Outstanding debt vs inflow</dt>
                    <dd className="text-label tabular-nums text-[var(--color-text)]">
                      {loading ? <Skeleton className="w-8" style={{ height: 12 }} /> : `${debtRatio}%`}
                    </dd>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-sunken)]"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-[var(--radius-full)] bg-[var(--color-warning)]"
                      style={{ width: `${loading ? 0 : debtRatio}%` }}
                    />
                  </div>
                  <p className="text-caption mt-1.5">
                    {loading
                      ? ''
                      : loanPortfolioSummary && Number(loanPortfolioSummary.outstandingPayables) > 0
                        ? `You owe ${formatMoney(
                            loanPortfolioSummary.outstandingPayables,
                            currentSummary.currency,
                          )} in total.`
                        : 'No outstanding loan balance.'}
                  </p>
                </div>

                <div className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-secondary">Top spending category</dt>
                    <dd className="text-label tabular-nums text-[var(--color-text)]">
                      {loading ? (
                        <Skeleton className="w-8" style={{ height: 12 }} />
                      ) : topCategory ? (
                        `${topCategory.percentage}%`
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-sunken)]"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-[var(--radius-full)] bg-[var(--color-expense)]"
                      style={{ width: `${loading ? 0 : (topCategory?.percentage ?? 0)}%` }}
                    />
                  </div>
                  <p className="text-caption mt-1.5 truncate">
                    {loading
                      ? ''
                      : topCategory
                        ? `${topCategory.categoryName} · ${formatMoney(
                            topCategory.amount,
                            currentSummary.currency,
                          )}`
                        : 'No expenses in this currency yet.'}
                  </p>
                </div>
              </dl>
              </Card>
            </div>

            <Section title="Ask about your spending">
              <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                <li>
                  <Link
                    href="/ai-entry?prompt=What%20caused%20the%20highest%20expense%20this%20month%3F"
                    className="flex cursor-pointer items-center justify-between gap-3 py-2.5 text-secondary transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text)]"
                  >
                    <span>What was my biggest expense this month?</span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-[var(--color-text-subtle)]"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/loans"
                    className="flex cursor-pointer items-center justify-between gap-3 py-2.5 text-secondary transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text)]"
                  >
                    <span>Check my loan repayment schedule</span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-[var(--color-text-subtle)]"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
                {drafts.length > 0 && (
                  <li>
                    <Link
                      href="/ai-entry"
                      className="flex cursor-pointer items-center justify-between gap-3 py-2.5 text-secondary transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text)]"
                    >
                      <span>Review {drafts.length} draft entries</span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-[var(--color-text-subtle)]"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                )}
              </ul>

              <form onSubmit={handleAskSubmit} className="space-y-3">
                <Field
                  id="dashboard-question"
                  label="Ask a question"
                  hint="Opens the quick-add page with your question ready to send."
                >
                  <Input
                    id="dashboard-question"
                    type="text"
                    name="prompt"
                    value={aiAskInput}
                    onChange={(e) => setAiAskInput(e.target.value)}
                    placeholder="How much did I spend on transport last month?"
                  />
                </Field>
                <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto">
                  Ask
                </Button>
              </form>
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
