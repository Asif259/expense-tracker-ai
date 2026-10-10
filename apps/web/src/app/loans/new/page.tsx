'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import { createLoan } from '@/lib/api';
import { SUPPORTED_CURRENCIES, formatMoney } from '@/lib/format';
import { toast } from '@/components/toast';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function NewLoanPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [direction, setDirection] = useState<'lent' | 'borrowed'>('lent');
  const [personName, setPersonName] = useState('');
  const [personContact, setPersonContact] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('bkash');
  const [loanDate, setLoanDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoanDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personName.trim()) {
      toast("Please enter the person's name", 'error');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast('Please enter a valid principal amount greater than zero', 'error');
      return;
    }

    if (dueDate && dueDate < loanDate) {
      toast('Expected repayment date cannot be earlier than loan date', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      await createLoan(token, {
        person_name: personName.trim(),
        person_contact: personContact.trim() || null,
        direction,
        principal_amount: amount,
        currency,
        payment_method: paymentMethod,
        loan_date: loanDate,
        due_date: dueDate || null,
        notes: notes.trim() || null,
      });

      toast('Loan record created successfully!', 'success');
      router.push('/loans');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create loan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const numericAmount = parseFloat(amount) || 0;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link
            href="/loans"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1 mb-2 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Debts & Loans</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            Record New Loan
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Log money given to or received from someone with repayment tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm"
          >
            {/* Direction Selection */}
            <div>
              <span id="loan-direction-label" className="block text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-wider mb-2">
                Loan Direction
              </span>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="loan-direction-label">
                <button
                  type="button"
                  role="radio"
                  aria-checked={direction === 'lent'}
                  onClick={() => setDirection('lent')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    direction === 'lent'
                      ? 'border-[var(--color-mint)] bg-[var(--color-pale-mint)]/40 text-[var(--color-text)] font-semibold shadow-sm ring-1 ring-[var(--color-mint)]/30'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <div className="text-sm font-bold mb-1 inline-flex items-center gap-1.5 text-[var(--color-text)]">
                    <ArrowUpRight className="w-4 h-4 text-[var(--color-mint)]" />
                    <span>I Lent Money</span>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">I expect to get this back</div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={direction === 'borrowed'}
                  onClick={() => setDirection('borrowed')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    direction === 'borrowed'
                      ? 'border-[var(--color-amber)] bg-[var(--color-pale-yellow)]/40 text-[var(--color-text)] font-semibold shadow-sm ring-1 ring-[var(--color-amber)]/30'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <div className="text-sm font-bold mb-1 inline-flex items-center gap-1.5 text-[var(--color-text)]">
                    <ArrowDownLeft className="w-4 h-4 text-[var(--color-amber)]" />
                    <span>I Borrowed Money</span>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">I need to pay this back</div>
                </button>
              </div>
            </div>

            {/* Person's details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan-person-name" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Person&apos;s Name <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="loan-person-name"
                  type="text"
                  required
                  placeholder="e.g. Rahim, John, Sister"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="loan-person-contact" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Contact Info (Phone / Email)
                </label>
                <input
                  id="loan-person-contact"
                  type="text"
                  placeholder="e.g. +8801700000000"
                  value={personContact}
                  onChange={(e) => setPersonContact(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
            </div>

            {/* Principal & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="loan-amount" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Principal Amount <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="loan-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="loan-currency" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Currency
                </label>
                <select
                  id="loan-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transfer method */}
            <div>
              <span id="loan-method-label" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                Transfer Method
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-labelledby="loan-method-label">
                {(['bkash', 'nagad', 'cash', 'bank'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={paymentMethod === m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      paymentMethod === m
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    {m === 'bkash' ? 'bKash' : m === 'nagad' ? 'Nagad' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan-date" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Loan Date <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  id="loan-date"
                  type="date"
                  required
                  value={loanDate}
                  onChange={(e) => setLoanDate(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="loan-due-date" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Expected Repayment Date (Optional)
                </label>
                <input
                  id="loan-due-date"
                  type="date"
                  min={loanDate}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="loan-notes" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                Notes & Terms (Optional)
              </label>
              <textarea
                id="loan-notes"
                rows={2}
                placeholder="e.g. Due before salary or monthly installment agreement"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm active:scale-[0.99] cursor-pointer"
              >
                {submitting ? 'Creating Loan...' : 'Save Loan Record'}
              </button>
            </div>
          </form>

          {/* Real-time Preview Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-dim)]">
              Live Loan Preview
            </h3>

            <div className="space-y-1">
              <div className="text-xs text-[var(--color-text-muted)]">
                {direction === 'lent'
                  ? `${personName || 'Person'} will owe you`
                  : `You will owe ${personName || 'Person'}`}
              </div>
              <div className="text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
                {formatMoney(numericAmount, currency)}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--color-border)] text-xs">
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Direction</span>
                <span className="font-semibold capitalize text-[var(--color-text)]">
                  {direction}
                </span>
              </div>
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Method</span>
                <span className="font-semibold capitalize text-[var(--color-text)]">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Loan Date</span>
                <span className="font-semibold text-[var(--color-text)]">{loanDate}</span>
              </div>
              {dueDate && (
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Due Date</span>
                  <span className="font-semibold text-[var(--color-text)]">{dueDate}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-primary)] w-0 rounded-full" />
              </div>
              <div className="text-[11px] text-[var(--color-text-dim)] mt-1">
                0.0% repaid • Initial state
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
