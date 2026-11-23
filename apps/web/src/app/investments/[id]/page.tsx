'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  getInvestment,
  updateInvestment,
  deleteInvestment,
  Investment,
  UpdateInvestmentDto,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import {
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  Select,
} from '@/components/ui';
import { ArrowLeft, Check, Coins, Trash2, X } from 'lucide-react';

const ASSET_TYPES = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'fdr_dps', label: 'FDR/DPS' },
  { value: 'sanchaypatra', label: 'Sanchaypatra' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
] as const;

type FormData = {
  name: string;
  asset_type: typeof ASSET_TYPES[number]['value'];
  invested_amount: string;
  current_value: string;
  purchased_date: string;
  status: typeof STATUS_OPTIONS[number]['value'];
  details: string;
};

function normalizeForForm(investment: Investment): FormData {
  return {
    name: investment.name,
    asset_type: investment.asset_type,
    invested_amount: investment.invested_amount,
    current_value: investment.current_value,
    purchased_date: investment.purchased_date,
    status: investment.status,
    details: typeof investment.details === 'object' && investment.details !== null ? JSON.stringify(investment.details) : '',
  };
}

export default function InvestmentEditPage() {
  return (
    <Suspense fallback={<AppShell><div className="space-y-6"><div className="flex items-center gap-4">Loading...</div></div></AppShell>}>
      <InvestmentEditContent />
    </Suspense>
  );
}

function InvestmentEditContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getToken } = useAuth();
  const [form, setForm] = useState<FormData>({
    name: '',
    asset_type: 'gold',
    invested_amount: '',
    current_value: '',
    purchased_date: '',
    status: 'active',
    details: '{}',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tokenPromise = getToken();
    tokenPromise.then((token) => {
      if (!token || cancelled) return;
      getInvestment(token, id)
        .then((investment) => {
          if (!cancelled) setForm(normalizeForForm(investment));
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load investment');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [getToken, id]);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) return;

        const payload: UpdateInvestmentDto = {
          name: form.name.trim(),
          current_value: form.current_value,
          status: form.status,
          details: form.details.trim() ? JSON.parse(form.details) : undefined,
        };

        await updateInvestment(token, id, payload);
        router.push('/investments');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to update investment');
      } finally {
        setSaving(false);
      }
    },
    [form, getToken, id, router],
  );

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      await deleteInvestment(token, id);
      router.push('/investments');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete investment');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [getToken, id, router]);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <ButtonLink href="/investments" variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Investments
            </ButtonLink>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-page-title">Edit Investment</h1>
          </div>
          <Card padding="lg">
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-10 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <ButtonLink href="/investments" variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Investments
          </ButtonLink>
        </div>

        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-page-title">Edit Investment</h1>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Field id="name" label="Investment Name" required>
              <Input
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Gold Bar 24K"
              />
            </Field>

            <Field id="asset_type" label="Asset Type" required>
              <Select
                value={form.asset_type}
                onChange={(e) => handleChange('asset_type', e.target.value)}
              >
                {ASSET_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="invested_amount" label="Invested Amount" required>
                <Input
                  type="text"
                  value={form.invested_amount}
                  onChange={(e) => handleChange('invested_amount', e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </Field>
              <Field id="current_value" label="Current Value">
                <Input
                  type="text"
                  value={form.current_value}
                  onChange={(e) => handleChange('current_value', e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </Field>
            </div>

            <Field id="purchased_date" label="Purchase Date" required>
              <Input
                type="date"
                value={form.purchased_date}
                onChange={(e) => handleChange('purchased_date', e.target.value)}
              />
            </Field>

            <Field id="status" label="Status">
              <Select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </Field>

            <Field id="details" label="Details (optional)">
              <Input
                value={form.details}
                onChange={(e) => handleChange('details', e.target.value)}
                placeholder="Additional notes or details"
              />
            </Field>

            {error && (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] p-4 text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <ButtonLink href="/investments" variant="secondary">
                Cancel
              </ButtonLink>
              <Button
                type="button"
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                disabled={saving || deleting}
                leadingIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                disabled={!form.name || !form.invested_amount}
                leadingIcon={<Check className="h-4 w-4" />}
              >
                Update Investment
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-scrim)] p-4"
          onClick={() => setConfirmDelete(false)}
          aria-hidden="true"
        />
      )}
      {confirmDelete && (
        <Card
          padding="lg"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
        >
          <h2 className="mb-4 text-card-title">Confirm Delete</h2>
          <p className="mb-6 text-[var(--color-text-muted)]">
            Are you sure you want to delete this investment? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} leadingIcon={<X className="h-4 w-4" />}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              leadingIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete Investment
            </Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
