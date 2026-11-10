'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import { createTransaction } from '@/lib/api';
import { fetchCategories, Category } from '@/lib/categories';
import { SUPPORTED_CURRENCIES, todayLocal } from '@/lib/format';
import { toast } from '@/components/toast';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';

export default function NewTransactionPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesState, setCategoriesState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field-level validation messages (same rules and wording as before)
  const [amountError, setAmountError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Form fields
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchCategories()
      .then((cats) => {
        if (!mounted) return;
        setTransactionDate(todayLocal());
        setCategories(cats);
        setCategoriesState('ready');
        // Auto-select first category for current type
        const firstCat = cats.find((c) => c.type === 'expense');
        if (firstCat) setCategoryId(firstCat.id);
      })
      .catch(() => {
        if (mounted) setCategoriesState('error');
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
    setAmountError(null);
    setCategoryError(null);
    setDateError(null);

    // Validation — same rules and messages, now shown next to the field
    const cleanAmount = amount.trim();
    if (!cleanAmount) {
      setAmountError('Amount is required.');
      return;
    }

    // Amount schema check: positive, max 13 integer digits, max 2 decimals, <= 9999999999999.99
    if (!/^\d+(\.\d+)?$/.test(cleanAmount)) {
      setAmountError('Amount must be a valid positive decimal number.');
      return;
    }

    const parts = cleanAmount.split('.');
    if (parts[0].length > 13) {
      setAmountError('Amount cannot exceed 13 integer digits.');
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      setAmountError('Amount cannot have more than 2 decimal places.');
      return;
    }
    const num = parseFloat(cleanAmount);
    if (num <= 0) {
      setAmountError('Amount must be greater than zero.');
      return;
    }
    if (num > 9999999999999.99) {
      setAmountError('Amount exceeds maximum permitted value (9,999,999,999,999.99).');
      return;
    }

    if (!categoryId) {
      setCategoryError('Please select a valid category.');
      return;
    }

    if (!transactionDate) {
      setDateError('Transaction date is required.');
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

      toast('Transaction created', 'success');
      router.push('/transactions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create transaction';
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const categoriesPending = categoriesState === 'loading';

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Add a transaction"
          description="Record one income or expense entry."
        />

        {/* Non-field errors (connection, API rejections) */}
        {errorMsg && (
          <Alert tone="danger" title="The transaction wasn't saved">
            {errorMsg}
          </Alert>
        )}

        {/* Categories could not be loaded */}
        {categoriesState === 'error' && (
          <Alert tone="warning" title="Categories couldn't be loaded">
            Check your connection and try again.
          </Alert>
        )}

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type */}
            <div role="group" aria-label="Transaction type" className="space-y-1.5">
              <p className="text-label" aria-hidden="true">
                Type
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={type === 'expense'}
                  onClick={() => handleTypeChange('expense')}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 text-[13px] font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                    type === 'expense'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]'
                      : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  Expense
                </button>
                <button
                  type="button"
                  aria-pressed={type === 'income'}
                  onClick={() => handleTypeChange('income')}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 text-[13px] font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                    type === 'income'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]'
                      : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                  Income
                </button>
              </div>
            </div>

            {/* Amount + Currency */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                id="tx-amount"
                label="Amount"
                required
                error={amountError ?? undefined}
                hint="Up to 2 decimal places."
                className="sm:col-span-2"
              >
                <Input
                  id="tx-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                  placeholder="0.00"
                  value={amount}
                  invalid={Boolean(amountError)}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (amountError) setAmountError(null);
                  }}
                  className="tabular-nums"
                />
              </Field>

              <Field id="tx-currency" label="Currency">
                <Select
                  id="tx-currency"
                  name="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* Category */}
            <Field
              id="tx-category"
              label="Category"
              required
              error={categoryError ?? undefined}
              hint={
                categoriesState === 'ready' && filteredCategories.length === 0
                  ? `No ${type} categories are available.`
                  : undefined
              }
            >
              <Select
                id="tx-category"
                name="categoryId"
                required
                disabled={filteredCategories.length === 0}
                value={categoryId}
                invalid={Boolean(categoryError)}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (categoryError) setCategoryError(null);
                }}
              >
                {filteredCategories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </Select>
            </Field>

            {/* Date */}
            <Field id="tx-date" label="Date" required error={dateError ?? undefined}>
              <Input
                id="tx-date"
                name="transactionDate"
                type="date"
                required
                value={transactionDate}
                invalid={Boolean(dateError)}
                onChange={(e) => {
                  setTransactionDate(e.target.value);
                  if (dateError) setDateError(null);
                }}
              />
            </Field>

            {/* Description */}
            <Field
              id="tx-description"
              label="Description"
              hint="Optional, up to 500 characters."
            >
              <Input
                id="tx-description"
                name="description"
                type="text"
                maxLength={500}
                placeholder="e.g. Groceries at Agora"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            {/* Entry preview */}
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-4">
                <span className="text-secondary">This transaction</span>
                <span className="flex items-center gap-2">
                  <Badge tone={type === 'income' ? 'success' : 'neutral'} dot>
                    {type === 'income' ? 'Income' : 'Expense'}
                  </Badge>
                  <span className="text-metric-sm tabular-nums">
                    {amount} {currency}
                  </span>
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
              <ButtonLink href="/transactions" variant="secondary" size="lg">
                Cancel
              </ButtonLink>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={categoriesPending}
              >
                Save transaction
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
