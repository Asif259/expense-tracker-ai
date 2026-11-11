'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  listLoans,
  getLoanSummary,
  deleteLoan,
  recordLoanRepayment,
  Loan,
  CurrencyLoanSummary,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from '@/components/toast';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  HandCoins,
  Plus,
  RotateCcw,
  SearchX,
  Trash2,
  X,
} from 'lucide-react';
import { LoanBalanceChart, RepaymentHistoryChart } from '@/components/charts';
import { aggregateLoanPortfolio, aggregateRepaymentHistory } from '@/lib/chart-aggregation';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
  StatStrip,
  Metric,
} from '@/components/ui';
import type { BadgeTone } from '@/components/ui';

const PAYMENT_METHODS: Record<Loan['payment_method'], string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  cash: 'Cash',
  bank: 'Bank',
  other: 'Other',
};

function statusTone(status: Loan['status']): BadgeTone {
  if (status === 'settled') return 'neutral';
  if (status === 'overdue') return 'warning';
  return 'accent';
}

function statusLabel(status: Loan['status']): string {
  if (status === 'settled') return 'Settled';
  if (status === 'overdue') return 'Overdue';
  return 'Active';
}

function progressColor(status: Loan['status']): string {
  if (status === 'settled') return 'bg-[var(--color-income)]';
  if (status === 'overdue') return 'bg-[var(--color-warning)]';
  return 'bg-[var(--color-primary)]';
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

/** Rows-only skeleton; the summary and charts render their own loading shells. */
function LoanRowsSkeleton() {
  return (
    <div className="surface-card overflow-hidden" aria-busy="true" aria-label="Loading loans">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 border-b border-[var(--color-border)] px-4 py-4 last:border-b-0 sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_auto] lg:items-center"
        >
          <div className="space-y-2">
            <div className="skeleton h-4 w-40 max-w-full" />
            <div className="skeleton h-3 w-28" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-3 w-32 max-w-full" />
          </div>
          <div className="skeleton col-span-2 h-1.5 w-full rounded-full lg:col-span-1" />
          <div className="skeleton col-span-2 ml-auto h-8 w-24 rounded-[var(--radius-md)] lg:col-span-1" />
        </div>
      ))}
    </div>
  );
}

