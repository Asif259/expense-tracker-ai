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
import {
  Sparkles,
  Plus,
  X,
  ReceiptText,
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveDataTable,
  ResponsiveColumn,
  RowAction,
  MobileTableConfig,
} from '@/components/responsive-table';

export default function TransactionsPage() {
  const router = useRouter();
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

  const columns: ResponsiveColumn<Transaction>[] = useMemo(
    () => [
      {
        id: 'category',
        header: 'Category',
        role: 'identity',
        priority: 1,
        label: 'Category',
        sortable: true,
        sortValue: (tx) => categoryMap.get(tx.category_id)?.name || 'Uncategorized',
        cell: (tx) => {
          const cat = categoryMap.get(tx.category_id);
          return (
            <span className="font-semibold text-[var(--color-text)]">
              {cat ? cat.name : 'Uncategorized'}
            </span>
          );
        },
      },
      {
        id: 'amount',
        header: 'Amount',
        role: 'value',
        priority: 2,
        align: 'right',
        isNumeric: true,
        label: 'Amount',
        sortable: true,
        sortValue: (tx) => parseFloat(tx.amount),
        cell: (tx) => {
          const isIncome = tx.type === 'income';
          return (
            <span className="font-bold tabular-nums text-[var(--color-text)]">
              {isIncome ? '+' : '-'} {formatMoney(tx.amount, tx.currency)}
            </span>
          );
        },
      },
      {
        id: 'type',
        header: 'Type',
        role: 'state',
        priority: 3,
        label: 'Status & Type',
        cell: (tx) => {
          const isIncome = tx.type === 'income';
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase inline-flex items-center gap-1 ${
                  isIncome
                    ? 'bg-[var(--color-pale-mint)] text-[var(--color-text)]'
                    : 'bg-[var(--color-pale-yellow)] text-[var(--color-text)]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isIncome ? 'bg-[var(--color-income)]' : 'bg-[var(--color-warning)]'
                  }`}
                />
                {tx.type}
              </span>
              {tx.is_ai_generated && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                  AI
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'transaction_date',
        header: 'Date',
        role: 'detail',
        priority: 4,
        label: 'Date',
        sortable: true,
        sortValue: (tx) => tx.transaction_date,
        cell: (tx) => (
          <span className="tabular-nums text-[var(--color-text-muted)]">
            {formatDate(tx.transaction_date)}
          </span>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        role: 'detail',
        priority: 5,
        label: 'Description',
        cell: (tx) => (
          <span className="text-[var(--color-text-muted)] max-w-xs truncate block">
            {tx.description || '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        role: 'action',
        priority: 6,
        align: 'right',
        cell: (tx) => {
          const cat = categoryMap.get(tx.category_id);
          const categoryName = cat ? cat.name : 'Uncategorized';
          return (
            <div className="space-x-2 text-right">
              <Link
                href={`/transactions/${tx.id}/edit`}
                aria-label={`Edit ${categoryName} transaction of ${formatMoney(tx.amount, tx.currency)}`}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline transition-colors px-1 py-1"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(tx)}
                aria-label={`Delete ${categoryName} transaction of ${formatMoney(tx.amount, tx.currency)}`}
                className="text-[var(--color-danger)] hover:underline cursor-pointer px-1 py-1"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [categoryMap]
  );

  const rowActions = useCallback(
    (_tx: Transaction): RowAction<Transaction>[] => [
      {
        id: 'edit',
        label: 'Edit Transaction',
        icon: <Pencil className="w-3.5 h-3.5" />,
        onClick: (t) => router.push(`/transactions/${t.id}/edit`),
      },
      {
        id: 'delete',
        label: 'Delete Transaction',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        variant: 'danger',
        onClick: (t) => setDeleteTarget(t),
      },
    ],
    [router]
  );

  const mobileConfig: MobileTableConfig<Transaction> = useMemo(
    () => ({
      identityColumnId: 'category',
      primaryValueColumnId: 'amount',
      stateColumnId: 'type',
      secondaryDetailColumnIds: ['transaction_date'],
      detailMode: 'bottom-sheet',
    }),
    []
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-page-title">Transactions</h1>
            <p className="text-secondary mt-1">
              Browse, filter, and audit your verified financial ledger.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ai-entry"
              className="px-3.5 py-2 rounded-xl bg-[var(--color-secondary)]/15 border border-[var(--color-secondary)]/30 hover:bg-[var(--color-secondary)]/25 text-[var(--color-secondary)] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Quick Entry</span>
            </Link>
            <Link
              href="/transactions/new"
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-[var(--color-primary)]/15 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </Link>
          </div>
        </div>

        {/* Filter controls */}
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Type filter */}
            <div>
              <label
                htmlFor="filter-type"
                className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1"
              >
                Type
              </label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as '' | 'income' | 'expense');
                  setOffset(0);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expense Only</option>
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label
                htmlFor="filter-category"
                className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1"
              >
                Category
              </label>
              <select
                id="filter-category"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
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
              <label
                htmlFor="filter-start-date"
                className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1"
              >
                Start Date
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              >
              </input>
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="filter-end-date"
                className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1"
              >
                End Date
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          {(filterType || filterCategory || filterStartDate || filterEndDate) && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors cursor-pointer p-1 flex items-center gap-1"
              >
                <span>Reset all filters</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Transactions Table / List via Global Responsive Table Component */}
        <div className="space-y-4">
          <ResponsiveDataTable<Transaction>
            data={transactions}
            columns={columns}
            keyExtractor={(tx) => tx.id}
            loading={loading}
            actions={rowActions}
            mobileConfig={mobileConfig}
            breakpoint="md"
            ariaLabel="Transactions ledger"
            tableTitle="Transactions Ledger"
            emptyTitle="No transactions found"
            emptyDescription="No ledger entries matched your query criteria or you haven't added any yet."
            emptyIcon={<ReceiptText className="w-5 h-5 opacity-70" />}
            emptyAction={
              <Link
                href="/transactions/new"
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-xs font-semibold transition-colors inline-block shadow-md shadow-[var(--color-primary)]/15 cursor-pointer"
              >
                Create Transaction
              </Link>
            }
          />

          {/* Pagination bar */}
          <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)] shadow-[var(--shadow-card)]">
            <span>
              Showing {transactions.length > 0 ? offset + 1 : 0} to{' '}
              {Math.min(offset + transactions.length, total)} of {total} records
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-medium"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={offset + limit >= total || loading}
                onClick={() => setOffset(offset + limit)}
                className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-medium"
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
