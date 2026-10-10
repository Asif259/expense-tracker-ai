'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  parseExpense,
  listDrafts,
  confirmDraft,
  discardDraft,
  ParseExpenseResult,
  AiDraft,
} from '@/lib/api';
import { formatMoney, formatDate, SUPPORTED_CURRENCIES } from '@/lib/format';
import { toast } from '@/components/toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  CheckCircle2,
  AlertTriangle,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const QUICK_EXAMPLES = [
  'Spent 350 taka on lunch today',
  'Paid 1,200 BDT for grocery items at Agora yesterday',
  'Received 65000 BDT salary from employer',
  'Uber ride to office 280 taka this morning',
];

function AiEntryInner() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();

  const [inputQuery, setInputQuery] = useState('');
  const [currencyPref, setCurrencyPref] = useState('BDT');
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseExpenseResult | null>(null);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInputQuery(prompt);
    }
  }, [searchParams]);

  // Pending drafts
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [actionDraftId, setActionDraftId] = useState<string | null>(null);
  const [discardTargetId, setDiscardTargetId] = useState<string | null>(null);

  const loadPendingDrafts = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await listDrafts(token);
      setDrafts(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingDrafts(false);
    }
  }, [getToken]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getToken();
        if (!token || !mounted) return;

        const res = await listDrafts(token);
        if (mounted) {
          setDrafts(res.data || []);
          setLoadingDrafts(false);
        }
      } catch {
        if (mounted) setLoadingDrafts(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getToken]);

  const handleParse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputQuery.trim();
    if (!text) {
      toast('Please enter an expense or income description.', 'error');
      return;
    }

    setParsing(true);
    setParseResult(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await parseExpense(token, {
        text,
        currency_preference: currencyPref,
      });

      setParseResult(result);
      if (result.success && result.draftId) {
        toast('AI draft created! Review and confirm below.', 'success');
        loadPendingDrafts();
      } else if (result.clarificationNeeded) {
        toast(result.message || 'Clarification needed', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI parsing failed';
      toast(msg, 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async (draftId: string) => {
    setActionDraftId(draftId);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await confirmDraft(token, draftId);
      toast('Transaction confirmed and committed to ledger!', 'success');

      // Clear current parseResult if it matches confirmed draft
      if (parseResult?.draftId === draftId) {
        setParseResult(null);
        setInputQuery('');
      }

      loadPendingDrafts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm draft';
      toast(msg, 'error');
    } finally {
      setActionDraftId(null);
    }
  };

  const handleDiscard = async () => {
    if (!discardTargetId) return;
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await discardDraft(token, discardTargetId);
      toast('Draft discarded', 'info');

      if (parseResult?.draftId === discardTargetId) {
        setParseResult(null);
      }

      setDiscardTargetId(null);
      loadPendingDrafts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to discard draft';
      toast(msg, 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Natural Language Entry</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            State your expenses or income naturally. Groq Llama 3 parses the amounts and creates review drafts with zero direct database mutation.
          </p>
        </div>

        {/* Input box */}
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg space-y-4">
          <form onSubmit={handleParse} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                  Describe Transaction
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-dim)]">Default Currency:</span>
                  <select
                    value={currencyPref}
                    onChange={(e) => setCurrencyPref(e.target.value)}
                    className="px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                required
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="e.g. Paid 1,200 BDT for grocery items at Agora yesterday evening"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              />
            </div>

            {/* Quick example pills */}
            <div>
              <span className="text-[11px] text-[var(--color-text-dim)] block mb-1.5">
                Quick examples to try:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_EXAMPLES.map((eg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputQuery(eg)}
                    className="px-2.5 py-1 text-[11px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-hover)] transition-colors cursor-pointer text-left"
                  >
                    {eg}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={parsing}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[var(--color-secondary)]/20"
              >
                {parsing ? (
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{parsing ? 'Parsing with Groq...' : 'Parse with AI'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Parse Result Card */}
        {parseResult && (
          <div className="p-6 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                {parseResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-mint)] shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[var(--color-amber)] shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-semibold">
                    {parseResult.success
                      ? 'AI Extraction Successful (Pending Draft)'
                      : 'Clarification Needed'}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {parseResult.message}
                  </p>
                </div>
              </div>

              {parseResult.draftId && (
                <span className="text-[11px] font-mono text-[var(--color-text-dim)]">
                  Draft #{parseResult.draftId.slice(0, 8)}
                </span>
              )}
            </div>

            {/* Extracted payload breakdown */}
            {parseResult.extracted && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[var(--color-bg)] text-xs">
                <div>
                  <span className="text-[var(--color-text-dim)] block uppercase tracking-wider text-[10px]">
                    Type
                  </span>
                  <span className="font-semibold capitalize text-[var(--color-text)]">
                    {parseResult.extracted.type || 'expense'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-dim)] block uppercase tracking-wider text-[10px]">
                    Amount
                  </span>
                  <span className="font-bold font-mono text-[var(--color-text)] text-sm">
                    {parseResult.extracted.amount
                      ? formatMoney(
                          parseResult.extracted.amount,
                          parseResult.extracted.currency || 'BDT',
                        )
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-dim)] block uppercase tracking-wider text-[10px]">
                    Category
                  </span>
                  <span className="font-semibold text-[var(--color-text)]">
                    {parseResult.extracted.category_name ||
                      parseResult.proposedCategory ||
                      'Uncategorized'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-dim)] block uppercase tracking-wider text-[10px]">
                    Date
                  </span>
                  <span className="font-semibold text-[var(--color-text)] font-mono">
                    {parseResult.extracted.transaction_date || 'Today'}
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {parseResult.extracted?.description && (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                &quot;{parseResult.extracted.description}&quot;
              </p>
            )}

            {/* Confirmation actions */}
            {parseResult.draftId && (
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setDiscardTargetId(parseResult.draftId!)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] transition-colors cursor-pointer"
                >
                  Discard Draft
                </button>
                <button
                  type="button"
                  disabled={actionDraftId === parseResult.draftId}
                  onClick={() => handleConfirm(parseResult.draftId!)}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[var(--color-primary)]/20 active:scale-[0.98]"
                >
                  {actionDraftId === parseResult.draftId ? (
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Confirm &amp; Record to Ledger</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pending Drafts Queue */}
        <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Unconfirmed AI Drafts Queue</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Drafts created by AI await explicit user confirmation before touching the PostgreSQL transactions ledger.
              </p>
            </div>
            <button
              onClick={loadPendingDrafts}
              className="text-xs text-[var(--color-primary)] hover:underline cursor-pointer flex items-center gap-1.5 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingDrafts ? (
            <div className="space-y-3 py-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-[var(--color-border)]/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--color-text-dim)]">
              No pending drafts in queue.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {drafts.map((d) => {
                const payload = (d.payload || {}) as Record<string, unknown>;
                const amount = String(payload.amount || '0');
                const currency = String(payload.currency || 'BDT');
                const type = String(payload.type || 'expense');
                const desc = String(payload.description || 'No description');
                const txDate = String(payload.transaction_date || '');

                return (
                  <div
                    key={d.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-[var(--color-text)]">
                          {formatMoney(amount, currency)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                          {type}
                        </span>
                        {txDate && (
                          <span className="text-[11px] font-mono text-[var(--color-text-dim)]">
                            • {formatDate(txDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">{desc}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setDiscardTargetId(d.id)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] transition-colors cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        disabled={actionDraftId === d.id}
                        onClick={() => handleConfirm(d.id)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-[var(--color-primary)]/15"
                      >
                        {actionDraftId === d.id ? (
                          <div className="animate-spin h-3.5 w-3.5 border-2 border-[var(--color-primary-contrast)] border-t-transparent rounded-full" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Confirm</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Discard confirmation dialog */}
      <ConfirmDialog
        open={!!discardTargetId}
        title="Discard AI Draft"
        message="Are you sure you want to discard this draft? It will be permanently removed from the pending drafts queue."
        confirmLabel="Discard"
        onConfirm={handleDiscard}
        onCancel={() => setDiscardTargetId(null)}
      />
    </AppShell>
  );
}

export default function AiEntryPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin h-7 w-7 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
          </div>
        </AppShell>
      }
    >
      <AiEntryInner />
    </Suspense>
  );
}
