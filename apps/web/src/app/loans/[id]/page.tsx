'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import Link from 'next/link';
import { ArrowLeft, Plus, ArrowDownLeft, Trash2, X } from 'lucide-react';

export default function LoanDetailPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="max-w-4xl mx-auto py-12 text-center text-sm text-[var(--color-text-dim)]">
            Loading loan details...
          </div>
        </AppShell>
      }
    >
      <LoanDetailContent />
    </Suspense>
  );
}

function LoanDetailContent() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const router = useRouter();
  const { getToken } = useAuth();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  // Repayment form state
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('bkash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingRepayment, setSubmittingRepayment] = useState(false);

  // Deletion modals
  const [showDeleteLoanDialog, setShowDeleteLoanDialog] = useState(false);
  const [deleteRepaymentTarget, setDeleteRepaymentTarget] = useState<string | null>(null);

  const openRepayModal = () => {
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowRepayModal(true);
  };

  const loadLoan = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await getLoan(token, id);
      setLoan(res);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to load loan details', 'error');
    } finally {
      setLoading(false);
    }
  }, [getToken, id]);

  useEffect(() => {
    loadLoan();
  }, [loadLoan]);

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      toast('Please enter a valid amount greater than zero', 'error');
      return;
    }

    if (parsedAmt > Number(loan.outstanding_balance)) {
      toast(`Repayment exceeds outstanding balance of ${formatMoney(loan.outstanding_balance, loan.currency)}`, 'error');
      return;
    }

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

      toast('Repayment recorded successfully!', 'success');
      setShowRepayModal(false);
      setAmount('');
      setReference('');
      setNotes('');
      loadLoan();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to record repayment', 'error');
    } finally {
      setSubmittingRepayment(false);
    }
  };

  const handleDeleteLoan = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await deleteLoan(token, id);
      toast('Loan deleted successfully', 'success');
      router.push('/loans');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete loan', 'error');
    }
  };

  const handleDeleteRepayment = async () => {
    if (!deleteRepaymentTarget) return;
    try {
      const token = await getToken();
      if (!token) return;

      await deleteLoanRepayment(token, id, deleteRepaymentTarget);
      toast('Repayment record deleted', 'success');
      setDeleteRepaymentTarget(null);
      loadLoan();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete repayment', 'error');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  if (!loan) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-text)]">Loan record not found</h2>
          <p className="text-sm text-[var(--color-text-muted)]">This loan may have been deleted or belongs to another user.</p>
          <Link
            href="/loans"
            className="inline-flex items-center gap-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Debts & Loans</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isLent = loan.direction === 'lent';
  const isSettled = loan.status === 'settled';
  const isOverdue = loan.status === 'overdue';

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/loans"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Debts & Loans</span>
          </Link>

          <button
            onClick={() => setShowDeleteLoanDialog(true)}
            className="text-xs text-[var(--color-danger)] hover:underline font-semibold cursor-pointer"
          >
            Delete Loan
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                    isLent
                      ? 'bg-[var(--color-pale-mint)] text-[var(--color-text)]'
                      : 'bg-[var(--color-pale-yellow)] text-[var(--color-text)]'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isLent ? 'bg-[var(--color-mint)]' : 'bg-[var(--color-amber)]'}`} />
                  {isLent ? 'I Lent Money' : 'I Borrowed Money'}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize border ${
                    isSettled
                      ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-dim)] border-[var(--color-border)]'
                      : isOverdue
                      ? 'bg-[var(--color-pale-yellow)] text-[var(--color-text)] border-[var(--color-border)]'
                      : 'bg-[var(--color-pale-cyan)] text-[var(--color-text)] border-[var(--color-border)]'
                  }`}
                >
                  {loan.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight mt-2">
                {loan.person_name}
              </h1>
              {loan.person_contact && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{loan.person_contact}</p>
              )}
            </div>

            {!isSettled && (
              <button
                onClick={openRepayModal}
                className="inline-flex items-center gap-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Repayment</span>
              </button>
            )}
          </div>

          {/* Outstanding Balance Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border)]">
            <div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {isLent ? 'Remaining to Collect' : 'Remaining to Pay'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--color-text)] mt-1 tracking-tight">
                {formatMoney(loan.outstanding_balance, loan.currency)}
              </div>
            </div>

            <div>
              <div className="text-xs text-[var(--color-text-muted)]">Original Principal</div>
              <div className="text-xl font-bold tabular-nums text-[var(--color-text)] mt-1">
                {formatMoney(loan.principal_amount, loan.currency)}
              </div>
            </div>

            <div>
              <div className="text-xs text-[var(--color-text-muted)]">Total Repaid</div>
              <div className="text-xl font-bold tabular-nums text-[var(--color-text)] mt-1">
                {formatMoney(loan.total_repaid, loan.currency)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isSettled
                    ? 'bg-[var(--color-mint)]'
                    : isOverdue
                    ? 'bg-[var(--color-amber)]'
                    : 'bg-[var(--color-primary)]'
                }`}
                style={{ width: `${loan.progress_pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-medium">
              <span className="tabular-nums">{loan.progress_pct}% settled</span>
              <span className="tabular-nums">{formatMoney(loan.total_repaid, loan.currency)} / {formatMoney(loan.principal_amount, loan.currency)}</span>
            </div>
          </div>

          {/* Loan Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--color-border)] text-xs">
            <div>
              <span className="text-[var(--color-text-muted)] block">Loan Date</span>
              <span className="font-semibold text-[var(--color-text)]">{loan.loan_date}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Due Date</span>
              <span className={`font-semibold ${isOverdue ? 'text-[var(--color-warning)]' : 'text-[var(--color-text)]'}`}>
                {loan.due_date || 'No due date'}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Transfer Method</span>
              <span className="font-semibold text-[var(--color-text)] capitalize">{loan.payment_method}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Currency</span>
              <span className="font-semibold text-[var(--color-text)]">{loan.currency}</span>
            </div>
          </div>

          {loan.notes && (
            <div className="pt-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] p-3 rounded-xl">
              <strong>Notes:</strong> {loan.notes}
            </div>
          )}
        </div>

        {/* Repayment History Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              Repayment History ({loan.repayments?.length || 0})
            </h2>
            {!isSettled && (
              <button
                onClick={openRepayModal}
                className="text-xs text-[var(--color-primary)] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Partial Payment</span>
              </button>
            )}
          </div>

          {!loan.repayments || loan.repayments.length === 0 ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 text-center text-sm text-[var(--color-text-muted)]">
              No repayments recorded yet. Use the &quot;+ Record Repayment&quot; button to log partial or full payments.
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[var(--color-bg)] text-[var(--color-text-dim)] uppercase text-[11px] tracking-wider border-b border-[var(--color-border)]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-[var(--color-border)]">
                  {loan.repayments.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[var(--color-text)]">
                        {rep.payment_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[var(--color-text)] tabular-nums">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--color-mint)]" />
                          <span>{formatMoney(rep.amount, loan.currency)}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-[var(--color-text-muted)]">
                        {rep.payment_method}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-dim)]">
                        {rep.reference || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteRepaymentTarget(rep.id)}
                          className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                          title="Delete Repayment Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Record Repayment Modal */}
        {showRepayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--color-text)]">Record Repayment</h3>
                <button
                  onClick={() => setShowRepayModal(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[var(--color-bg)] p-3 rounded-xl text-xs space-y-1">
                <div className="text-[var(--color-text-muted)]">
                  Outstanding Balance:{' '}
                  <strong className="text-[var(--color-text)] font-semibold">
                    {formatMoney(loan.outstanding_balance, loan.currency)}
                  </strong>
                </div>
              </div>

              <form onSubmit={handleRecordRepayment} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label htmlFor="repay-amount" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                    Repayment Amount ({loan.currency}) <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    id="repay-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(loan.outstanding_balance)}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="repay-date" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                      Payment Date <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      id="repay-date"
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="repay-method" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                      Method
                    </label>
                    <select
                      id="repay-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] capitalize cursor-pointer"
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="repay-reference" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                    Reference / Transaction ID
                  </label>
                  <input
                    id="repay-reference"
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. TRX123456"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label htmlFor="repay-notes" className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                    Notes
                  </label>
                  <input
                    id="repay-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional note"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRepayModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRepayment}
                    className="w-1/2 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submittingRepayment ? 'Saving...' : 'Confirm Repayment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Loan Dialog */}
        <ConfirmDialog
          open={showDeleteLoanDialog}
          title="Delete Entire Loan"
          message={`Are you sure you want to delete the loan with "${loan.person_name}"? All repayment history will be deleted.`}
          confirmLabel="Delete Loan"
          onConfirm={handleDeleteLoan}
          onCancel={() => setShowDeleteLoanDialog(false)}
        />

        {/* Delete Repayment Dialog */}
        <ConfirmDialog
          open={!!deleteRepaymentTarget}
          title="Delete Repayment Record"
          message="Are you sure you want to delete this repayment record? The outstanding loan balance will increase accordingly."
          confirmLabel="Delete Repayment"
          onConfirm={handleDeleteRepayment}
          onCancel={() => setDeleteRepaymentTarget(null)}
        />
      </div>
    </AppShell>
  );
}
