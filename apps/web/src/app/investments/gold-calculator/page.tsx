'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import { fetchGoldRates, GoldRate } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button, ButtonLink, Card, Field, Input, SegmentedControl } from '@/components/ui';
import { ArrowLeft, Calculator, Sparkles } from 'lucide-react';

type MetalType = 'gold' | 'silver';
type Karat = '22k' | '24k';

const METAL_TYPES: MetalType[] = ['gold', 'silver'];
const KARAT_OPTIONS: Karat[] = ['22k', '24k'];

export default function GoldCalculatorPage() {
  const { getToken } = useAuth();
  const [metalType, setMetalType] = useState<MetalType>('gold');
  const [karat, setKarat] = useState<Karat>('22k');
  const [weight, setWeight] = useState('');
  const [makingCharge, setMakingCharge] = useState('');
  const [vatPercent, setVatPercent] = useState('15');
  const [rates, setRates] = useState<GoldRate[]>([]);
  const [result, setResult] = useState<{
    market_value: string;
    making_charge: string;
    vat_amount: string;
    total: string;
  } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('BDT');
  const [source, setSource] = useState<'bajus' | 'global'>('bajus');
  const [loading, setLoading] = useState(true);

  const CURRENCY_OPTIONS = ['BDT', 'USD', 'VND'] as const;
  const SOURCE_OPTIONS = [
    { value: 'bajus' as const, label: 'BAJUS (Bangladesh)' },
    { value: 'global' as const, label: 'Global Spot' },
  ];

  useEffect(() => {
    let cancelled = false;
    fetchGoldRates({ source, currency })
      .then((rates) => { if (!cancelled) setRates(rates); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load gold rates'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [source, currency]);

  const rateForSelection = useMemo(() => {
    return rates.find((r) => r.metal_type === metalType && r.karat === karat);
  }, [rates, metalType, karat]);

  const calculate = useCallback(() => {
    if (!weight || parseFloat(weight) <= 0) {
      setError('Please enter a valid weight');
      return;
    }
    if (!rateForSelection) {
      setError('Rates not loaded yet');
      return;
    }

    setCalculating(true);
    setError(null);
    try {
      const weightGrams = parseFloat(weight);
      const rate = parseFloat(rateForSelection.market_price_per_gram);
      const makingChargeAmount = makingCharge ? parseFloat(makingCharge) : 0;
      const vatPercentNum = vatPercent ? parseFloat(vatPercent) : 15;

      const baseValue = weightGrams * rate;
      const makingChargeTotal = makingChargeAmount;
      const vatAmount = (baseValue + makingChargeTotal) * (vatPercentNum / 100);
      const total = baseValue + makingChargeTotal + vatAmount;

      setResult({
        market_value: baseValue.toFixed(2),
        making_charge: makingChargeTotal.toFixed(2),
        vat_amount: vatAmount.toFixed(2),
        total: total.toFixed(2),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  }, [rateForSelection, weight, makingCharge, vatPercent]);

  const displayRate = useMemo(() => {
    if (!rateForSelection) return null;
    return {
      market: parseFloat(rateForSelection.market_price_per_gram),
      resale: parseFloat(rateForSelection.resale_price_per_gram),
    };
  }, [rateForSelection]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <ButtonLink href="/investments" variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Investments
          </ButtonLink>
        </div>

        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-page-title">Gold Calculator</h1>
        </div>

        <p className="text-[var(--color-text-muted)]">
          Calculate market and resale values for gold and silver based on current rates.
        </p>

        <Card padding="lg">
          <div className="space-y-6">
            {/* Metal & Karat Selection */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="metal_type" label="Metal Type">
                <SegmentedControl
                  label="Select metal"
                  value={metalType}
                  onChange={(v) => setMetalType(v as MetalType)}
                  options={METAL_TYPES.map((m) => ({
                    value: m,
                    label: m.charAt(0).toUpperCase() + m.slice(1),
                  }))}
                />
              </Field>
              <Field id="karat" label="Karat">
                <SegmentedControl
                  label="Select karat"
                  value={karat}
                  onChange={(v) => setKarat(v as Karat)}
                  options={KARAT_OPTIONS.map((k) => ({ value: k, label: k.toUpperCase() }))}
                />
              </Field>
            </div>

            {/* Current Rates Display */}
            {displayRate && !loading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-4">
                  <div className="text-caption text-[var(--color-text-muted)]">Market Price</div>
                  <div className="text-metric tabular-nums">
                    {formatMoney(displayRate.market.toString(), currency)}/gram
                  </div>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-4">
                  <div className="text-caption text-[var(--color-text-muted)]">Resale Price</div>
                  <div className="text-metric tabular-nums">
                    {formatMoney(displayRate.resale.toString(), currency)}/gram
                  </div>
                </div>
              </div>
            )}

            {/* Input Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field id="weight" label="Weight (grams)" required>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </Field>
              <Field id="making_charge" label="Making Charge (optional)">
                <Input
                  type="number"
                  value={makingCharge}
                  onChange={(e) => setMakingCharge(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </Field>
              <Field id="vat_percent" label="VAT %">
                <Input
                  type="number"
                  value={vatPercent}
                  onChange={(e) => setVatPercent(e.target.value)}
                  placeholder="15"
                  step="0.1"
                  min="0"
                />
              </Field>
            </div>

            {/* Source Selector */}
            <Field id="source" label="Rate Source">
              <SegmentedControl
                label="Select rate source"
                value={source}
                onChange={(v) => setSource(v as 'bajus' | 'global')}
                options={SOURCE_OPTIONS}
              />
            </Field>

            {/* Currency Selector */}
            <Field id="currency" label="Currency">
              <SegmentedControl
                label="Select currency"
                value={currency}
                onChange={(v) => setCurrency(v as typeof currency)}
                options={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))}
              />
            </Field>

            {/* Calculate Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={calculate}
              loading={calculating}
              disabled={!weight || parseFloat(weight) <= 0}
              leadingIcon={<Sparkles className="h-4 w-4" />}
            >
              Calculate Value
            </Button>

            {/* Error Display */}
            {error && (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] p-4 text-[var(--color-danger)]">
                {error}
              </div>
            )}
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card padding="lg">
            <h2 className="mb-4 text-card-title">Calculation Results</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-4">
                <div className="text-caption text-[var(--color-text-muted)]">Market Value</div>
                <div className="text-metric-lg tabular-nums">
                  {formatMoney(result.market_value, currency)}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-4">
                <div className="text-caption text-[var(--color-text-muted)]">Making Charge</div>
                <div className="text-metric tabular-nums">
                  {formatMoney(result.making_charge, currency)}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-4">
                <div className="text-caption text-[var(--color-text-muted)]">VAT Amount</div>
                <div className="text-metric tabular-nums">
                  {formatMoney(result.vat_amount, currency)}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] p-4">
                <div className="text-caption text-[var(--color-primary-text)]">Total Cost</div>
                <div className="text-metric-lg font-medium tabular-nums text-[var(--color-primary-text)]">
                  {formatMoney(result.total, currency)}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Rate Information */}
        {!loading && rates.length > 0 && (
          <Card padding="lg">
            <h2 className="mb-4 text-card-title">Current Rates</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-4 py-2 text-left font-medium text-[var(--color-text-muted)]">
                      Source
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--color-text-muted)]">
                      Metal
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--color-text-muted)]">
                      Karat
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-[var(--color-text-muted)]">
                      Market Price
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-[var(--color-text-muted)]">
                      Resale Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr key={`${rate.source}-${rate.metal_type}-${rate.karat}`} className="border-b border-[var(--color-border)]">
                      <td className="px-4 py-2 text-[var(--color-text)]">
                        {rate.source === 'goldr.org' ? 'BAJUS' : 'GoldAPI'}
                      </td>
                      <td className="px-4 py-2 text-[var(--color-text)]">
                        {rate.metal_type.charAt(0).toUpperCase() + rate.metal_type.slice(1)}
                      </td>
                      <td className="px-4 py-2 text-[var(--color-text)]">
                        {rate.karat.toUpperCase()}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-[var(--color-text)]">
                        {formatMoney(rate.market_price_per_gram, currency)}/g
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-[var(--color-text-muted)]">
                        {formatMoney(rate.resale_price_per_gram, currency)}/g
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-caption text-[var(--color-text-muted)]">
              Rates are updated periodically. Source: {source === 'bajus' ? 'BAJUS (goldr.org - Bangladesh)' : 'GoldAPI.io (Global Spot)'}
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