export default function LoansPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [summaries, setSummaries] = useState<Record<string, CurrencyLoanSummary>>({});

  // Filter state
  const [directionFilter, setDirectionFilter] = useState<'' | 'lent' | 'borrowed'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'overdue' | 'settled'>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Repayment dialog state
  const [repaymentTarget, setRepaymentTarget] = useState<Loan | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentDate, setRepaymentDate] = useState('');
  const [repaymentMethod, setRepaymentMethod] = useState<Loan['payment_method']>('bkash');
  const [repaymentReference, setRepaymentReference] = useState('');
  const [repaymentErrors, setRepaymentErrors] = useState<{ amount?: string; date?: string }>({});
  const [repaying, setRepaying] = useState(false);
  const repaymentDialogRef = useRef<HTMLDivElement>(null);
  const repayingRef = useRef(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [summaryRes, listRes] = await Promise.all([
        getLoanSummary(token),
        listLoans(token, {
          direction: directionFilter || undefined,
          status: statusFilter || undefined,
          search: searchQuery.trim() || undefined,
          limit: 100,
        }),
      ]);

      setSummaries(summaryRes.currencies || {});
      setLoans(listRes.data || []);
      setTotal(listRes.total || 0);
      setLoadError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not load your loans. Try again.';
      setLoadError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [getToken, directionFilter, statusFilter, searchQuery]);

  useEffect(() => {
    void (async () => {
      await loadData();
    })();
  }, [loadData]);

  useEffect(() => {
    repayingRef.current = repaying;
  }, [repaying]);

  const hasFilters = Boolean(directionFilter || statusFilter || searchQuery.trim());

  const resetFilters = () => {
    setDirectionFilter('');
    setStatusFilter('');
    setSearchQuery('');
  };

  const openRepaymentDialog = (loan: Loan) => {
    setRepaymentTarget(loan);
    setRepaymentAmount('');
    setRepaymentErrors({});
    setRepaymentReference('');
    setRepaymentDate(new Date().toISOString().split('T')[0]);
  };

  const closeRepaymentDialog = useCallback(() => {
    setRepaymentTarget(null);
    setRepaymentErrors({});
    setRepaymentReference('');
  }, []);

  // Dialog behaviour: scroll lock, initial focus, Escape, focus trap, focus restore.
  useEffect(() => {
    if (!repaymentTarget) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const first =
        repaymentDialogRef.current?.querySelector<HTMLElement>('#repayment-amount') ??
        repaymentDialogRef.current?.querySelector<HTMLElement>('button, input, select');
      first?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!repayingRef.current) closeRepaymentDialog();
        return;
      }
      if (event.key !== 'Tab' || !repaymentDialogRef.current) return;

      const focusable = Array.from(
        repaymentDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [repaymentTarget, closeRepaymentDialog]);

  const remainingAfterPayment = useMemo(() => {
    if (!repaymentTarget) return 0;
    const balance = Number(repaymentTarget.outstanding_balance);
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) return balance;
    return Math.max(balance - amount, 0);
  }, [repaymentTarget, repaymentAmount]);

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repaymentTarget) return;

    const amount = parseFloat(repaymentAmount);
    const nextErrors: { amount?: string; date?: string } = {};

    if (isNaN(amount) || amount <= 0) {
      nextErrors.amount = 'Enter an amount greater than zero.';
    } else if (amount > Number(repaymentTarget.outstanding_balance)) {
      nextErrors.amount = `Enter no more than the remaining balance of ${formatMoney(
        repaymentTarget.outstanding_balance,
        repaymentTarget.currency,
      )}.`;
    }
    if (!repaymentDate) {
      nextErrors.date = 'Choose the date the payment was made.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setRepaymentErrors(nextErrors);
      return;
    }

    setRepaymentErrors({});
    setRepaying(true);
    try {
      const token = await getToken();
      if (!token) return;

      await recordLoanRepayment(token, repaymentTarget.id, {
        amount: repaymentAmount,
        payment_date: repaymentDate,
        payment_method: repaymentMethod,
        reference: repaymentReference.trim() || undefined,
      });

      toast('Repayment recorded', 'success');
      setRepaymentAmount('');
      closeRepaymentDialog();
      loadData();
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : 'Could not record the repayment. Try again.',
        'error',
      );
    } finally {
      setRepaying(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = await getToken();
      if (!token) return;

      await deleteLoan(token, deleteTarget.id);
      toast('Loan deleted', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not delete the loan. Try again.', 'error');
    }
  };

  const currenciesList = useMemo(() => Object.keys(summaries), [summaries]);
  const [selectedCurrencyState, setSelectedCurrencyState] = useState<string>('');
  const [showCharts, setShowCharts] = useState(true);

  const chartCurrency = useMemo(() => {
    if (selectedCurrencyState && currenciesList.includes(selectedCurrencyState)) {
      return selectedCurrencyState;
    }
    return currenciesList[0] || 'BDT';
  }, [selectedCurrencyState, currenciesList]);

  const activeLoanSummary = useMemo(() => {
    const fromApi = summaries[chartCurrency];
    if (fromApi) {
      return {
        currency: chartCurrency,
        totalLent: fromApi.total_lent,
        totalBorrowed: fromApi.total_borrowed,
        repaidLent: fromApi.total_repaid_lent,
        repaidBorrowed: fromApi.total_repaid_borrowed,
        outstandingReceivables: fromApi.outstanding_receivables,
        outstandingPayables: fromApi.outstanding_payables,
        activeCount: fromApi.active_loans_count,
        settledCount: fromApi.settled_loans_count,
        overdueCount: fromApi.overdue_loans_count,
      };
    }
    return aggregateLoanPortfolio(loans, chartCurrency);
  }, [summaries, loans, chartCurrency]);

  const repaymentHistoryData = useMemo(() => {
    return aggregateRepaymentHistory(loans, chartCurrency);
  }, [loans, chartCurrency]);

  const currencySummary = summaries[chartCurrency];
  const overdueReceivables = currencySummary?.overdue_receivables ?? 0;
  const overduePayables = currencySummary?.overdue_payables ?? 0;
  const repaidTotal = activeLoanSummary.repaidLent + activeLoanSummary.repaidBorrowed;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Debts & loans"
          description="Track money you lent and money you borrowed, and record repayments against each person."
          actions={
            <>
              {currenciesList.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => setShowCharts((value) => !value)}
                  aria-pressed={showCharts}
                  leadingIcon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
                >
                  {showCharts ? 'Hide charts' : 'Show charts'}
                </Button>
              )}
              <ButtonLink
                href="/loans/new"
                variant="primary"
                className="order-first w-full sm:order-none sm:w-auto"
                leadingIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
              >
                New loan
              </ButtonLink>
            </>
          }
        />

        {/* Portfolio summary + charts */}
        {(loading || currenciesList.length > 0) && (
          <section aria-labelledby="portfolio-heading" className="space-y-4">
            <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border-sky)] bg-gradient-to-b from-[#f2f8ff] to-[var(--color-surface)] p-1.5 shadow-[var(--shadow-sm)] dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
              <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h2 id="portfolio-heading" className="text-section-title">
                      Portfolio
                    </h2>
                    <p className="text-secondary mt-0.5">
                      Outstanding balances and repayment activity in {chartCurrency}.
                    </p>
                  </div>
                  {currenciesList.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="chart-currency" className="text-label">
                        Currency
                      </label>
                      <div className="w-24">
                        <Select
                          id="chart-currency"
                          value={chartCurrency}
                          onChange={(e) => setSelectedCurrencyState(e.target.value)}
                        >
                          {currenciesList.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {loading && currenciesList.length === 0 ? (
                  <div
                    className="grid grid-cols-1 gap-4 border-y border-[var(--color-border)] py-4 sm:grid-cols-2 lg:grid-cols-4"
                    aria-hidden="true"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2 px-4">
                        <div className="skeleton h-3 w-20" />
                        <div className="skeleton h-7 w-32 max-w-full" />
                        <div className="skeleton h-3 w-24" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <StatStrip>
                    <div className="p-4 sm:px-5">
                      <Metric
                        label="To collect"
                        value={formatMoney(activeLoanSummary.outstandingReceivables, chartCurrency)}
                        hint={
                          overdueReceivables > 0 ? (
                            <span className="text-[var(--color-warning)]">
                              {formatMoney(overdueReceivables, chartCurrency)} overdue
                            </span>
                          ) : (
                            'Nothing overdue'
                          )
                        }
                        icon={<ArrowDownLeft aria-hidden="true" />}
                      />
                    </div>
                    <div className="p-4 sm:px-5">
                      <Metric
                        label="To repay"
                        value={formatMoney(activeLoanSummary.outstandingPayables, chartCurrency)}
                        hint={
                          overduePayables > 0 ? (
                            <span className="text-[var(--color-warning)]">
                              {formatMoney(overduePayables, chartCurrency)} overdue
                            </span>
                          ) : (
                            'Nothing overdue'
                          )
                        }
                        icon={<ArrowUpRight aria-hidden="true" />}
                      />
                    </div>
                    <div className="p-4 sm:px-5">
                      <p className="text-label text-[var(--color-text-muted)]">Active loans</p>
                      <p className="text-metric-sm mt-1.5 tabular-nums">
                        {activeLoanSummary.activeCount}
                      </p>
                      <p className="text-caption mt-1">
                        {activeLoanSummary.overdueCount} overdue · {activeLoanSummary.settledCount}{' '}
                        settled
                      </p>
                    </div>
                    <div className="p-4 sm:px-5">
                      <p className="text-label text-[var(--color-text-muted)]">Totals</p>
                      <dl className="mt-1.5 space-y-1 text-secondary">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                          <dt>Lent</dt>
                          <dd className="tabular-nums text-[var(--color-text)]">
                            {formatMoney(activeLoanSummary.totalLent, chartCurrency)}
                          </dd>
                        </div>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                          <dt>Borrowed</dt>
                          <dd className="tabular-nums text-[var(--color-text)]">
                            {formatMoney(activeLoanSummary.totalBorrowed, chartCurrency)}
                          </dd>
                        </div>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                          <dt>Repaid</dt>
                          <dd className="tabular-nums text-[var(--color-text)]">
                            {formatMoney(repaidTotal, chartCurrency)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </StatStrip>
                )}
              </div>
            </div>

            {showCharts && (
              <div className="grid gap-4 lg:grid-cols-2">
                <LoanBalanceChart
                  summary={activeLoanSummary}
                  currency={chartCurrency}
                  loading={loading}
                />
                <RepaymentHistoryChart
                  data={repaymentHistoryData}
                  currency={chartCurrency}
                  loading={loading}
                />
              </div>
            )}
          </section>
        )}

        {/* Filter toolbar */}
        <Card padding="md">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] lg:items-end">
            <Field id="loan-direction-filter" label="Direction">
              <Select
                id="loan-direction-filter"
                value={directionFilter}
                onChange={(e) =>
                  setDirectionFilter(e.target.value as '' | 'lent' | 'borrowed')
                }
              >
                <option value="">All directions</option>
                <option value="lent">I lent money</option>
                <option value="borrowed">I borrowed money</option>
              </Select>
            </Field>
            <Field id="loan-status-filter" label="Status">
              <Select
                id="loan-status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as '' | 'active' | 'overdue' | 'settled')
                }
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="settled">Settled</option>
              </Select>
            </Field>
            <Field id="loan-search" label="Search">
              <Input
                id="loan-search"
                type="search"
                placeholder="Name, contact, or notes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Field>
            <div className="flex items-center lg:justify-end lg:pb-0.5">
              <Button
                variant="ghost"
                onClick={resetFilters}
                disabled={!hasFilters}
                leadingIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                Reset filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Loan list */}
        <section aria-labelledby="loans-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="loans-heading" className="text-section-title">
              Loans
            </h2>
            {!loading && !loadError && (
              <p className="text-secondary tabular-nums">
                {total === 1 ? '1 loan' : `${total} loans`}
                {hasFilters ? ' matching filters' : ''}
              </p>
            )}
          </div>

          {loading ? (
            <LoanRowsSkeleton />
          ) : loadError ? (
            <Card padding="lg">
              <ErrorState
                title="Could not load loans"
                description={loadError}
                onRetry={() => {
                  setLoading(true);
                  void loadData();
                }}
              />
            </Card>
          ) : loans.length === 0 ? (
            <Card padding="lg">
              {hasFilters ? (
                <EmptyState
                  icon={<SearchX aria-hidden="true" />}
                  title="No loans match these filters"
                  description="Try a different name or clear the filters to see all of your loans."
                  action={
                    <Button variant="secondary" size="sm" onClick={resetFilters}>
                      Reset filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<HandCoins aria-hidden="true" />}
                  title="No loans yet"
                  description="Record money you lent or borrowed to start tracking what is still outstanding."
                  action={
                    <ButtonLink
                      href="/loans/new"
                      variant="secondary"
                      size="sm"
                      leadingIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                    >
                      Record your first loan
                    </ButtonLink>
                  }
                />
              )}
            </Card>
          ) : (
            <div className="surface-card overflow-hidden">
              <ul role="list" className="divide-y divide-[var(--color-border)]">
                {loans.map((loan) => {
                  const isSettled = loan.status === 'settled';
                  const progress = clampPct(loan.progress_pct);

                  return (
                    <li key={loan.id}>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_auto] lg:items-center lg:gap-4">
                        {/* Person + direction/status */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/loans/${loan.id}`}
                              className="min-w-0 truncate text-card-title transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-primary-text)] hover:underline"
                            >
                              {loan.person_name}
                            </Link>
                            <Badge tone="outline" dot>
                              {loan.direction === 'lent' ? 'Lent' : 'Borrowed'}
                            </Badge>
                            <Badge tone={statusTone(loan.status)} dot>
                              {statusLabel(loan.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-caption">
                            {loan.person_contact && (
                              <span className="truncate">{loan.person_contact}</span>
                            )}
                            <span className="tabular-nums">
                              Loan {formatDate(loan.loan_date)}
                            </span>
                            <span>{PAYMENT_METHODS[loan.payment_method]}</span>
                          </p>
                        </div>

                        {/* Outstanding balance */}
                        <div className="min-w-0 text-right">
                          <p className="text-caption lg:hidden">
                            {loan.direction === 'lent'
                              ? 'Remaining to collect'
                              : 'Remaining to repay'}
                          </p>
                          <p className="text-metric-sm tabular-nums">
                            {formatMoney(loan.outstanding_balance, loan.currency)}
                          </p>
                          <p className="mt-0.5 hidden text-caption tabular-nums sm:block">
                            of {formatMoney(loan.principal_amount, loan.currency)} · repaid{' '}
                            {formatMoney(loan.total_repaid, loan.currency)}
                          </p>
                        </div>

                        {/* Progress + due date */}
                        <div className="col-span-2 min-w-0 lg:col-span-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-caption">
                            <span className="tabular-nums">{progress}% repaid</span>
                            <span
                              className={
                                loan.status === 'overdue'
                                  ? 'font-medium text-[var(--color-warning)]'
                                  : ''
                              }
                            >
                              {loan.due_date
                                ? `Due ${formatDate(loan.due_date)}`
                                : 'No due date'}
                            </span>
                          </div>
                          <div
                            role="progressbar"
                            aria-label={`${loan.person_name} repayment progress`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]"
                          >
                            <div
                              className={`h-full rounded-full transition-[width] duration-150 ${progressColor(loan.status)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Row actions */}
                        <div className="col-span-2 flex items-center justify-end gap-1.5 lg:col-span-1">
                          {!isSettled && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openRepaymentDialog(loan)}
                              leadingIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                            >
                              Repay
                            </Button>
                          )}
                          <IconButton
                            label={`Delete loan for ${loan.person_name}`}
                            size="sm"
                            onClick={() => setDeleteTarget(loan)}
                            className="text-[var(--color-text-subtle)]! hover:bg-[var(--color-danger-subtle)]! hover:text-[var(--color-danger)]!"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </IconButton>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Repayment dialog */}
        {repaymentTarget && (
          <div
            className="fixed inset-0 z-[80] flex animate-fade-in items-end justify-center bg-[var(--color-scrim)] sm:items-center sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !repaying) closeRepaymentDialog();
            }}
          >
            <div
              ref={repaymentDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="repayment-dialog-title"
              aria-describedby="repayment-dialog-context"
              onMouseDown={(event) => event.stopPropagation()}
              className="max-h-[calc(100dvh-1rem)] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-xl)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="repayment-dialog-title" className="text-section-title">
                    Record repayment
                  </h2>
                  <p id="repayment-dialog-context" className="text-secondary mt-1">
                    {repaymentTarget.direction === 'lent'
                      ? `Payment from ${repaymentTarget.person_name}`
                      : `Payment to ${repaymentTarget.person_name}`}
                  </p>
                </div>
                <IconButton
                  label="Close"
                  size="sm"
                  onClick={closeRepaymentDialog}
                  disabled={repaying}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>

              <div className="mt-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-label">Remaining balance</span>
                  <span className="text-metric-sm tabular-nums">
                    {formatMoney(
                      repaymentTarget.outstanding_balance,
                      repaymentTarget.currency,
                    )}
                  </span>
                </div>
                {parseFloat(repaymentAmount) > 0 && (
                  <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-[var(--color-border)] pt-2">
                    <span className="text-caption">After this payment</span>
                    <span className="text-caption tabular-nums">
                      {formatMoney(remainingAfterPayment, repaymentTarget.currency)}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleRecordRepayment} noValidate className="mt-4 space-y-4">
                <Field
                  id="repayment-amount"
                  label={`Amount (${repaymentTarget.currency})`}
                  required
                  error={repaymentErrors.amount}
                  hint="Pay any amount up to the remaining balance."
                >
                  <Input
                    id="repayment-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    max={Number(repaymentTarget.outstanding_balance)}
                    placeholder="0.00"
                    value={repaymentAmount}
                    invalid={Boolean(repaymentErrors.amount)}
                    onChange={(e) => {
                      setRepaymentAmount(e.target.value);
                      if (repaymentErrors.amount) {
                        setRepaymentErrors((prev) => ({ ...prev, amount: undefined }));
                      }
                    }}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="repayment-date"
                    label="Payment date"
                    required
                    error={repaymentErrors.date}
                  >
                    <Input
                      id="repayment-date"
                      type="date"
                      value={repaymentDate}
                      invalid={Boolean(repaymentErrors.date)}
                      onChange={(e) => {
                        setRepaymentDate(e.target.value);
                        if (repaymentErrors.date) {
                          setRepaymentErrors((prev) => ({ ...prev, date: undefined }));
                        }
                      }}
                    />
                  </Field>
                  <Field id="repayment-method" label="Method">
                    <Select
                      id="repayment-method"
                      value={repaymentMethod}
                      onChange={(e) =>
                        setRepaymentMethod(e.target.value as Loan['payment_method'])
                      }
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                </div>

                <Field
                  id="repayment-reference"
                  label="Reference"
                  hint="Optional transaction ID or note."
                >
                  <Input
                    id="repayment-reference"
                    type="text"
                    placeholder="e.g. TRX123456"
                    value={repaymentReference}
                    onChange={(e) => setRepaymentReference(e.target.value)}
                  />
                </Field>

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={closeRepaymentDialog} disabled={repaying}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={repaying}>
                    Record repayment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete loan"
          message={`Delete the loan with ${deleteTarget?.person_name ?? 'this person'}? Its repayment history will be deleted too.`}
          confirmLabel="Delete loan"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </AppShell>
  );
}
