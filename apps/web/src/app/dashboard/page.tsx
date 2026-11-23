'use client';

/*
 * Overview — one question: "Is my money OK over this range, and what is driving it?"
 * Numbers: net cash flow, inflow, outflow, transactions (each vs the previous window of the same length).
 * Problems: drafts waiting, overdue loans, outflow above inflow. Each sits on the data with its action beside it.
 * Deviations from the dashboard-design pattern:
 *  - Tooltips use the native `title` attribute; the app has no shared tooltip component yet.
 *  - Monthly cash flow always shows 12 months; the range control drives the KPIs, trend and categories.
 */

import { useEffect, useState, useMemo, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  listAllTransactions,
  listDrafts,
  getLoanSummary,
  getBudgetProgress,
  Transaction,
  AiDraft,
  CurrencyLoanSummary,
  BudgetProgressItem,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { fetchCategories, Category } from '@/lib/categories';
import {
  aggregateMonthlyCashFlow,
  aggregateSpendingTrend,
  aggregateCategoryBreakdown,
  getCurrenciesFromTransactions,
  type BudgetItemProgress,
} from '@/lib/chart-aggregation';
import {
  rangeWindow,
  fetchStart,
  sumWindow,
  delta,
  parseTxDate,
  type KpiRange,
} from '@/lib/dashboard-metrics';
import { IncomeExpenseChart, SpendingTrendChart, BudgetProgressChart } from '@/components/charts';
import { KpiStrip, type KpiTile } from '@/components/dashboard/kpi-strip';
import {
  Button,
  ButtonLink,
  EmptyState,
  Input,
  PageHeader,
  SegmentedControl,
  Select,
  Skeleton,
} from '@/components/ui';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  FileClock,
  ReceiptText,
  Sparkles,
} from 'lucide-react';

