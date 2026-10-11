'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/format';

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

export function LoanCalculator({ onSaveAsNewLoan }: LoanCalculatorProps) {
  const [direction, setDirection] = useState<'lent' | 'borrowed'>('borrowed');
  const [personName, setPersonName] = useState('Rahim');
  const [principalStr, setPrincipalStr] = useState('1000');
  const [repaidStr, setRepaidStr] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'bank' | 'nagad' | 'other'>('bkash');
  const [dueDate, setDueDate] = useState('2026-10-15');
  const currency = 'BDT';

  const principal = parseFloat(principalStr) || 0;
  const repaid = parseFloat(repaidStr) || 0;
  const clampedRepaid = Math.min(Math.max(repaid, 0), principal);
  const outstanding = Math.max(principal - clampedRepaid, 0);
  const progressPct = principal > 0 ? Math.min((clampedRepaid / principal) * 100, 100) : 0;

  const headerText =
    direction === 'borrowed'
      ? `You still owe ${personName || 'person'}`
      : `${personName || 'Person'} still owes you`;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 shadow-xl">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">Try a loan example</h3>
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
          Change the values to see how the outstanding balance should behave.
        </p>
      </div>

      <div className="space-y-4">
        {/* Direction radios */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer text-sm text-[var(--color-text)]">
            <input
              type="radio"
              name="calc-direction"
              checked={direction === 'lent'}
              onChange={() => setDirection('lent')}
              className="w-4 h-4 text-[var(--color-primary)] border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-[var(--color-primary)]"
            />
            <span>I lent money to someone</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-sm text-[var(--color-text)]">
            <input
              type="radio"
              name="calc-direction"
              checked={direction === 'borrowed'}
              onChange={() => setDirection('borrowed')}
              className="w-4 h-4 text-[var(--color-primary)] border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-[var(--color-primary)]"
            />
            <span>I borrowed money from someone</span>
          </label>
        </div>

        {/* Person's name */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Person&apos;s name
          </label>
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="e.g. Rahim"
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>

        {/* Original loan & Total repaid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Original loan (৳)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={principalStr}
              onChange={(e) => setPrincipalStr(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Total repaid (৳)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={repaidStr}
              onChange={(e) => setRepaidStr(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>

        {/* Transfer method */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Transfer method
          </label>
          <div className="flex flex-wrap gap-4 pt-1">
            {(['cash', 'bkash', 'bank', 'nagad'] as const).map((method) => (
              <label key={method} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text)]">
                <input
                  type="radio"
                  name="calc-method"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                  className="w-4 h-4 text-[var(--color-primary)] border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-[var(--color-primary)]"
                />
                <span className="capitalize">{method === 'bkash' ? 'bKash' : method === 'nagad' ? 'Nagad' : method}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Expected repayment date */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Expected repayment date
          </label>
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>

        {/* Result Card matching user image */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border)] space-y-3">
          <div className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium">
            {headerText}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--color-text)] tracking-tight">
            {formatMoney(outstanding, currency)}
          </div>

          <div className="space-y-2 pt-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-[var(--color-text-muted)]">
              <span>Original amount</span>
              <span className="font-medium tabular-nums text-[var(--color-text)]">{formatMoney(principal, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-[var(--color-text-muted)]">
              <span>Already repaid</span>
              <span className="font-medium tabular-nums text-[var(--color-text)]">{formatMoney(clampedRepaid, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-[var(--color-text-muted)]">
              <span>Method</span>
              <span className="font-medium text-[var(--color-text)] capitalize">
                {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : paymentMethod}
              </span>
            </div>
            {dueDate && (
              <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                <span>Due date</span>
                <span className="font-medium text-[var(--color-text)]">{dueDate}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="pt-2">
            <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1.5 font-medium tabular-nums">
              {progressPct.toFixed(1)}% repaid
            </div>
          </div>

          {onSaveAsNewLoan && (
            <button
              type="button"
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
              className="w-full mt-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-lg shadow-[var(--color-primary)]/15"
            >
              Save as Real Loan Record →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
