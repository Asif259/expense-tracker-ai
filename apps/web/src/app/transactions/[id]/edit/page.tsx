'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import { getTransaction, updateTransaction } from '@/lib/api';
import { fetchCategories, Category } from '@/lib/categories';
import { SUPPORTED_CURRENCIES } from '@/lib/format';
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
  Skeleton,
} from '@/components/ui';

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-busy="true">
      <p role="status" className="sr-only">
        Loading transaction…
      </p>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card padding="lg">
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-10" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10" />
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function EditTransactionForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { getToken } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field-level validation messages (same rules and wording as before)
  const [amountError, setAmountError] = useState<string | null>(null);

  // Form fields
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const [cats, tx] = await Promise.all([
          fetchCategories(),
          getTransaction(token, id),
        ]);

        if (mounted) {
          setCategories(cats);
          setType(tx.type === 'income' ? 'income' : 'expense');
          // The API serialises Postgres `numeric` values as JSON numbers in some
          // responses, so normalise every field to a string for the form state.
          setAmount(tx.amount == null ? '' : String(tx.amount));
          setCurrency(tx.currency ?? 'BDT');
          setCategoryId(tx.category_id ?? '');
          setTransactionDate(tx.transaction_date ?? '');
          setDescription(tx.description ?? '');
        }
      } catch (err: unknown) {
        if (mounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load transaction');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [id, getToken]);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType);
    if (firstCat) {
      setCategoryId(firstCat.id);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAmountError(null);

    // Validation — same rules and messages, now shown next to the field
    const cleanAmount = String(amount ?? '').trim();
    if (!cleanAmount) {
      setAmountError('Amount is required.');
      return;
    }

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

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await updateTransaction(token, id, {
        type,
        amount: cleanAmount,
        currency,
        category_id: categoryId,
        transaction_date: transactionDate,
        description: String(description ?? '').trim() || null,
      });

      toast('Transaction updated', 'success');
      router.push('/transactions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update transaction';
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit transaction" description="Update this transaction's details." />

      {/* Load / API errors */}
      {errorMsg && (
        <Alert tone="danger" title="The transaction wasn't saved">
          {errorMsg}
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
              id="edit-amount"
              label="Amount"
              required
              error={amountError ?? undefined}
              hint="Up to 2 decimal places."
              className="sm:col-span-2"
            >
              <Input
                id="edit-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={amount}
                invalid={Boolean(amountError)}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (amountError) setAmountError(null);
                }}
                className="tabular-nums"
              />
            </Field>

            <Field id="edit-currency" label="Currency">
              <Select
                id="edit-currency"
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
          <Field id="edit-category" label="Category" required>
            <Select
              id="edit-category"
              name="categoryId"
              required
              disabled={filteredCategories.length === 0}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
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
          <Field id="edit-date" label="Date" required>
            <Input
              id="edit-date"
              name="transactionDate"
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </Field>

          {/* Description */}
          <Field id="edit-description" label="Description" hint="Optional, up to 500 characters.">
            <Input
              id="edit-description"
              name="description"
              type="text"
              maxLength={500}
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
            <Button type="submit" variant="primary" size="lg" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function EditTransactionPage() {
  return (
    <AppShell>
      <Suspense fallback={<FormSkeleton />}>
        <EditTransactionForm />
      </Suspense>
    </AppShell>
  );
}
