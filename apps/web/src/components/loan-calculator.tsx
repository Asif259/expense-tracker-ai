'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/format';
import { Button, Field, Input, SegmentedControl } from '@/components/ui';

interface LoanCalculatorProps {
  onSaveAsNewLoan?: (loanData: {
    person_name: string;
    direction: 'lent' | 'borrowed';
    principal_amount: string;
    currency: string;
    payment_method: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
    due_date?: string;
  }) => void;
}

type CalculatorMethod = 'cash' | 'bkash' | 'bank' | 'nagad';

const METHOD_LABELS: Record<CalculatorMethod, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  cash: 'Cash',
  bank: 'Bank',
};

const METHOD_OPTIONS = (Object.keys(METHOD_LABELS) as CalculatorMethod[]).map((method) => ({
  value: method,
  label: METHOD_LABELS[method],
}));

const DIRECTION_OPTIONS = [
  { value: 'lent', label: 'I lent money' },
  { value: 'borrowed', label: 'I borrowed money' },
] as const;

export function LoanCalculator({ onSaveAsNewLoan }: LoanCalculatorProps) {
  const [direction, setDirection] = useState<'lent' | 'borrowed'>('borrowed');
  const [personName, setPersonName] = useState('Rahim');
  const [principalStr, setPrincipalStr] = useState('1000');
  const [repaidStr, setRepaidStr] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState<CalculatorMethod>('bkash');
  const [dueDate, setDueDate] = useState('2026-10-15');
  const currency = 'BDT';

  const principal = parseFloat(principalStr) || 0;
  const repaid = parseFloat(repaidStr) || 0;
  const clampedRepaid = Math.min(Math.max(repaid, 0), principal);
  const outstanding = Math.max(principal - clampedRepaid, 0);
  const progressPct = principal > 0 ? Math.min((clampedRepaid / principal) * 100, 100) : 0;

  const headerText =
    direction === 'borrowed'
      ? `You still owe ${personName.trim() || 'this person'}`
      : `${personName.trim() || 'This person'} still owes you`;

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <div>
        <h3 className="text-section-title">Loan calculator</h3>
        <p className="text-secondary mt-1">
          Adjust the amounts to see how the outstanding balance changes.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-label">Direction</p>
          <div className="mt-1.5">
            <SegmentedControl
              options={[...DIRECTION_OPTIONS]}
              value={direction}
              onChange={setDirection}
              label="Loan direction"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="calc-person-name" label="Person's name">
            <Input
              id="calc-person-name"
              type="text"
              autoComplete="off"
              placeholder="e.g. Rahim"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
          </Field>
          <Field id="calc-due-date" label="Expected repayment">
            <Input
              id="calc-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="calc-principal" label={`Original loan (${currency})`}>
            <Input
              id="calc-principal"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={principalStr}
              onChange={(e) => setPrincipalStr(e.target.value)}
              className="tabular-nums"
            />
          </Field>
          <Field id="calc-repaid" label={`Total repaid (${currency})`}>
            <Input
              id="calc-repaid"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={repaidStr}
              onChange={(e) => setRepaidStr(e.target.value)}
              className="tabular-nums"
            />
          </Field>
        </div>

        <div>
          <p className="text-label">Transfer method</p>
          <div className="mt-1.5">
            <SegmentedControl
              options={METHOD_OPTIONS}
              value={paymentMethod}
              onChange={setPaymentMethod}
              label="Transfer method"
            />
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-5">
          <p className="text-label text-[var(--color-text-muted)]">{headerText}</p>
          <p className="text-metric mt-1 tabular-nums">{formatMoney(outstanding, currency)}</p>

          <dl className="mt-4 space-y-2 text-secondary">
            <div className="flex items-baseline justify-between gap-3">
              <dt>Original amount</dt>
              <dd className="tabular-nums text-[var(--color-text)]">
                {formatMoney(principal, currency)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt>Already repaid</dt>
              <dd className="tabular-nums text-[var(--color-text)]">
                {formatMoney(clampedRepaid, currency)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt>Method</dt>
              <dd className="text-[var(--color-text)]">{METHOD_LABELS[paymentMethod]}</dd>
            </div>
            {dueDate && (
              <div className="flex items-baseline justify-between gap-3">
                <dt>Repayment date</dt>
                <dd className="tabular-nums text-[var(--color-text)]">{dueDate}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-3 text-caption">
              <span className="tabular-nums">{progressPct.toFixed(1)}% repaid</span>
              <span className="tabular-nums">
                {formatMoney(clampedRepaid, currency)} of {formatMoney(principal, currency)}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Loan repayment progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPct)}
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]"
            >
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {onSaveAsNewLoan && (
            <Button
              variant="primary"
              className="mt-5 w-full"
              onClick={() =>
                onSaveAsNewLoan({
                  person_name: personName,
                  direction,
                  principal_amount: principalStr,
                  currency,
                  payment_method: paymentMethod,
                  due_date: dueDate || undefined,
                })
              }
            >
              Use this plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