const RANGE_OPTIONS: { value: KpiRange; label: string; baseline: string }[] = [
  { value: '7d', label: '7 days', baseline: 'prev 7 days' },
  { value: '30d', label: '30 days', baseline: 'prev 30 days' },
  { value: '6m', label: '6 months', baseline: 'prev period' },
];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [complete, setComplete] = useState(true);
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loanSummaries, setLoanSummaries] = useState<Record<string, CurrencyLoanSummary>>({});
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgressItem[]>([]);
  const [range, setRange] = useState<KpiRange>('30d');
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

  useEffect(() => {
    if (!nowDate) return;
    let mounted = true;

    async function loadDashboardData(now: Date) {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) return;

        const [cats, txRes, draftRes, loanSummaryRes, budgetRes] = await Promise.all([
          fetchCategories(),
          listAllTransactions(token, isoDate(fetchStart(now))),
          listDrafts(token).catch(() => ({ data: [], total: 0 })),
          getLoanSummary(token).catch(() => ({ currencies: {} })),
          getBudgetProgress(token, now.getFullYear(), now.getMonth() + 1).catch(() => []),
        ]);

        if (mounted) {
          setCategories(cats);
          setTransactions(txRes.data);
          setComplete(txRes.complete);
          setDrafts(draftRes.data || []);
          setLoanSummaries(loanSummaryRes.currencies || {});
          setBudgetProgress(budgetRes || []);

          const distinctCurrencies = getCurrenciesFromTransactions(txRes.data);
          if (txRes.data.length > 0 && !distinctCurrencies.includes(selectedCurrency)) {
            setSelectedCurrency(distinctCurrencies[0]);
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboardData(nowDate);

    return () => {
      mounted = false;
    };
    // `selectedCurrency` is only read to pick an initial value; adding it would
    // refetch the whole dashboard every time the user switches currency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, reloadToken, nowDate]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const allCurrencies = useMemo(() => {
    const set = new Set<string>(getCurrenciesFromTransactions(transactions));
    for (const cur of Object.keys(loanSummaries)) set.add(cur);
    return Array.from(set);
  }, [transactions, loanSummaries]);

  const win = useMemo(() => (nowDate ? rangeWindow(range, nowDate) : null), [range, nowDate]);

  // Rows come newest first, so a window is fully fetched when the list is complete
  // or the oldest fetched row is older than the window's start.
  const oldestFetched = useMemo(() => {
    const last = transactions[transactions.length - 1];
    return last ? parseTxDate(last.transaction_date) : null;
  }, [transactions]);
  const covers = (start: Date) => complete || (oldestFetched !== null && oldestFetched < start);

  const current = useMemo(
    () => (win ? sumWindow(transactions, selectedCurrency, win.start, win.end) : null),
    [transactions, selectedCurrency, win],
  );
  const previous = useMemo(
    () => (win ? sumWindow(transactions, selectedCurrency, win.prevStart, win.prevEnd) : null),
    [transactions, selectedCurrency, win],
  );

  const totalsKnown = !loading && !error && current !== null && win !== null && covers(win.start);
  const deltasKnown = totalsKnown && win !== null && covers(win.prevStart);

  const inRange = useMemo(
    () =>
      win
        ? transactions.filter((tx) => {
            const d = parseTxDate(tx.transaction_date);
            return d !== null && d >= win.start && d < win.end;
          })
        : [],
    [transactions, win],
  );

  // shortcut: past the 2,000-row fetch cap the oldest months plot partial totals; add a per-month summary API if that ever matters.
  const monthlyCashFlowData = useMemo(
    () => aggregateMonthlyCashFlow(transactions, selectedCurrency),
    [transactions, selectedCurrency],
  );
  const spendingTrendData = useMemo(
    () => aggregateSpendingTrend(inRange, selectedCurrency, range, nowDate),
    [inRange, selectedCurrency, range, nowDate],
  );
  const categoryBreakdown = useMemo(
    () => aggregateCategoryBreakdown(inRange, categories, selectedCurrency),
    [inRange, categories, selectedCurrency],
  );

  const loanSummary = loanSummaries[selectedCurrency];
  const overdueCount = loanSummary?.overdue_loans_count ?? 0;

  const budgetChartData: BudgetItemProgress[] = useMemo(() => {
    return budgetProgress
      .filter((b) => b.currency === selectedCurrency)
      .map((b) => ({
        id: b.id,
        name: b.category_name ?? 'Overall',
        limit: parseFloat(b.limit_amount) || 0,
        spent: parseFloat(b.spent_amount) || 0,
        remaining: parseFloat(b.remaining_amount) || 0,
        percent: b.percent,
        isOverBudget: b.is_over_budget,
      }));
  }, [budgetProgress, selectedCurrency]);

  const recentTransactions = transactions.slice(0, 6);
  const baseline = RANGE_OPTIONS.find((r) => r.value === range)!.baseline;

  const rawMetaName = user?.user_metadata?.name;
  const metaName =
    typeof rawMetaName === 'string' && rawMetaName.trim() ? rawMetaName.trim() : null;

  const handleAskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = aiAskInput.trim();
    router.push(prompt ? `/ai-entry?prompt=${encodeURIComponent(prompt)}` : '/ai-entry');
  };

  const money = (n: number) => formatMoney(n.toFixed(2), selectedCurrency);
  const keptPct =
    current && current.income > 0 ? Math.round((current.net / current.income) * 100) : null;
  const avgExpense =
    current && current.expenseCount > 0 ? current.expense / current.expenseCount : null;

  const kpiTiles: KpiTile[] = [
    {
      label: 'Net cash flow',
      value: totalsKnown && current ? money(current.net) : null,
      bad: !!current && current.net < 0,
      delta: deltasKnown && current && previous ? delta(current.net, previous.net, 'higher') : null,
      prevLabel: previous ? money(previous.net) : '',
      title:
        keptPct !== null
          ? `Inflow minus outflow. Kept ${keptPct}% of inflow.`
          : 'Inflow minus outflow.',
    },
    {
      label: 'Inflow',
      value: totalsKnown && current ? money(current.income) : null,
      delta: deltasKnown && current && previous ? delta(current.income, previous.income, 'higher') : null,
      prevLabel: previous ? money(previous.income) : '',
      title: 'Income and deposits',
      icon: <ArrowDownLeft strokeWidth={1.5} aria-hidden="true" />,
    },
    {
      label: 'Outflow',
      value: totalsKnown && current ? money(current.expense) : null,
      delta: deltasKnown && current && previous ? delta(current.expense, previous.expense, 'lower') : null,
      prevLabel: previous ? money(previous.expense) : '',
      title: 'Spending and payments',
      icon: <ArrowUpRight strokeWidth={1.5} aria-hidden="true" />,
    },
    {
      label: 'Transactions',
      value: totalsKnown && current ? String(current.count) : null,
      delta: deltasKnown && current && previous ? delta(current.count, previous.count, 'neutral') : null,
      prevLabel: previous ? String(previous.count) : '',
      title: avgExpense !== null ? `Average expense ${money(avgExpense)}` : 'No expenses in range',
      icon: <ReceiptText strokeWidth={1.5} aria-hidden="true" />,
    },
  ];

  const hasAttention = drafts.length > 0 || overdueCount > 0;
  const maxCategory = categoryBreakdown[0]?.amount ?? 0;

  return (
    <AppShell wide>
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          meta={
            <span className="flex min-h-5 max-w-full flex-wrap items-center gap-x-2 gap-y-1">
              {today ? <span>{today.label}</span> : null}
              {today && metaName ? (
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

        {/* Toolbar: one global range and currency for every number below. */}
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Date range"
            size="sm"
            value={range}
            onChange={setRange}
            options={RANGE_OPTIONS.map(({ value, label }) => ({ value, label }))}
          />
          {allCurrencies.length > 1 &&
            (allCurrencies.length <= 4 ? (
              <SegmentedControl
                label="Currency"
                size="sm"
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                options={allCurrencies.map((c) => ({ value: c, label: c }))}
              />
            ) : (
              <div className="w-24">
                <Select
                  aria-label="Currency"
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
            ))}
          {!loading && !error && (
            <span
              className="ml-auto inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
              title="Loaded when you opened this page"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-income)]" aria-hidden="true" />
              Updated
            </span>
          )}
        </div>

        {/* One page-level note for a failed load or a capped fetch. */}
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-subtle)] px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <AlertTriangle className="h-4 w-4 text-[var(--color-danger)]" aria-hidden="true" />
              Couldn&apos;t load totals
            </span>
            <Button variant="secondary" size="sm" onClick={() => setReloadToken((t) => t + 1)}>
              Retry
            </Button>
          </div>
        )}

        {/* Attention: noun + number + action, only when something waits. */}
        {hasAttention && (
          <div className="grid gap-3 sm:grid-cols-2">
            {drafts.length > 0 && (
              <AttentionItem
                icon={<FileClock className="h-4 w-4" aria-hidden="true" />}
                label={`${drafts.length} AI draft${drafts.length === 1 ? '' : 's'}`}
                detail="unsaved"
                href="/ai-entry"
                action="Review"
              />
            )}
            {overdueCount > 0 && (
              <AttentionItem
                icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
                label={`${overdueCount} overdue loan${overdueCount === 1 ? '' : 's'}`}
                detail={selectedCurrency}
                href="/loans?status=overdue"
                action="View"
              />
            )}
          </div>
        )}

        <KpiStrip label="Cash flow summary" tiles={kpiTiles} baseline={baseline} loading={loading} />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Main view: where the money went over time. */}
          <div className="space-y-6 lg:col-span-8">
            <SpendingTrendChart
              data={spendingTrendData}
              currency={selectedCurrency}
              selectedRange={range}
              loading={loading}
            />
            <IncomeExpenseChart
              data={monthlyCashFlowData}
              currency={selectedCurrency}
              loading={loading}
            />
            <BudgetProgressChart
              data={budgetChartData}
              currency={selectedCurrency}
              loading={loading}
            />
          </div>

          {/* Breakdowns: categories and loans. */}
          <div className="space-y-6 lg:col-span-4">
            <section
              aria-labelledby="top-categories"
              className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xs)] sm:p-5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="top-categories" className="text-card-title">
                  Top categories
                </h2>
                <span className="text-xs text-[var(--color-text-muted)]">Outflow</span>
              </div>
              {loading ? (
                <div className="mt-3 space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="w-full" style={{ height: 28 }} />
                  ))}
                </div>
              ) : categoryBreakdown.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">No spending in range</p>
              ) : (
                <ul className="mt-2 -mx-2">
                  {categoryBreakdown.slice(0, 6).map((c) => (
                    <li
                      key={c.categoryId}
                      className="group relative flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-2 pb-1.5 hover:bg-[var(--color-surface-hover)]"
                      title={`${c.categoryName} · ${money(c.amount)} · ${c.count} expense${c.count === 1 ? '' : 's'}`}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text)]">
                        {c.categoryName}
                      </span>
                      <span className="text-sm tabular-nums text-[var(--color-text)]">{money(c.amount)}</span>
                      <span className="w-10 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                        {c.percentage < 1 ? '<1%' : `${c.percentage}%`}
                      </span>
                      <span
                        className="absolute inset-x-2 bottom-1 h-[3px] rounded-full bg-[var(--color-border)]"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full bg-[var(--color-primary-text)] opacity-75 group-hover:opacity-100"
                          style={{ width: `${maxCategory > 0 ? (c.amount / maxCategory) * 100 : 0}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              aria-labelledby="loans-summary"
              className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xs)] sm:p-5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="loans-summary" className="text-card-title">
                  Loans
                </h2>
                <Link href="/loans" className="link-quiet text-xs">
                  View all
                </Link>
              </div>
              {loading ? (
                <Skeleton className="mt-3 w-full" style={{ height: 56 }} />
              ) : !loanSummary ? (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">No loans in {selectedCurrency}</p>
              ) : (
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <div title="Lent and not yet repaid">
                    <dt className="text-xs text-[var(--color-text-muted)]">Owed to you</dt>
                    <dd className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--color-text)]">
                      {formatMoney(loanSummary.outstanding_receivables, selectedCurrency)}
                    </dd>
                  </div>
                  <div title="Borrowed and not yet repaid">
                    <dt className="text-xs text-[var(--color-text-muted)]">You owe</dt>
                    <dd className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--color-text)]">
                      {formatMoney(loanSummary.outstanding_payables, selectedCurrency)}
                    </dd>
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--color-border)] pt-2 text-xs tabular-nums text-[var(--color-text-muted)]">
                    <span>{loanSummary.active_loans_count} active</span>
                    <span>{loanSummary.settled_loans_count} settled</span>
                    {overdueCount > 0 && (
                      <span className="font-medium text-[var(--color-warning)]">▲ {overdueCount} overdue</span>
                    )}
                  </div>
                </dl>
              )}
            </section>

            <section
              aria-labelledby="ask-heading"
              className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xs)] sm:p-5"
            >
              <h2 id="ask-heading" className="text-card-title">
                Ask
              </h2>
              <form onSubmit={handleAskSubmit} className="mt-3 flex gap-2">
                <Input
                  aria-label="Ask about your spending"
                  type="text"
                  name="prompt"
                  value={aiAskInput}
                  onChange={(e) => setAiAskInput(e.target.value)}
                  placeholder="Transport spend last month?"
                />
                <Button type="submit" variant="primary" size="sm" className="shrink-0">
                  Ask
                </Button>
              </form>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Biggest expense this month', 'Spend vs last month'].map((q) => (
                  <Link
                    key={q}
                    href={`/ai-entry?prompt=${encodeURIComponent(q)}`}
                    className="rounded-[var(--radius-full)] border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  >
                    {q}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Recent activity */}
        <section
          aria-labelledby="recent-heading"
          className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xs)] sm:p-5"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="recent-heading" className="text-card-title">
              Recent activity
            </h2>
            <Link href="/transactions" className="link-quiet inline-flex items-center gap-1 text-xs">
              All transactions <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {loading ? (
            <ul className="mt-2 divide-y divide-[var(--color-border)]">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-8 w-8 shrink-0" />
                  <Skeleton className="flex-1" style={{ height: 14 }} />
                  <Skeleton className="h-4 w-20 shrink-0" />
                </li>
              ))}
            </ul>
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              icon={<ReceiptText aria-hidden="true" />}
              title="No transactions yet"
              description="Transactions appear here after the first one is added."
              action={
                <ButtonLink href="/transactions/new" variant="primary" size="sm">
                  Add transaction
                </ButtonLink>
              }
            />
          ) : (
            <ul className="mt-2 divide-y divide-[var(--color-border)]">
              {recentTransactions.map((tx) => {
                const cat = categoryMap.get(tx.category_id);
                const isIncome = tx.type === 'income';
                return (
                  <li key={tx.id}>
                    <Link
                      href={`/transactions/${tx.id}/edit`}
                      className="-mx-2 flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]">
                        {isIncome ? (
                          <ArrowDownLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-[var(--color-text)]">
                            {cat ? cat.name : 'Uncategorized'}
                          </span>
                          {tx.is_ai_generated && (
                            <span className="rounded-[var(--radius-xs)] border border-[var(--color-border)] px-1 text-[10px] text-[var(--color-text-muted)]">
                              AI
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-[var(--color-text-muted)]">
                          {tx.description ? `${tx.description} · ` : ''}
                          <span className="tabular-nums">{formatDate(tx.transaction_date)}</span>
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-sm font-medium tabular-nums ${
                          isIncome ? 'text-[var(--color-income)]' : 'text-[var(--color-text)]'
                        }`}
                      >
                        <span className="sr-only">{isIncome ? 'Inflow of' : 'Outflow of'} </span>
                        {isIncome ? '+' : '−'}
                        {formatMoney(tx.amount, tx.currency)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function AttentionItem({
  icon,
  label,
  detail,
  href,
  action,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] px-4 py-2.5">
      <span className="text-[var(--color-warning)]">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium text-[var(--color-text)]">{label}</span>
        <span className="text-[var(--color-text-muted)]"> · {detail}</span>
      </span>
      <ButtonLink href={href} variant="secondary" size="sm">
        {action}
      </ButtonLink>
    </div>
  );
}
