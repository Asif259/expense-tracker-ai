'use client';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  listTransactions,
  getMonthlySummary,
  analyzeTransactions,
  deleteTransaction,
  Transaction,
  TransactionQuery,
  MonthlySummary,
  AnalysisResult,
  ConversationMessage,
} from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { fetchCategories, Category } from '@/lib/categories';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from '@/components/toast';
import {
  Sparkles,
  Plus,
  ReceiptText,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SendHorizonal,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveDataTable,
  ResponsiveColumn,
  RowAction,
  MobileTableConfig,
} from '@/components/responsive-table';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Field,
  IconButton,
  Input,
  Metric,
  PageHeader,
  Section,
  Select,
  Skeleton,
  Spinner,
  StatStrip,
  Textarea,
} from '@/components/ui';

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function todayMonthYear(): { month: number; year: number } {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function prevMonth(m: number, y: number) {
  return m === 1 ? { month: 12, year: y - 1 } : { month: m - 1, year: y };
}

function nextMonth(m: number, y: number) {
  return m === 12 ? { month: 1, year: y + 1 } : { month: m + 1, year: y };
}

/** Returns true if the given month/year is in the future relative to today. */
function isFutureMonth(m: number, y: number): boolean {
  const { month: todayM, year: todayY } = todayMonthYear();
  return y > todayY || (y === todayY && m > todayM);
}

function monthStartEnd(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { startDate, endDate };
}

// ── Suggested question chips ─────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  'What cost me the most this month?',
  'Which category has the highest spending?',
  'Compare with last month',
  'Summarize my financial activity',
];

// ── Main Page ─────────────────────────────────────────────────────────────────

