'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import { createLoan } from '@/lib/api';
import { SUPPORTED_CURRENCIES, formatMoney } from '@/lib/format';
import { toast } from '@/components/toast';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight } from 'lucide-react';
import {
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  PageHeader,
  SegmentedControl,
  Select,
  Textarea,
} from '@/components/ui';

type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  cash: 'Cash',
  bank: 'Bank',
};

const METHOD_OPTIONS = (Object.keys(METHOD_LABELS) as PaymentMethod[]).map((method) => ({
  value: method,
  label: METHOD_LABELS[method],
}));

interface FormErrors {
  personName?: string;
  amount?: string;
  dueDate?: string;
}

export default function NewLoanPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [direction, setDirection] = useState<'lent' | 'borrowed'>('lent');
  const [personName, setPersonName] = useState('');
  const [personContact, setPersonContact] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [loanDate, setLoanDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Resolved after mount so the server and client render the same empty value.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only default date, read once after hydration
    setLoanDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: FormErrors = {};
    const parsedAmount = parseFloat(amount);

    if (!personName.trim()) {
      nextErrors.personName = "Enter the person's name.";
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Enter an amount greater than zero.';
    }
    if (dueDate && loanDate && dueDate < loanDate) {
      nextErrors.dueDate = 'The repayment date cannot be before the loan date.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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

      toast('Loan created', 'success');
      router.push('/loans');
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : 'Could not create the loan. Try again.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const numericAmount = parseFloat(amount) || 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link
            href="/loans"
            className="inline-flex items-center gap-1.5 text-secondary transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Debts & loans
          </Link>
        </div>

        <PageHeader
          title="New loan"
          description="Record money you lent or borrowed, then track repayments until the balance is clear."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
          <Card padding="lg">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Direction */}
              <fieldset>
                <legend className="text-label">Direction</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: 'lent',
                        title: 'I lent money',
                        description: 'Someone owes you this back.',
                        icon: ArrowUpRight,
                      },
                      {
                        value: 'borrowed',
                        title: 'I borrowed money',
                        description: 'You need to pay this back.',
                        icon: ArrowDownLeft,
                      },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const selected = direction === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-3.5 transition-colors duration-[var(--duration-fast)] ${
                          selected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                            selected
                              ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]'
                              : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-body font-medium">{option.title}</span>
                          <span className="text-secondary block">{option.description}</span>
                        </span>
                        <input
                          type="radio"
                          name="loan-direction"
                          value={option.value}
                          checked={selected}
                          onChange={() => setDirection(option.value)}
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Person */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="loan-person-name"
                  label="Person's name"
                  required
                  error={errors.personName}
                >
                  <Input
                    id="loan-person-name"
                    type="text"
                    autoComplete="off"
                    required
                    placeholder="e.g. Rahim Ahmed"
                    value={personName}
                    invalid={Boolean(errors.personName)}
                    onChange={(e) => {
                      setPersonName(e.target.value);
                      if (errors.personName) {
                        setErrors((prev) => ({ ...prev, personName: undefined }));
                      }
                    }}
                  />
                </Field>
                <Field id="loan-person-contact" label="Contact" hint="Optional phone or email.">
                  <Input
                    id="loan-person-contact"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. +880 1700 000000"
                    value={personContact}
                    onChange={(e) => setPersonContact(e.target.value)}
                  />
                </Field>
              </div>

              {/* Amount & currency */}
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
                <Field id="loan-amount" label="Principal amount" required error={errors.amount}>
                  <Input
                    id="loan-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    invalid={Boolean(errors.amount)}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) {
                        setErrors((prev) => ({ ...prev, amount: undefined }));
                      }
                    }}
                  />
                </Field>
                <Field id="loan-currency" label="Currency">
                  <Select
                    id="loan-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {SUPPORTED_CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {/* Transfer method */}
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

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="loan-date" label="Loan date" required>
                  <Input
                    id="loan-date"
                    type="date"
                    required
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                  />
                </Field>
                <Field
                  id="loan-due-date"
                  label="Expected repayment"
                  hint="Optional."
                  error={errors.dueDate}
                >
                  <Input
                    id="loan-due-date"
                    type="date"
                    min={loanDate}
                    value={dueDate}
                    invalid={Boolean(errors.dueDate)}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      if (errors.dueDate) {
                        setErrors((prev) => ({ ...prev, dueDate: undefined }));
                      }
                    }}
                  />
                </Field>
              </div>

              {/* Notes */}
              <Field id="loan-notes" label="Notes" hint="Optional terms, context, or reminders.">
                <Textarea
                  id="loan-notes"
                  rows={3}
                  placeholder="e.g. Repay before the end of the month."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:justify-end">
                <ButtonLink href="/loans" variant="secondary">
                  Cancel
                </ButtonLink>
                <Button type="submit" variant="primary" loading={submitting}>
                  Save loan
                </Button>
              </div>
            </form>
          </Card>

          {/* Preview */}
          <Card padding="lg" className="space-y-4 lg:sticky lg:top-6">
            <div>
              <p className="text-label text-[var(--color-text-muted)]">Summary</p>
              <p className="text-secondary mt-1">
                {direction === 'lent'
                  ? `${personName.trim() || 'This person'} will owe you`
                  : `You will owe ${personName.trim() || 'this person'}`}
              </p>
              <p className="text-metric mt-1 tabular-nums">
                {formatMoney(numericAmount, currency)}
              </p>
            </div>

            <dl className="space-y-2 border-t border-[var(--color-border)] pt-4 text-secondary">
              <div className="flex items-baseline justify-between gap-3">
                <dt>Direction</dt>
                <dd className="text-[var(--color-text)]">
                  {direction === 'lent' ? 'Lent' : 'Borrowed'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt>Method</dt>
                <dd className="text-[var(--color-text)]">{METHOD_LABELS[paymentMethod]}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt>Loan date</dt>
                <dd className="tabular-nums text-[var(--color-text)]">
                  {loanDate || 'Not set'}
                </dd>
              </div>
              {dueDate && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt>Repayment date</dt>
                  <dd className="tabular-nums text-[var(--color-text)]">{dueDate}</dd>
                </div>
              )}
            </dl>

            <div className="border-t border-[var(--color-border)] pt-4">
              <div className="flex items-baseline justify-between gap-3 text-caption">
                <span>Repaid</span>
                <span className="tabular-nums">0%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                <div className="h-full w-0 rounded-full bg-[var(--color-primary)]" />
              </div>
              <p className="text-caption mt-1.5">No repayments recorded yet.</p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
