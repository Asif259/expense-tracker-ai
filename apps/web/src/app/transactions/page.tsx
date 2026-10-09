'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  listTransactions,
  deleteTransaction,
  Transaction,
  TransactionQuery,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { fetchCategories, Category } from '@/lib/categories';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from '@/components/toast';
import Link from 'next/link';

export default function TransactionsPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter state
  const [filterType, setFilterType] = useState<'' | 'income' | 'expense'>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const limit = 20;

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  const loadTransactions = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const query: TransactionQuery = {
        limit,
        offset,
      };

      if (filterType) query.type = filterType;
      if (filterCategory) query.category_id = filterCategory;
      if (filterStartDate) query.startDate = filterStartDate;
      if (filterEndDate) query.endDate = filterEndDate;

      const res = await listTransactions(token, query);
      setTransactions(res.data || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [getToken, filterType, filterCategory, filterStartDate, filterEndDate, offset]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token || !mounted) return;

        const query: TransactionQuery = {
          limit,
          offset,
        };

        if (filterType) query.type = filterType;
        if (filterCategory) query.category_id = filterCategory;
        if (filterStartDate) query.startDate = filterStartDate;
        if (filterEndDate) query.endDate = filterEndDate;

        const res = await listTransactions(token, query);
        if (mounted) {
          setTransactions(res.data || []);
          setTotal(res.total || 0);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          setLoading(false);
          toast(err instanceof Error ? err.message : 'Failed to fetch transactions', 'error');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getToken, filterType, filterCategory, filterStartDate, filterEndDate, offset]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = await getToken();
      if (!token) return;

      await deleteTransaction(token, deleteTarget.id);
      toast('Transaction deleted successfully', 'success');
      setDeleteTarget(null);
      loadTransactions();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete transaction', 'error');
    }
  };

  const handleClearFilters = () => {
    setFilterType('');
    setFilterCategory('');
    setFilterStartDate('');
    setFilterEndDate('');
    setOffset(0);
  };

  const filteredCategories = useMemo(() => {
    if (!filterType) return categories;
    return categories.filter((c) => c.type === filterType);
  }, [categories, filterType]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Browse, filter, and audit your verified financial ledger.
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

        {/* Filter controls */}
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Type filter */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as '' | 'income' | 'expense');
                  setOffset(0);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expense Only</option>
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">All Categories</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          {(filterType || filterCategory || filterStartDate || filterEndDate) && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              >
                Reset all filters ✕
              </button>
            </div>
          )}
        </div>

        {/* Transactions Table / List */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-[var(--color-border)]/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-3xl mb-3">🧾</div>
              <h3 className="text-sm font-semibold mb-1">No transactions found</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4 max-w-sm mx-auto">
                No ledger entries matched your query criteria or you haven&apos;t added any yet.
              </p>
              <Link
                href="/transactions/new"
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-medium transition-colors inline-block"
              >
                Create Transaction
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {transactions.map((tx) => {
                    const cat = categoryMap.get(tx.category_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-[var(--color-text-muted)]">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[var(--color-text)]">
                            {cat ? cat.name : 'Unknown Category'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[var(--color-text-muted)] max-w-xs truncate">
                          {tx.description || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                isIncome
                                  ? 'bg-[var(--color-income-bg)] text-[var(--color-income)]'
                                  : 'bg-[var(--color-expense-bg)] text-[var(--color-expense)]'
                              }`}
                            >
                              {tx.type}
                            </span>
                            {tx.is_ai_generated && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                                AI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold">
                          <span
                            className={
                              isIncome
                                ? 'text-[var(--color-income)]'
                                : 'text-[var(--color-expense)]'
                            }
                          >
                            {isIncome ? '+' : '-'}
                            {formatMoney(tx.amount, tx.currency)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <Link
                            href={`/transactions/${tx.id}/edit`}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(tx)}
                            className="text-[var(--color-danger)] hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination bar */}
          <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>
              Showing {transactions.length > 0 ? offset + 1 : 0} to{' '}
              {Math.min(offset + transactions.length, total)} of {total} records
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={offset + limit >= total || loading}
                onClick={() => setOffset(offset + limit)}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete this ${deleteTarget.type} transaction of ${formatMoney(deleteTarget.amount, deleteTarget.currency)}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Confirm Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
