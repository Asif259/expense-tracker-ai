'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import { createTransaction } from '@/lib/api';
import { fetchCategories, Category } from '@/lib/categories';
import { SUPPORTED_CURRENCIES, todayLocal } from '@/lib/format';
import { toast } from '@/components/toast';
import Link from 'next/link';

export default function NewTransactionPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchCategories().then((cats) => {
      if (!mounted) return;
      setTransactionDate(todayLocal());
      setCategories(cats);
      // Auto-select first category for current type
      const firstCat = cats.find((c) => c.type === 'expense');
      if (firstCat) setCategoryId(firstCat.id);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Update default category when type changes
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType);
    if (firstCat) {
      setCategoryId(firstCat.id);
    } else {
      setCategoryId('');
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const cleanAmount = amount.trim();
    if (!cleanAmount) {
      setErrorMsg('Amount is required.');
      return;
    }

    // Amount schema check: positive, max 13 integer digits, max 2 decimals, <= 9999999999999.99
    if (!/^\d+(\.\d+)?$/.test(cleanAmount)) {
      setErrorMsg('Amount must be a valid positive decimal number.');
      return;
    }

    const parts = cleanAmount.split('.');
    if (parts[0].length > 13) {
      setErrorMsg('Amount cannot exceed 13 integer digits.');
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      setErrorMsg('Amount cannot have more than 2 decimal places.');
      return;
    }
    const num = parseFloat(cleanAmount);
    if (num <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }
    if (num > 9999999999999.99) {
      setErrorMsg('Amount exceeds maximum permitted value (9,999,999,999,999.99).');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a valid category.');
      return;
    }

    if (!transactionDate) {
      setErrorMsg('Transaction date is required.');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await createTransaction(token, {
        type,
        amount: cleanAmount,
        currency,
        category_id: categoryId,
        transaction_date: transactionDate,
        description: description.trim() || null,
      });

      toast('Transaction created successfully!', 'success');
      router.push('/transactions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create transaction';
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record Transaction</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Add a verified manual entry to your financial ledger.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg border border-[var(--color-danger)]/50 bg-[var(--color-expense-bg)] text-xs text-[var(--color-expense)] flex items-start gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-5"
        >
          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  type === 'expense'
                    ? 'border-[var(--color-expense)] bg-[var(--color-expense-bg)] text-[var(--color-expense)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                <span>↑</span>
                <span>Expense (Outgoing)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  type === 'income'
                    ? 'border-[var(--color-income)] bg-[var(--color-income-bg)] text-[var(--color-income)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                <span>↓</span>
                <span>Income (Incoming)</span>
              </button>
            </div>
          </div>

          {/* Amount & Currency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                Amount <span className="text-[var(--color-danger)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 1250.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-[var(--color-text-dim)] mt-1 block">
                Up to 2 decimal places. Normalized to fixed-precision decimal string.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Category <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              required
              disabled={filteredCategories.length === 0}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50"
            >
              {filteredCategories.length === 0 ? (
                <option value="">No {type} categories available in database</option>
              ) : (
                filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
            {categories.length === 0 && (
              <span className="text-xs text-[var(--color-warning)] mt-1 block">
                ⚠️ Categories unavailable from database. Connect live database and run migrations to create categories.
              </span>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Transaction Date <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              maxLength={500}
              placeholder="e.g. Monthly grocery at Agora"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
            <Link
              href="/transactions"
              className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
              )}
              <span>{loading ? 'Saving...' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
