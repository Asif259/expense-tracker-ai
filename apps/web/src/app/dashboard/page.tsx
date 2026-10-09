'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  listTransactions,
  listDrafts,
  Transaction,
  AiDraft,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { fetchCategories, Category } from '@/lib/categories';
import Link from 'next/link';

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) return;

        const [cats, txRes, draftRes] = await Promise.all([
          fetchCategories(),
          listTransactions(token, { limit: 100 }),
          listDrafts(token).catch(() => ({ data: [], total: 0 })),
        ]);

        if (mounted) {
          setCategories(cats);
          setTransactions(txRes.data || []);
          setDrafts(draftRes.data || []);
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

  // Financial summary computation using string-safe / numeric calculation
  const summary = useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    const baseCurrency = transactions[0]?.currency || 'BDT';

    for (const tx of transactions) {
      const num = parseFloat(tx.amount) || 0;
      if (tx.type === 'income') {
        incomeTotal += num;
      } else {
        expenseTotal += num;
      }
    }

    const netBalance = incomeTotal - expenseTotal;

    return {
      incomeTotal: incomeTotal.toFixed(2),
      expenseTotal: expenseTotal.toFixed(2),
      netBalance: netBalance.toFixed(2),
      currency: baseCurrency,
      count: transactions.length,
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Overview of your income, expenses, and AI drafts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ai-entry"
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-medium transition-colors flex items-center gap-2"
            >
              <span>🤖</span>
              <span>AI Quick Entry</span>
            </Link>
            <Link
              href="/transactions/new"
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>Add Transaction</span>
            </Link>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-4 rounded-xl border border-[var(--color-danger)]/50 bg-[var(--color-expense-bg)] text-xs text-[var(--color-expense)] flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pending AI Drafts Alert */}
        {drafts.length > 0 && (
          <div className="p-4 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {drafts.length} Pending AI Draft{drafts.length > 1 ? 's' : ''} Awaiting Confirmation
                </h4>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Drafts generated by AI are never recorded without your approval.
                </p>
              </div>
            </div>
            <Link
              href="/ai-entry"
              className="px-3.5 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold self-start sm:self-auto transition-colors"
            >
              Review Drafts →
            </Link>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Balance */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between">
            <span className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider">
              Net Balance
            </span>
            <div className="mt-3">
              <div
                className={`text-2xl font-bold font-mono tracking-tight ${
                  parseFloat(summary.netBalance) >= 0
                    ? 'text-[var(--color-income)]'
                    : 'text-[var(--color-expense)]'
                }`}
              >
                {loading ? (
                  <div className="h-8 w-28 bg-[var(--color-border)] animate-pulse rounded" />
                ) : (
                  formatMoney(summary.netBalance, summary.currency)
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-dim)] mt-1 block">
                Cash Flow
              </span>
            </div>
          </div>

          {/* Total Income */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between">
            <span className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider">
              Total Income
            </span>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-[var(--color-income)] tracking-tight">
                {loading ? (
                  <div className="h-8 w-28 bg-[var(--color-border)] animate-pulse rounded" />
                ) : (
                  formatMoney(summary.incomeTotal, summary.currency)
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-dim)] mt-1 block">
                Recorded earnings
              </span>
            </div>
          </div>

          {/* Total Expense */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between">
            <span className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-[var(--color-expense)] tracking-tight">
                {loading ? (
                  <div className="h-8 w-28 bg-[var(--color-border)] animate-pulse rounded" />
                ) : (
                  formatMoney(summary.expenseTotal, summary.currency)
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-dim)] mt-1 block">
                Recorded spending
              </span>
            </div>
          </div>

          {/* Activity Count */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between">
            <span className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider">
              Transactions
            </span>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-[var(--color-text)] tracking-tight">
                {loading ? (
                  <div className="h-8 w-16 bg-[var(--color-border)] animate-pulse rounded" />
                ) : (
                  summary.count
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-dim)] mt-1 block">
                Active ledger entries
              </span>
            </div>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Recent Transactions</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Latest activity recorded in your verified ledger.
              </p>
            </div>
            <Link
              href="/transactions"
              className="text-xs text-[var(--color-primary)] hover:underline font-medium"
            >
              View All ({transactions.length}) →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-[var(--color-border)]/40 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                No transactions recorded yet.
              </p>
              <Link
                href="/ai-entry"
                className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Create your first transaction with AI
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {recentTransactions.map((tx) => {
                const cat = categoryMap.get(tx.category_id);
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex items-center justify-between hover:bg-[var(--color-surface-hover)] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm ${
                          isIncome
                            ? 'bg-[var(--color-income-bg)] text-[var(--color-income)]'
                            : 'bg-[var(--color-expense-bg)] text-[var(--color-expense)]'
                        }`}
                      >
                        {isIncome ? '↓' : '↑'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--color-text)]">
                            {cat ? cat.name : 'Unknown Category'}
                          </span>
                          {tx.is_ai_generated && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                              AI
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--color-text-dim)]">
                          {tx.description || 'No description'} • {formatDate(tx.transaction_date)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-semibold font-mono ${
                          isIncome
                            ? 'text-[var(--color-income)]'
                            : 'text-[var(--color-expense)]'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatMoney(tx.amount, tx.currency)}
                      </div>
                      <Link
                        href={`/transactions/${tx.id}/edit`}
                        className="text-[11px] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
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
    </AppShell>
  );
}