function TransactionsPageContent() {
  const router = useRouter();
  const { getToken } = useAuth();

  // ── Month navigation ──
  const [selectedMonth, setSelectedMonth] = useState<number>(todayMonthYear().month);
  const [selectedYear, setSelectedYear] = useState<number>(todayMonthYear().year);

  // ── Category data ──
  const [categories, setCategories] = useState<Category[]>([]);

  // ── Summary state ──
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // ── Transaction list state ──
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // ── Filter state ──
  const [filterType, setFilterType] = useState<'' | 'income' | 'expense'>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // ── Delete modal ──
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  // ── AI analyst state ──
  const [aiOpen, setAiOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Category map ──
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (!filterType) return categories;
    return categories.filter((c) => c.type === filterType);
  }, [categories, filterType]);

  // ── Date bounds for selected month ──
  const { startDate, endDate } = useMemo(
    () => monthStartEnd(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  // ── Load categories once ──
  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  // ── Load summary whenever month changes ──
  useEffect(() => {
    let mounted = true;
    (async () => {
      setSummaryLoading(true);
      try {
        const token = await getToken();
        if (!token || !mounted) return;
        const data = await getMonthlySummary(token, selectedMonth, selectedYear);
        if (mounted) setSummary(data);
      } catch {
        // summary errors are non-fatal
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [getToken, selectedMonth, selectedYear]);

  // ── Load transactions whenever month or filters change ──
  useEffect(() => {
    let mounted = true;
    (async () => {
      setListLoading(true);
      try {
        const token = await getToken();
        if (!token || !mounted) return;

        const query: TransactionQuery = {
          limit,
          offset,
          startDate,
          endDate,
        };
        if (filterType) query.type = filterType;
        if (filterCategory) query.category_id = filterCategory;

        const res = await listTransactions(token, query);
        if (mounted) {
          setTransactions(res.data || []);
          setTotal(res.total || 0);
        }
      } catch (err: unknown) {
        if (mounted) {
          toast(err instanceof Error ? err.message : 'Failed to fetch transactions', 'error');
        }
      } finally {
        if (mounted) setListLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [getToken, selectedMonth, selectedYear, filterType, filterCategory, startDate, endDate, offset]);

  // ── Month navigation ──
  const goToPrevMonth = useCallback(() => {
    const p = prevMonth(selectedMonth, selectedYear);
    setSelectedMonth(p.month);
    setSelectedYear(p.year);
    setOffset(0);
  }, [selectedMonth, selectedYear]);

  const goToNextMonth = useCallback(() => {
    if (isFutureMonth(nextMonth(selectedMonth, selectedYear).month, nextMonth(selectedMonth, selectedYear).year)) return;
    const n = nextMonth(selectedMonth, selectedYear);
    setSelectedMonth(n.month);
    setSelectedYear(n.year);
    setOffset(0);
  }, [selectedMonth, selectedYear]);

  const goToCurrentMonth = useCallback(() => {
    const { month, year } = todayMonthYear();
    setSelectedMonth(month);
    setSelectedYear(year);
    setOffset(0);
  }, []);

  const isCurrentMonth = useMemo(() => {
    const { month, year } = todayMonthYear();
    return selectedMonth === month && selectedYear === year;
  }, [selectedMonth, selectedYear]);

  const isNextDisabled = useMemo(() => {
    const n = nextMonth(selectedMonth, selectedYear);
    return isFutureMonth(n.month, n.year);
  }, [selectedMonth, selectedYear]);

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  // ── Delete handler ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteTransaction(token, deleteTarget.id);
      toast('Transaction deleted', 'success');
      setDeleteTarget(null);
      // Refresh both list and summary
      setOffset(0);
      setSummary(null);
      setSummaryLoading(true);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete transaction', 'error');
    }
  }, [deleteTarget, getToken]);

  // ── Filter clear ──
  const handleClearFilters = useCallback(() => {
    setFilterType('');
    setFilterCategory('');
    setFilterSearch('');
    setOffset(0);
  }, []);

  // ── AI submission ──
  const handleAskAI = useCallback(async (q?: string) => {
    const questionText = (q ?? question).trim();
    if (!questionText || aiLoading) return;

    setAiLoading(true);
    setAiError(null);
    setQuestion('');

    // Optimistically add user message to conversation
    const userMsg: ConversationMessage = { role: 'user' as const, content: questionText };
    const updatedHistory = [...conversation, userMsg];

    // Keep history capped at 6 messages (3 exchanges) for token control
    const historyToSend = updatedHistory.slice(-6);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await analyzeTransactions(token, {
        question: questionText,
        period: { month: selectedMonth, year: selectedYear },
        conversationHistory: historyToSend.slice(0, -1), // exclude the new question
      });

      setAiResult(result);
      // Add both question and answer to conversation for follow-up context
      setConversation(prev => [
        ...prev,
        userMsg,
        { role: 'assistant' as const, content: result.answer },
      ].slice(-6));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }, [question, conversation, aiLoading, getToken, selectedMonth, selectedYear]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  }, [handleAskAI]);

  const handleClearConversation = useCallback(() => {
    setConversation([]);
    setAiResult(null);
    setAiError(null);
    setQuestion('');
  }, []);

  // ── Summary display helpers ──
  const summaryFirstCurrency = useMemo(() => {
    if (!summary) return null;
    const entries = Object.entries(summary.currencies);
    if (entries.length === 0) return null;
    // Show primary currency (most transactions usually)
    return entries[0];
  }, [summary]);

  const hasMultipleCurrencies = useMemo(() => {
    if (!summary) return false;
    return Object.keys(summary.currencies).length > 1;
  }, [summary]);

  // ── Client-side search filter (description) ──
  const displayedTransactions = useMemo(() => {
    if (!filterSearch.trim()) return transactions;
    const q = filterSearch.toLowerCase();
    return transactions.filter((tx) =>
      (tx.description || '').toLowerCase().includes(q)
    );
  }, [transactions, filterSearch]);

  // ── Summary values (formatting preserved) ──
  const netValue = summaryFirstCurrency
    ? formatMoney(summaryFirstCurrency[1].net.replace('-', ''), summaryFirstCurrency[0])
    : '—';
  const incomeValue = summaryFirstCurrency
    ? formatMoney(summaryFirstCurrency[1].income, summaryFirstCurrency[0])
    : '—';
  const expensesValue = summaryFirstCurrency
    ? formatMoney(summaryFirstCurrency[1].expenses, summaryFirstCurrency[0])
    : '—';
  const countValue = summary ? summary.transactionCount.toLocaleString() : '—';

  // ── Table columns ──
  const columns: ResponsiveColumn<Transaction>[] = useMemo(
    () => [
      {
        id: 'category',
        header: 'Category',
        role: 'identity',
        priority: 1,
        label: 'Category',
        sortable: true,
        sortValue: (tx) => categoryMap.get(tx.category_id)?.name || 'Uncategorized',
        cell: (tx) => {
          const cat = categoryMap.get(tx.category_id);
          return (
            <div className="min-w-0">
              <span className="block truncate font-medium text-[var(--color-text)]">
                {cat ? cat.name : 'Uncategorized'}
              </span>
              {tx.description && (
                <p className="max-w-[220px] truncate text-caption">{tx.description}</p>
              )}
            </div>
          );
        },
      },
      {
        id: 'amount',
        header: 'Amount',
        role: 'value',
        priority: 2,
        align: 'right',
        isNumeric: true,
        label: 'Amount',
        sortable: true,
        sortValue: (tx) => parseFloat(tx.amount),
        cell: (tx) => {
          const isIncome = tx.type === 'income';
          return (
            <span className="font-medium tabular-nums text-[var(--color-text)]">
              {isIncome ? '+' : '−'} {formatMoney(tx.amount, tx.currency)}
            </span>
          );
        },
      },
      {
        id: 'type',
        header: 'Type',
        role: 'state',
        priority: 3,
        label: 'Type',
        cell: (tx) => {
          const isIncome = tx.type === 'income';
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={isIncome ? 'success' : 'neutral'} dot>
                {isIncome ? 'Income' : 'Expense'}
              </Badge>
              {tx.is_ai_generated && <Badge tone="neutral">AI</Badge>}
            </div>
          );
        },
      },
      {
        id: 'transaction_date',
        header: 'Date',
        role: 'detail',
        priority: 4,
        label: 'Date',
        sortable: true,
        sortValue: (tx) => tx.transaction_date,
        cell: (tx) => (
          <span className="tabular-nums text-[var(--color-text-muted)]">
            {formatDate(tx.transaction_date)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        role: 'action',
        priority: 5,
        align: 'right',
        cell: (tx) => {
          const cat = categoryMap.get(tx.category_id);
          const categoryName = cat ? cat.name : 'Uncategorized';
          return (
            <div className="flex items-center justify-end gap-0.5">
              <Link
                href={`/transactions/${tx.id}/edit`}
                aria-label={`Edit ${categoryName} transaction of ${formatMoney(tx.amount, tx.currency)}`}
                title="Edit transaction"
                className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-subtle)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Link>
              <IconButton
                label={`Delete ${categoryName} transaction of ${formatMoney(tx.amount, tx.currency)}`}
                size="sm"
                onClick={() => setDeleteTarget(tx)}
                className="text-[var(--color-text-subtle)]! hover:bg-[var(--color-danger-subtle)]! hover:text-[var(--color-danger)]!"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </div>
          );
        },
      },
    ],
    [categoryMap],
  );

  const rowActions = useCallback(
    (): RowAction<Transaction>[] => [
      {
        id: 'edit',
        label: 'Edit transaction',
        icon: <Pencil className="h-3.5 w-3.5" aria-hidden="true" />,
        onClick: (t) => router.push(`/transactions/${t.id}/edit`),
      },
      {
        id: 'delete',
        label: 'Delete transaction',
        icon: <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />,
        variant: 'danger',
        onClick: (t) => setDeleteTarget(t),
      },
    ],
    [router],
  );

  const mobileConfig: MobileTableConfig<Transaction> = useMemo(
    () => ({
      identityColumnId: 'category',
      primaryValueColumnId: 'amount',
      stateColumnId: 'type',
      secondaryDetailColumnIds: ['transaction_date'],
      detailMode: 'bottom-sheet',
    }),
    [],
  );

  const hasActiveFilters = Boolean(filterType || filterCategory || filterSearch);

  /**
   * Older analysis responses can contain raw category UUIDs. Resolve any known
   * category id to its name before showing the answer to the user.
   */
  const formatAiText = useCallback(
    (text: string) => {
      let output = text;
      for (const [id, category] of categoryMap) {
        output = output.split(id).join(category.name);
      }
      return output.replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        'uncategorized category',
      );
    },
    [categoryMap],
  );

  // ── Pagination footer (lives inside the table surface) ──
  const paginationFooter = (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-caption" aria-live="polite">
        {displayedTransactions.length > 0
          ? `Showing ${offset + 1}–${Math.min(offset + displayedTransactions.length, total)} of ${total} ${
              total === 1 ? 'transaction' : 'transactions'
            }`
          : 'No transactions to show'}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          className="min-h-[40px]"
          disabled={offset === 0 || listLoading}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="md"
          className="min-h-[40px]"
          disabled={offset + limit >= total || listLoading}
          onClick={() => setOffset(offset + limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-8">
        {/* ── Page header: one primary action ── */}
        <PageHeader
          title="Transactions"
          description="Every income and expense entry, month by month. Filter the list, open a row for details, or ask a question about the month."
          actions={
            <>
              <ButtonLink
                href="/ai-entry"
                variant="secondary"
                className="min-h-[40px]"
                leadingIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
              >
                Add with AI
              </ButtonLink>
              <ButtonLink
                href="/transactions/new"
                variant="primary"
                className="order-first min-h-[40px] w-full sm:order-none sm:w-auto"
                leadingIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
              >
                New transaction
              </ButtonLink>
            </>
          }
        />

        {/* ── Month context + summary (Bento KPI Container) ── */}
        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border-sky)] bg-gradient-to-b from-[#f2f8ff] to-[var(--color-surface)] p-1.5 shadow-[var(--shadow-sm)] dark:border-sky-900/40 dark:from-slate-900 dark:to-slate-950">
          <section
            aria-labelledby="month-activity-heading"
            className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="month-activity-heading" className="text-card-title">{monthLabel}</h2>
              <div className="flex items-center gap-1.5">
                {!isCurrentMonth && (
                  <Button variant="ghost" size="sm" className="min-h-[40px]" onClick={goToCurrentMonth}>
                    This month
                  </Button>
                )}
                <IconButton
                  variant="secondary"
                  size="lg"
                  label="Previous month"
                  onClick={goToPrevMonth}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  variant="secondary"
                  size="lg"
                  label="Next month"
                  onClick={goToNextMonth}
                  disabled={isNextDisabled}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>
            </div>

            <StatStrip>
              <Metric
                size="lg"
                label="Net balance"
                hint="Income minus expenses"
                className="py-3.5 sm:px-4 sm:first:pl-0"
                value={
                  summaryLoading ? (
                    <Skeleton className="h-7 w-28" />
                  ) : (
                    <span className="tabular-nums">{netValue}</span>
                  )
                }
              />
              <Metric
                label="Income"
                className="py-3.5 sm:px-4 sm:first:pl-0"
                value={
                  summaryLoading ? <Skeleton className="h-6 w-24" /> : <span className="tabular-nums">{incomeValue}</span>
                }
              />
              <Metric
                label="Expenses"
                className="py-3.5 sm:px-4 sm:first:pl-0"
                value={
                  summaryLoading ? <Skeleton className="h-6 w-24" /> : <span className="tabular-nums">{expensesValue}</span>
                }
              />
              <Metric
                label="Transactions"
                className="py-3.5 sm:px-4 sm:first:pl-0"
                value={
                  summaryLoading ? <Skeleton className="h-6 w-12" /> : <span className="tabular-nums">{countValue}</span>
                }
              />
            </StatStrip>

            {hasMultipleCurrencies && summary && (
              <p className="text-caption border-t border-[var(--color-border)] pt-3">
                <span className="text-[var(--color-text-secondary)]">Multiple currencies this month: </span>
                {Object.entries(summary.currencies).map(([cur, totals], idx) => (
                  <span key={cur}>
                    {idx > 0 && ', '}
                    <span className="tabular-nums text-[var(--color-text-secondary)]">{cur}</span>{' '}
                    income {formatMoney(totals.income, cur)}, expenses {formatMoney(totals.expenses, cur)}
                  </span>
                ))}
              </p>
            )}
          </section>
        </div>

        {/* ── AI analyst: structured container with sky border & sparkle badge ── */}
        <section aria-label="AI Transaction Analyst">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-sky)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            <h2 className="m-0">
              <button
                type="button"
                onClick={() => setAiOpen((v) => !v)}
                aria-expanded={aiOpen}
                aria-controls="ai-analyst-panel"
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)]"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="text-section-title block">Ask about these transactions</span>
                    <span className="text-secondary mt-0.5 block">
                      Answers come from verified records in {monthLabel}.
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
                    aiOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </h2>

            {aiOpen && (
              <div id="ai-analyst-panel" className="border-t border-[var(--color-border)] space-y-4 p-4 sm:p-5">
                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <Button
                      key={q}
                      variant="secondary"
                      size="sm"
                      className="min-h-[36px]"
                      onClick={() => handleAskAI(q)}
                      disabled={aiLoading}
                    >
                      {q}
                    </Button>
                  ))}
                </div>

                {/* Question input */}
                <div className="space-y-2">
                  <Field id="ai-question" label="Your question">
                    <Textarea
                      id="ai-question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. What did I spend the most on?"
                      rows={2}
                      maxLength={500}
                      disabled={aiLoading}
                    />
                  </Field>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-caption">
                      Press Enter to send, Shift + Enter for a new line.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => handleAskAI()}
                      disabled={!question.trim()}
                      loading={aiLoading}
                      className="min-h-[40px]"
                      leadingIcon={<SendHorizonal className="h-4 w-4" aria-hidden="true" />}
                    >
                      Ask
                    </Button>
                  </div>
                </div>

                {/* Error state */}
                {aiError && (
                  <Alert tone="danger" title="The question couldn't be answered">
                    {aiError}
                  </Alert>
                )}

                {/* Loading state */}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-secondary">
                    <Spinner label="Analyzing transactions" />
                    <span>Reading the {monthLabel} transactions…</span>
                  </div>
                )}

                {/* Answer */}
                {aiResult && !aiLoading && (
                  <div className="space-y-3">
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-4">
                      <div className="flex items-start gap-2.5">
                        <MessageSquare
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-text)]"
                          aria-hidden="true"
                        />
                        <p className="text-body">{formatAiText(aiResult.answer)}</p>
                      </div>

                      {aiResult.insights.length > 0 && (
                        <ul className="mt-3 list-disc space-y-1.5 border-t border-[var(--color-border)] pl-5 pt-3 marker:text-[var(--color-text-subtle)]">
                          {aiResult.insights.map((ins, i) => (
                            <li key={i} className="text-secondary">
                              {formatAiText(ins)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {aiResult.suggestedQuestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-label">Follow-up questions</p>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.suggestedQuestions.map((q) => (
                            <Button
                              key={q}
                              variant="secondary"
                              size="sm"
                              className="min-h-[36px]"
                              onClick={() => handleAskAI(q)}
                              disabled={aiLoading}
                            >
                              {formatAiText(q)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-[36px]"
                        onClick={handleClearConversation}
                        leadingIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
                      >
                        Start new conversation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── List: filters toolbar + one table surface with its footer ── */}
        <Section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <Field id="filter-search" label="Search" className="w-full sm:w-56">
                <Input
                  id="filter-search"
                  type="search"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Description"
                />
              </Field>

              <Field id="filter-type" label="Type" className="w-full sm:w-40">
                <Select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as '' | 'income' | 'expense');
                    setFilterCategory('');
                    setOffset(0);
                  }}
                >
                  <option value="">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </Select>
              </Field>

              <Field id="filter-category" label="Category" className="w-full sm:w-52">
                <Select
                  id="filter-category"
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setOffset(0);
                  }}
                >
                  <option value="">All categories</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="min-h-[40px] self-start"
              >
                Clear filters
              </Button>
            )}
          </div>

          <ResponsiveDataTable<Transaction>
            data={displayedTransactions}
            columns={columns}
            keyExtractor={(tx) => tx.id}
            loading={listLoading}
            actions={rowActions}
            mobileConfig={mobileConfig}
            breakpoint="md"
            ariaLabel={`Transactions for ${monthLabel}`}
            emptyTitle={hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
            emptyDescription={
              hasActiveFilters
                ? 'No transactions match these filters. Try another type or category, or clear the filters.'
                : `Nothing has been recorded for ${monthLabel}. Add your first transaction to get started.`
            }
            emptyIcon={<ReceiptText aria-hidden="true" />}
            emptyAction={
              <ButtonLink
                href="/transactions/new"
                variant="primary"
                className="min-h-[40px]"
                leadingIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
              >
                New transaction
              </ButtonLink>
            }
            footer={paginationFooter}
          />
        </Section>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete transaction"
        message={
          deleteTarget
            ? `This permanently deletes the ${deleteTarget.type} transaction of ${formatMoney(deleteTarget.amount, deleteTarget.currency)}. This can't be undone.`
            : ''
        }
        confirmLabel="Delete transaction"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}

function TransactionsFallback() {
  return (
    <AppShell>
      <div className="space-y-6" aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-full max-w-md" />
        <div className="grid grid-cols-1 border-y border-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 px-4 py-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsFallback />}>
      <TransactionsPageContent />
    </Suspense>
  );
}
