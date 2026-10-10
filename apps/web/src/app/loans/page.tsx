'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
import { formatMoney } from '@/lib/format';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from '@/components/toast';
import Link from 'next/link';
import { Plus, ArrowRight, ArrowDownLeft, ArrowUpRight, AlertCircle, Trash2, X, BarChart3 } from 'lucide-react';
import { LoanBalanceChart, RepaymentHistoryChart } from '@/components/charts';
import { aggregateLoanPortfolio, aggregateRepaymentHistory } from '@/lib/chart-aggregation';

export default function LoansPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [summaries, setSummaries] = useState<Record<string, CurrencyLoanSummary>>({});

  // Filter state
  const [directionFilter, setDirectionFilter] = useState<'' | 'lent' | 'borrowed'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'overdue' | 'settled'>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Repayment Modal state
  const [repaymentTarget, setRepaymentTarget] = useState<Loan | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentDate, setRepaymentDate] = useState('');
  const [repaymentMethod, setRepaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('bkash');
  const [repaymentReference, setRepaymentReference] = useState('');
  const [repaying, setRepaying] = useState(false);

  // Delete modal state
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
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to load debt and loan data', 'error');
    } finally {
      setLoading(false);
    }
  }, [getToken, directionFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repaymentTarget) return;

    const amt = parseFloat(repaymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast('Please enter a valid repayment amount greater than zero.', 'error');
      return;
    }

    if (amt > Number(repaymentTarget.outstanding_balance)) {
      toast(`Repayment exceeds remaining balance of ${formatMoney(repaymentTarget.outstanding_balance, repaymentTarget.currency)}`, 'error');
      return;
    }

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

      toast('Repayment recorded successfully!', 'success');
      setRepaymentTarget(null);
      setRepaymentAmount('');
      setRepaymentReference('');
      loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to record repayment', 'error');
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
      toast('Loan record deleted.', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete loan', 'error');
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

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-page-title">
              Debt & Loan Management
            </h1>
            <p className="text-secondary mt-1">
              Track money you lent to others and money you borrowed with partial repayment history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currenciesList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCharts(!showCharts)}
                className="inline-flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
                <span>{showCharts ? 'Hide Visual Analytics' : 'Show Visual Analytics'}</span>
              </button>
            )}

            <Link
              href="/loans/new"
              className="inline-flex items-center gap-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-[var(--color-primary)]/15 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Loan</span>
            </Link>
          </div>
        </div>

        {/* Visual Chart Analytics Section */}
        {showCharts && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-section-title">
                Portfolio Analytics & Velocity
              </h2>
              {currenciesList.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[var(--color-text-muted)]">Currency:</span>
                  <select
                    value={chartCurrency}
                    onChange={(e) => setSelectedCurrencyState(e.target.value)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 font-semibold text-[var(--color-text)]"
                  >
                    {currenciesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div>
        )}


        {/* Currency Summary Metric Cards */}
        {currenciesList.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-dim)]">
              Outstanding Balances by Currency
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currenciesList.map((cur) => {
                const s = summaries[cur]!;
                return (
                  <div
                    key={cur}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-lg">
                        {cur}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {s.active_loans_count + s.overdue_loans_count} active
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-[var(--color-text-muted)] flex items-center justify-between">
                          <span>You Are Owed (Receivables)</span>
                          <span className="w-5 h-5 rounded bg-[var(--color-pale-mint)] text-[var(--color-text)] flex items-center justify-center">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--color-mint)]" />
                          </span>
                        </div>
                        <div className="text-metric-sm mt-0.5">
                          {formatMoney(s.outstanding_receivables, cur)}
                        </div>
                        {s.overdue_receivables > 0 && (
                          <div className="text-[11px] text-[var(--color-warning)] mt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{formatMoney(s.overdue_receivables, cur)} overdue</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[var(--color-border)]">
                        <div className="text-xs text-[var(--color-text-muted)] flex items-center justify-between">
                          <span>You Owe (Payables)</span>
                          <span className="w-5 h-5 rounded bg-[var(--color-pale-yellow)] text-[var(--color-text)] flex items-center justify-center">
                            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-amber)]" />
                          </span>
                        </div>
                        <div className="text-metric-sm mt-0.5">
                          {formatMoney(s.outstanding_payables, cur)}
                        </div>
                        {s.overdue_payables > 0 && (
                          <div className="text-[11px] text-[var(--color-warning)] mt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{formatMoney(s.overdue_payables, cur)} overdue</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !loading ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center text-sm text-[var(--color-text-muted)]">
            No active debts or loans recorded yet. Click &quot;+ New Loan&quot; to log your first lent or borrowed money.
          </div>
        ) : null}

        {/* Filter Bar */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Direction & Status tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                setDirectionFilter('');
                setStatusFilter('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                !directionFilter && !statusFilter
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-sm'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              All Loans ({total})
            </button>
            <button
              onClick={() => setDirectionFilter(directionFilter === 'lent' ? '' : 'lent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                directionFilter === 'lent'
                  ? 'bg-[var(--color-pale-mint)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              I Lent Money
            </button>
            <button
              onClick={() => setDirectionFilter(directionFilter === 'borrowed' ? '' : 'borrowed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                directionFilter === 'borrowed'
                  ? 'bg-[var(--color-pale-yellow)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              I Borrowed Money
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'active' ? '' : 'active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-[var(--color-pale-cyan)] border border-[var(--color-border)] text-[var(--color-text)]'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'overdue' ? '' : 'overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'overdue'
                  ? 'bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/30 text-[var(--color-text)]'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Overdue
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'settled' ? '' : 'settled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'settled'
                  ? 'bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-dim)]'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Settled
            </button>
          </div>

          {/* Search */}
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search person or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Loans List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center">
            <p className="text-base font-semibold text-[var(--color-text)]">No loans matching your filter</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Try resetting filters or create a new loan record.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loans.map((loan) => {
              const isLent = loan.direction === 'lent';
              const isOverdue = loan.status === 'overdue';
              const isSettled = loan.status === 'settled';

              return (
                <div
                  key={loan.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col justify-between hover:border-[var(--color-border-hover)] transition-colors shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Top Row: Person & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/loans/${loan.id}`}
                          className="font-bold text-base text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                        >
                          {loan.person_name}
                        </Link>
                        {loan.person_contact && (
                          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {loan.person_contact}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isLent
                              ? 'bg-[var(--color-pale-mint)] text-[var(--color-text)]'
                              : 'bg-[var(--color-pale-yellow)] text-[var(--color-text)]'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isLent ? 'bg-[var(--color-mint)]' : 'bg-[var(--color-amber)]'}`} />
                          {isLent ? 'Lent' : 'Borrowed'}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize border ${
                            isSettled
                              ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-dim)] border-[var(--color-border)]'
                              : isOverdue
                              ? 'bg-[var(--color-pale-yellow)] text-[var(--color-text)] border-[var(--color-border)]'
                              : 'bg-[var(--color-pale-cyan)] text-[var(--color-text)] border-[var(--color-border)]'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Outstanding vs Principal */}
                    <div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {isLent ? 'Remaining to Collect:' : 'Remaining to Repay:'}
                      </div>
                      <div className="text-2xl font-extrabold tabular-nums text-[var(--color-text)] mt-0.5 tracking-tight">
                        {formatMoney(loan.outstanding_balance, loan.currency)}
                      </div>
                      <div className="text-xs text-[var(--color-text-dim)] mt-1 tabular-nums">
                        Principal: {formatMoney(loan.principal_amount, loan.currency)} • Repaid:{' '}
                        {formatMoney(loan.total_repaid, loan.currency)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSettled
                              ? 'bg-[var(--color-mint)]'
                              : isOverdue
                              ? 'bg-[var(--color-amber)]'
                              : 'bg-[var(--color-soft-blue)]'
                          }`}
                          style={{ width: `${loan.progress_pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-[var(--color-text-muted)]">
                        <span>{loan.progress_pct}% repaid</span>
                        {loan.due_date && (
                          <span className={isOverdue ? 'text-[var(--color-warning)] font-semibold' : ''}>
                            Due: {loan.due_date}
                          </span>
                        )}
                      </div>
                    </div>

                    {loan.notes && (
                      <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] p-2.5 rounded-xl italic line-clamp-2">
                        &quot;{loan.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-4 mt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                    <Link
                      href={`/loans/${loan.id}`}
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>History & Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      {!isSettled && (
                        <button
                          onClick={() => {
                            setRepaymentTarget(loan);
                            setRepaymentAmount('');
                            setRepaymentDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Repay</span>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(loan)}
                        className="p-1.5 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                        title="Delete Loan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Record Repayment Modal */}
        {repaymentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  Record Repayment
                </h3>
                <button
                  onClick={() => setRepaymentTarget(null)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[var(--color-bg)] p-3.5 rounded-xl space-y-1 text-xs">
                <div className="text-[var(--color-text-muted)]">
                  Loan with: <strong className="text-[var(--color-text)]">{repaymentTarget.person_name}</strong> ({repaymentTarget.direction})
                </div>
                <div className="text-[var(--color-text-muted)]">
                  Current Balance:{' '}
                  <strong className="text-[var(--color-text)]">
                    {formatMoney(repaymentTarget.outstanding_balance, repaymentTarget.currency)}
                  </strong>
                </div>
              </div>

              <form onSubmit={handleRecordRepayment} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                    Repayment Amount ({repaymentTarget.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(repaymentTarget.outstanding_balance)}
                    required
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(e.target.value)}
                    placeholder="e.g. 500.00"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={repaymentDate}
                      onChange={(e) => setRepaymentDate(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                      Method
                    </label>
                    <select
                      value={repaymentMethod}
                      onChange={(e) => setRepaymentMethod(e.target.value as 'cash' | 'bkash' | 'nagad' | 'bank' | 'other')}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] capitalize cursor-pointer"
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                    Reference / Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={repaymentReference}
                    onChange={(e) => setRepaymentReference(e.target.value)}
                    placeholder="e.g. TRX123456"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRepaymentTarget(null)}
                    className="w-1/2 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={repaying}
                    className="w-1/2 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {repaying ? 'Recording...' : 'Confirm Repayment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Loan Record"
          message={`Are you sure you want to delete the loan with "${deleteTarget?.person_name}"? All repayment history for this loan will also be deleted.`}
          confirmLabel="Delete Loan"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </AppShell>
  );
}
