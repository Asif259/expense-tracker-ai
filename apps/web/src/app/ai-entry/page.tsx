'use client';

import { useState, useEffect, useCallback, useRef, Suspense, type FormEvent } from 'react';
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
import { VoiceInputControl } from '@/components/voice-input-control';
import { useSpeechRecognition, SupportedSpeechLang } from '@/lib/use-speech-recognition';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Section,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileText,
  RefreshCw,
} from 'lucide-react';

const QUICK_EXAMPLES = [
  'Spent 350 taka on lunch today',
  'Paid 1,200 BDT for grocery items at Agora yesterday',
  'Received 65000 BDT salary from employer',
  'Uber ride to office 280 taka this morning',
  'আজ দুপুরে লাঞ্চে ২৫০ টাকা খরচ করেছি',
];

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function AiEntryInner() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();

  const [inputQuery, setInputQuery] = useState(() => searchParams.get('prompt') || '');
  const [currencyPref, setCurrencyPref] = useState('BDT');
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseExpenseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<SupportedSpeechLang>('en-US');

  // Baseline text tracker to preserve text before spoken input and support cancel revert
  const baselineQueryRef = useRef('');

  const speech = useSpeechRecognition({
    lang: speechLang,
    onResult: (spokenText) => {
      const base = baselineQueryRef.current.trim();
      const combined = base ? `${base} ${spokenText}` : spokenText;
      setInputQuery(combined);
    },
    onError: (friendlyMsg, code) => {
      if (code !== 'no-speech' && code !== 'aborted') {
        toast(friendlyMsg, 'error');
      }
    },
  });

  const handleStartVoice = () => {
    baselineQueryRef.current = inputQuery;
    speech.start();
  };

  const handleCancelVoice = () => {
    speech.cancel();
    setInputQuery(baselineQueryRef.current);
  };

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

  const handleParse = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    if (speech.isListening) {
      speech.stop();
    }

    const text = inputQuery.trim();
    if (!text) {
      toast('Please enter or speak an expense description.', 'error');
      return;
    }

    setParsing(true);
    setParseError(null);
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
        toast('Draft created. Review it below before saving.', 'success');
        loadPendingDrafts();
      } else if (result.clarificationNeeded) {
        toast(result.message || 'A little more detail is needed.', 'info');
      }
    } catch (err: unknown) {
      setParseError(
        err instanceof Error
          ? err.message
          : "We couldn't read that description right now. Check your connection and try again.",
      );
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
      toast('Transaction saved.', 'success');

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
      toast('Draft discarded.', 'info');

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

  const extracted = parseResult?.extracted;
  const draftCountLabel = `${drafts.length} draft${drafts.length === 1 ? '' : 's'}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="Add a transaction by describing it"
          description="Type or say something like “Spent 350 BDT on lunch today”. You'll review the draft below and confirm it before it is saved."
        />

        {/* Input */}
        <Card className="p-5 sm:p-6">
          <form onSubmit={handleParse} className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Field
                id="transaction-description-input"
                label="Description"
                className="min-w-0 flex-1"
              >
                <Textarea
                  id="transaction-description-input"
                  rows={3}
                  required
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="e.g. Paid 1,200 BDT for groceries at Agora yesterday evening"
                />
              </Field>

              <Field
                id="currency-preference"
                label="Currency"
                className="w-full sm:w-28 sm:shrink-0"
              >
                <Select
                  id="currency-preference"
                  value={currencyPref}
                  onChange={(e) => setCurrencyPref(e.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* Voice input */}
            <VoiceInputControl
              isSupported={speech.isSupported}
              isListening={speech.isListening}
              selectedLang={speechLang}
              onLanguageChange={setSpeechLang}
              onStart={handleStartVoice}
              onStop={speech.stop}
              onCancel={handleCancelVoice}
              error={speech.error}
              onClearError={speech.clearError}
              disabled={parsing}
            />

            {/* Unsupported-input fallback: quick examples */}
            <div>
              <p className="text-label text-[var(--color-text-muted)]">Examples you can edit</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setInputQuery(example)}
                    className="max-w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-left text-label text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
              <p className="text-caption max-w-sm">
                Nothing is saved until you confirm the draft.
              </p>
              <Button type="submit" variant="primary" loading={parsing}>
                Create draft
              </Button>
            </div>
          </form>
        </Card>

        {/* Parse failure */}
        {parseError && (
          <Alert
            tone="danger"
            title="We couldn't read that description"
            action={
              <ButtonLink href="/transactions/new" variant="secondary" size="sm">
                Add it manually
              </ButtonLink>
            }
          >
            {parseError} You can rephrase the sentence and try again.
          </Alert>
        )}

        {/* Parsed draft awaiting confirmation */}
        {parseResult && (
          <Card className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                    parseResult.success
                      ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                      : 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]'
                  }`}
                >
                  {parseResult.success ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <h2 className="text-card-title">
                    {parseResult.success ? 'Draft ready to review' : 'A little more detail is needed'}
                  </h2>
                  <p className="text-secondary mt-0.5">{parseResult.message}</p>
                </div>
              </div>
              {parseResult.draftId && <Badge tone="outline">Draft</Badge>}
            </div>

            {extracted && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-[var(--color-border)] py-4 sm:grid-cols-4">
                <div>
                  <dt className="text-label text-[var(--color-text-muted)]">Type</dt>
                  <dd className="mt-1">
                    <Badge tone={extracted.type === 'income' ? 'success' : 'neutral'}>
                      {capitalize(extracted.type || 'expense')}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-[var(--color-text-muted)]">Amount</dt>
                  <dd className="text-metric-sm mt-1 tabular-nums">
                    {extracted.amount
                      ? formatMoney(extracted.amount, extracted.currency || 'BDT')
                      : '—'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-label text-[var(--color-text-muted)]">Category</dt>
                  <dd className="text-card-title mt-1 truncate">
                    {extracted.category_name || parseResult.proposedCategory || 'Uncategorized'}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-[var(--color-text-muted)]">Date</dt>
                  <dd className="text-card-title mt-1 tabular-nums">
                    {extracted.transaction_date || 'Today'}
                  </dd>
                </div>
              </dl>
            )}

            {extracted?.description && (
              <p className="text-secondary">“{extracted.description}”</p>
            )}

            {parseResult.draftId && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setDiscardTargetId(parseResult.draftId!)}
                >
                  Discard
                </Button>
                <Button
                  variant="primary"
                  loading={actionDraftId === parseResult.draftId}
                  onClick={() => handleConfirm(parseResult.draftId!)}
                  leadingIcon={<Check className="h-4 w-4" aria-hidden="true" />}
                >
                  Confirm and save
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Drafts to review */}
        <Section
          title="Drafts to review"
          description={
            drafts.length > 0
              ? `${draftCountLabel} waiting for your confirmation.`
              : 'Drafts appear here until you save or discard them.'
          }
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPendingDrafts}
              leadingIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              Refresh
            </Button>
          }
        >
          {loadingDrafts ? (
            <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {[0, 1].map((i) => (
                <li key={i} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="w-64" style={{ height: 14 }} />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-[var(--radius-md)]" />
                    <Skeleton className="h-8 w-20 rounded-[var(--radius-md)]" />
                  </div>
                </li>
              ))}
            </ul>
          ) : drafts.length === 0 ? (
            <EmptyState
              icon={<FileText aria-hidden="true" />}
              title="No drafts to review"
              description="Describe a transaction above and it will appear here, waiting for you to confirm or discard it."
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {drafts.map((d) => {
                const payload = (d.payload || {}) as Record<string, unknown>;
                const amount = String(payload.amount || '0');
                const currency = String(payload.currency || 'BDT');
                const type = String(payload.type || 'expense');
                const desc = String(payload.description || 'No description');
                const txDate = String(payload.transaction_date || '');

                return (
                  <li
                    key={d.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-card-title tabular-nums">
                          {formatMoney(amount, currency)}
                        </span>
                        <Badge tone={type === 'income' ? 'success' : 'neutral'}>
                          {capitalize(type)}
                        </Badge>
                        {txDate && (
                          <span className="text-caption tabular-nums">{formatDate(txDate)}</span>
                        )}
                      </div>
                      <p className="text-secondary mt-1 break-words">{desc}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDiscardTargetId(d.id)}
                      >
                        Discard
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={actionDraftId === d.id}
                        onClick={() => handleConfirm(d.id)}
                        leadingIcon={<Check className="h-4 w-4" aria-hidden="true" />}
                      >
                        Confirm
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      {/* Discard confirmation dialog */}
      <ConfirmDialog
        open={!!discardTargetId}
        title="Discard draft"
        message="This draft will be removed and nothing will be saved. You can describe the transaction again at any time."
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
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
            <Skeleton className="h-56 w-full rounded-[var(--radius-xl)]" />
            <Skeleton className="h-40 w-full rounded-[var(--radius-xl)]" />
          </div>
        </AppShell>
      }
    >
      <AiEntryInner />
    </Suspense>
  );
}
