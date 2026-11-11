'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  getLoan,
  deleteLoan,
  recordLoanRepayment,
  deleteLoanRepayment,
  Loan,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from '@/components/toast';
import { ArrowLeft, HandCoins, Plus, Trash2, X } from 'lucide-react';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
  Section,
  Textarea,
} from '@/components/ui';
import type { BadgeTone } from '@/components/ui';

const METHOD_LABELS: Record<Loan['payment_method'], string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  cash: 'Cash',
  bank: 'Bank',
  other: 'Other',
};

function statusTone(status: Loan['status']): BadgeTone {
  if (status === 'settled') return 'neutral';
  if (status === 'overdue') return 'warning';
  return 'accent';
}

function statusLabel(status: Loan['status']): string {
  if (status === 'settled') return 'Settled';
  if (status === 'overdue') return 'Overdue';
  return 'Active';
}

function progressColor(status: Loan['status']): string {
  if (status === 'settled') return 'bg-[var(--color-income)]';
  if (status === 'overdue') return 'bg-[var(--color-warning)]';
  return 'bg-[var(--color-primary)]';
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

function LoanDetailSkeleton() {
  return (
    <AppShell>
      <div className="space-y-6" aria-busy="true" aria-label="Loading loan">
        <div className="skeleton h-4 w-32" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="skeleton h-8 w-56 max-w-full" />
            <div className="skeleton h-4 w-40" />
          </div>
          <div className="skeleton h-9 w-40 rounded-[var(--radius-md)]" />
        </div>
        <div className="skeleton h-64 w-full rounded-[var(--radius-xl)]" />
        <div className="skeleton h-44 w-full rounded-[var(--radius-xl)]" />
      </div>
    </AppShell>
  );
}

export default function LoanDetailPage() {
  return (
    <Suspense fallback={<LoanDetailSkeleton />}>
      <LoanDetailContent />
    </Suspense>
  );
}

function LoanDetailContent() {
  const params = useParams();
  const id =
    typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const router = useRouter();
  const { getToken } = useAuth();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Repayment form state
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Loan['payment_method']>('bkash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [repaymentErrors, setRepaymentErrors] = useState<{ amount?: string; date?: string }>({});
  const [submittingRepayment, setSubmittingRepayment] = useState(false);
  const repaymentDialogRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);

  // Deletion dialogs
  const [showDeleteLoanDialog, setShowDeleteLoanDialog] = useState(false);
  const [deleteRepaymentTarget, setDeleteRepaymentTarget] = useState<string | null>(null);

  const loadLoan = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await getLoan(token, id);
      setLoan(res);
      setLoadError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not load this loan. Try again.';
      setLoadError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [getToken, id]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadLoan();
    })();
  }, [loadLoan]);

  useEffect(() => {
    submittingRef.current = submittingRepayment;
  }, [submittingRepayment]);

  const openRepayModal = () => {
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setRepaymentErrors({});
    setReference('');
    setNotes('');
    setShowRepayModal(true);
  };

  const closeRepayModal = useCallback(() => {
    setShowRepayModal(false);
    setRepaymentErrors({});
  }, []);

  // Dialog behaviour: scroll lock, initial focus, Escape, focus trap, focus restore.
  useEffect(() => {
    if (!showRepayModal) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const first =
        repaymentDialogRef.current?.querySelector<HTMLElement>('#repay-amount') ??
        repaymentDialogRef.current?.querySelector<HTMLElement>('button, input, select');
      first?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!submittingRef.current) closeRepayModal();
        return;
      }
      if (event.key !== 'Tab' || !repaymentDialogRef.current) return;

      const focusable = Array.from(
        repaymentDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [showRepayModal, closeRepayModal]);

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    const parsedAmount = parseFloat(amount);
    const nextErrors: { amount?: string; date?: string } = {};

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Enter an amount greater than zero.';
    } else if (parsedAmount > Number(loan.outstanding_balance)) {
      nextErrors.amount = `Enter no more than the outstanding balance of ${formatMoney(
        loan.outstanding_balance,
        loan.currency,
      )}.`;
    }
    if (!paymentDate) {
      nextErrors.date = 'Choose the date the payment was made.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setRepaymentErrors(nextErrors);
      return;
    }

    setRepaymentErrors({});
    setSubmittingRepayment(true);
    try {
      const token = await getToken();
      if (!token) return;

      await recordLoanRepayment(token, id, {
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast('Repayment recorded', 'success');
      setAmount('');
      setReference('');
      setNotes('');
      closeRepayModal();
      loadLoan();
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : 'Could not record the repayment. Try again.',
        'error',
      );
    } finally {
      setSubmittingRepayment(false);
    }
  };

  const handleDeleteLoan = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await deleteLoan(token, id);
      toast('Loan deleted', 'success');
      router.push('/loans');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not delete the loan. Try again.', 'error');
    }
  };

  const handleDeleteRepayment = async () => {
    if (!deleteRepaymentTarget) return;
    try {
      const token = await getToken();
      if (!token) return;

      await deleteLoanRepayment(token, id, deleteRepaymentTarget);
      toast('Repayment deleted', 'success');
      setDeleteRepaymentTarget(null);
      loadLoan();
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : 'Could not delete the repayment. Try again.',
        'error',
      );
    }
  };

  if (loading) {
    return <LoanDetailSkeleton />;
  }

  if (loadError && !loan) {
    return (
      <AppShell>
        <Card padding="lg" className="mx-auto max-w-xl">
          <ErrorState
            title="Could not load this loan"
            description={loadError}
            onRetry={() => {
              setLoading(true);
              void loadLoan();
            }}
          />
        </Card>
      </AppShell>
    );
  }

  if (!loan) {
    return (
      <AppShell>
        <Card padding="lg" className="mx-auto max-w-xl">
          <EmptyState
            icon={<HandCoins aria-hidden="true" />}
            title="Loan not found"
            description="This loan may have been deleted, or it belongs to another account."
            action={
              <ButtonLink
                href="/loans"
                variant="secondary"
                leadingIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              >
                Back to debts & loans
              </ButtonLink>
            }
          />
        </Card>
      </AppShell>
    );
  }

  const isLent = loan.direction === 'lent';
  const isSettled = loan.status === 'settled';
  const isOverdue = loan.status === 'overdue';
  const repayments = loan.repayments ?? [];
  const progress = clampPct(loan.progress_pct);

  return (
    <AppShell>
      <div className="space-y-8">
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
          title={loan.person_name}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="outline" dot>
                {isLent ? 'Lent' : 'Borrowed'}
              </Badge>
              <Badge tone={statusTone(loan.status)} dot>
                {statusLabel(loan.status)}
              </Badge>
              {loan.person_contact && <span>{loan.person_contact}</span>}
            </div>
          }
          actions={
            <>
              {!isSettled && (
                <Button
                  variant="primary"
                  onClick={openRepayModal}
                  leadingIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                >
                  Record repayment
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setShowDeleteLoanDialog(true)}
                leadingIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                className="text-[var(--color-danger)]! hover:bg-[var(--color-danger-subtle)]!"
              >
                Delete loan
              </Button>
            </>
          }
        />

        {/* Balance summary */}
        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border-sky)] bg-gradient-to-b from-[#f2f8ff] to-[var(--color-surface)] p-1.5 shadow-[var(--shadow-sm)] dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
          <Card padding="lg" className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-label text-[var(--color-text-muted)]">
                  {isLent ? 'Remaining to collect' : 'Remaining to repay'}
                </p>
                <p className="text-metric-xl mt-1 tabular-nums">
                  {formatMoney(loan.outstanding_balance, loan.currency)}
                </p>
                <p className="text-secondary mt-1.5 tabular-nums">
                  {formatMoney(loan.principal_amount, loan.currency)} original
                  <span aria-hidden="true"> · </span>
                  {formatMoney(loan.total_repaid, loan.currency)} repaid
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-label text-[var(--color-text-muted)]">Progress</p>
                <p className="text-metric-sm mt-1 tabular-nums">{progress}% repaid</p>
                <p className="text-caption mt-0.5">
                  {isSettled ? 'Fully settled' : `${formatMoney(loan.outstanding_balance, loan.currency)} left`}
                </p>
              </div>
            </div>

            <div>
              <div
                role="progressbar"
                aria-label="Loan repayment progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-150 ${progressColor(loan.status)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-caption tabular-nums">
                <span>{formatMoney(loan.total_repaid, loan.currency)} repaid</span>
                <span>{formatMoney(loan.outstanding_balance, loan.currency)} remaining</span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[var(--color-border)] pt-5 sm:grid-cols-4">
              <div>
                <dt className="text-caption">Loan date</dt>
                <dd className="text-body mt-0.5 tabular-nums">{formatDate(loan.loan_date)}</dd>
              </div>
              <div>
                <dt className="text-caption">Due date</dt>
                <dd
                  className={`text-body mt-0.5 tabular-nums ${
                    isOverdue ? 'text-[var(--color-warning)]' : ''
                  }`}
                >
                  {loan.due_date ? formatDate(loan.due_date) : 'No due date'}
                </dd>
              </div>
              <div>
                <dt className="text-caption">Method</dt>
                <dd className="text-body mt-0.5">{METHOD_LABELS[loan.payment_method]}</dd>
              </div>
              <div>
                <dt className="text-caption">Currency</dt>
                <dd className="text-body mt-0.5">{loan.currency}</dd>
              </div>
            </dl>

            {loan.notes && (
              <div className="border-t border-[var(--color-border)] pt-4">
                <p className="text-caption">Notes</p>
                <p className="text-body mt-1 whitespace-pre-line">{loan.notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Repayment history */}
        <Section
          title="Repayment history"
          description={
            repayments.length > 0
              ? `${repayments.length} ${repayments.length === 1 ? 'payment' : 'payments'} recorded`
              : 'Payments recorded against this loan appear here.'
          }
        >
          {repayments.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={<HandCoins aria-hidden="true" />}
                title="No repayments yet"
                description="Record the first payment to keep the remaining balance up to date."
                action={
                  !isSettled ? (
                    <Button variant="secondary" size="sm" onClick={openRepayModal}>
                      Record repayment
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="surface-card overflow-hidden">
              <ul role="list" className="divide-y divide-[var(--color-border)]">
                {repayments.map((repayment) => (
                  <li key={repayment.id}>
                    <div className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
                      <div className="min-w-0">
                        <p className="text-body tabular-nums">
                          {formatDate(repayment.payment_date)}
                        </p>
                        <p className="text-caption mt-0.5 truncate">
                          {METHOD_LABELS[repayment.payment_method]}
                          {repayment.reference ? ` · ${repayment.reference}` : ''}
                          {repayment.notes ? ` · ${repayment.notes}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-metric-sm tabular-nums">
                          {formatMoney(repayment.amount, loan.currency)}
                        </span>
                        <IconButton
                          label={`Delete repayment of ${formatMoney(repayment.amount, loan.currency)} on ${formatDate(repayment.payment_date)}`}
                          size="sm"
                          onClick={() => setDeleteRepaymentTarget(repayment.id)}
                          className="text-[var(--color-text-subtle)]! hover:bg-[var(--color-danger-subtle)]! hover:text-[var(--color-danger)]!"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* Repayment dialog */}
        {showRepayModal && (
          <div
            className="fixed inset-0 z-[80] flex animate-fade-in items-end justify-center bg-[var(--color-scrim)] sm:items-center sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !submittingRepayment) {
                closeRepayModal();
              }
            }}
          >
            <div
              ref={repaymentDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="repay-dialog-title"
              aria-describedby="repay-dialog-context"
              onMouseDown={(event) => event.stopPropagation()}
              className="max-h-[calc(100dvh-1rem)] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-xl)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="repay-dialog-title" className="text-section-title">
                    Record repayment
                  </h2>
                  <p id="repay-dialog-context" className="text-secondary mt-1">
                    {isLent ? `Payment from ${loan.person_name}` : `Payment to ${loan.person_name}`}
                  </p>
                </div>
                <IconButton
                  label="Close"
                  size="sm"
                  onClick={closeRepayModal}
                  disabled={submittingRepayment}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>

              <div className="mt-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-label">Outstanding balance</span>
                  <span className="text-metric-sm tabular-nums">
                    {formatMoney(loan.outstanding_balance, loan.currency)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleRecordRepayment} noValidate className="mt-4 space-y-4">
                <Field
                  id="repay-amount"
                  label={`Amount (${loan.currency})`}
                  required
                  error={repaymentErrors.amount}
                  hint="Pay any amount up to the outstanding balance."
                >
                  <Input
                    id="repay-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    max={Number(loan.outstanding_balance)}
                    required
                    placeholder="0.00"
                    value={amount}
                    invalid={Boolean(repaymentErrors.amount)}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (repaymentErrors.amount) {
                        setRepaymentErrors((prev) => ({ ...prev, amount: undefined }));
                      }
                    }}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="repay-date"
                    label="Payment date"
                    required
                    error={repaymentErrors.date}
                  >
                    <Input
                      id="repay-date"
                      type="date"
                      required
                      value={paymentDate}
                      invalid={Boolean(repaymentErrors.date)}
                      onChange={(e) => {
                        setPaymentDate(e.target.value);
                        if (repaymentErrors.date) {
                          setRepaymentErrors((prev) => ({ ...prev, date: undefined }));
                        }
                      }}
                    />
                  </Field>
                  <Field id="repay-method" label="Method">
                    <Select
                      id="repay-method"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as Loan['payment_method'])
                      }
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                </div>

                <Field
                  id="repay-reference"
                  label="Reference"
                  hint="Optional transaction ID or note."
                >
                  <Input
                    id="repay-reference"
                    type="text"
                    placeholder="e.g. TRX123456"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </Field>

                <Field id="repay-notes" label="Notes" hint="Optional.">
                  <Textarea
                    id="repay-notes"
                    rows={2}
                    placeholder="e.g. Partial payment after salary."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <Button
                    variant="secondary"
                    onClick={closeRepayModal}
                    disabled={submittingRepayment}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submittingRepayment}>
                    Record repayment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDeleteLoanDialog}
          title="Delete loan"
          message={`Delete the loan with ${loan.person_name}? Its repayment history will be deleted too.`}
          confirmLabel="Delete loan"
          onConfirm={handleDeleteLoan}
          onCancel={() => setShowDeleteLoanDialog(false)}
        />

        <ConfirmDialog
          open={Boolean(deleteRepaymentTarget)}
          title="Delete repayment"
          message="Delete this repayment? The outstanding balance will increase by the payment amount."
          confirmLabel="Delete repayment"
          onConfirm={handleDeleteRepayment}
          onCancel={() => setDeleteRepaymentTarget(null)}
        />
      </div>
    </AppShell>
  );
}
