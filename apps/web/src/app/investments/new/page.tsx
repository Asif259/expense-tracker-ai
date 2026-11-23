'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  createInvestment,
  getInvestment,
  updateInvestment,
  Investment,
  CreateInvestmentDto,
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
import { ArrowLeft, Check, Coins } from 'lucide-react';

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

export default function InvestmentNewPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [form, setForm] = useState<FormData>({
    name: '',
    asset_type: 'gold',
    invested_amount: '',
    current_value: '',
    purchased_date: '',
    status: 'active',
    details: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setForm((prev) => ({ ...prev, purchased_date: formatDate(new Date().toISOString()) }));
  }, []);

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-4">Loading...</div>
        </div>
      </AppShell>
    );
  }

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) return;

        const payload: CreateInvestmentDto = {
          name: form.name.trim(),
          asset_type: form.asset_type,
          invested_amount: form.invested_amount,
          current_value: form.current_value || form.invested_amount,
          purchased_date: form.purchased_date,
          status: form.status,
          details: form.details.trim() ? { notes: form.details.trim() } : undefined,
        };

        await createInvestment(token, payload);
        router.push('/investments');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to create investment');
      } finally {
        setLoading(false);
      }
    },
    [form, getToken, router],
  );

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
          <h1 className="text-page-title">Add Investment</h1>
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
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!form.name || !form.invested_amount}
                leadingIcon={<Check className="h-4 w-4" />}
              >
                Create Investment
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
