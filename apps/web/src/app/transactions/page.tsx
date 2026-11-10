'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  X,
  ReceiptText,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Hash,
  SendHorizonal,
  RotateCcw,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveDataTable,
  ResponsiveColumn,
  RowAction,
  MobileTableConfig,
} from '@/components/responsive-table';

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

// ── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  loading: boolean;
  children: React.ReactNode;
}

function SummaryCard({ label, subLabel, icon, loading, children }: SummaryCardProps) {
  return (
    <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] space-y-1">
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-32 rounded-md bg-[var(--color-border)] animate-pulse mt-1" />
      ) : (
        <div className="tabular-nums font-bold text-xl text-[var(--color-text)]">{children}</div>
      )}
      <p className="text-[11px] text-[var(--color-text-dim)]">{subLabel}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    setSummaryLoading(true);
    (async () => {
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
    setListLoading(true);
    (async () => {
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

  // ── Delete handler ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteTransaction(token, deleteTarget.id);
      toast('Transaction deleted successfully', 'success');
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
    const userMsg: ConversationMessage = { role: 'user', content: questionText };
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
        { role: 'assistant', content: result.answer },
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
            <div>
              <span className="font-semibold text-[var(--color-text)]">
                {cat ? cat.name : 'Uncategorized'}
              </span>
              {tx.description && (
                <p className="text-[11px] text-[var(--color-text-dim)] truncate max-w-[180px]">
                  {tx.description}
                </p>
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
            <span className="font-bold tabular-nums text-[var(--color-text)]">
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
        label: 'Status & Type',
        cell: (tx) => {
          const isIncome = tx.type === 'income';
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase inline-flex items-center gap-1 ${
                  isIncome
                    ? 'bg-[var(--color-pale-mint)] text-[var(--color-text)]'
                    : 'bg-[var(--color-pale-yellow)] text-[var(--color-text)]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isIncome ? 'bg-[var(--color-income)]' : 'bg-[var(--color-warning)]'
                  }`}
                />
                {tx.type}
              </span>
              {tx.is_ai_generated && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                  AI
                </span>
              )}
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
            <div className="space-x-2 text-right">
              <Link
                href={`/transactions/${tx.id}/edit`}
                aria-label={`Edit ${categoryName} transaction of ${formatMoney(tx.amount, tx.currency)}`}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline transition-colors px-1 py-1"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(tx)}
                aria-label={`Delete ${categoryName} transaction of ${formatMoney(tx.amount, tx.currency)}`}
                className="text-[var(--color-danger)] hover:underline cursor-pointer px-1 py-1"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [categoryMap],
  );

  const rowActions = useCallback(
    (_tx: Transaction): RowAction<Transaction>[] => [
      {
        id: 'edit',
        label: 'Edit Transaction',
        icon: <Pencil className="w-3.5 h-3.5" />,
        onClick: (t) => router.push(`/transactions/${t.id}/edit`),
      },
      {
        id: 'delete',
        label: 'Delete Transaction',
        icon: <Trash2 className="w-3.5 h-3.5" />,
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

  const hasActiveFilters = filterType || filterCategory || filterSearch;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-page-title">Transactions</h1>
            <p className="text-secondary mt-1">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ai-entry"
              className="px-3.5 py-2 rounded-xl bg-[var(--color-secondary)]/15 border border-[var(--color-secondary)]/30 hover:bg-[var(--color-secondary)]/25 text-[var(--color-secondary)] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Quick Entry</span>
            </Link>
            <Link
              href="/transactions/new"
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-[var(--color-primary)]/15 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </Link>
          </div>
        </div>

        {/* ── Month Navigator ── */}
        <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mr-2">
              Monthly activity
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={goToCurrentMonth}
                aria-label="Go to current month"
                className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer text-[var(--color-text-muted)]"
              >
                Today
              </button>
            )}
            <button
              type="button"
              onClick={goToPrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>
            <span className="text-sm font-semibold text-[var(--color-text)] min-w-[130px] text-center tabular-nums">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={isNextDisabled}
              aria-label="Next month"
              className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Total Income"
            subLabel={`${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            loading={summaryLoading}
          >
            {summaryFirstCurrency
              ? formatMoney(summaryFirstCurrency[1].income, summaryFirstCurrency[0])
              : '—'}
          </SummaryCard>

          <SummaryCard
            label="Total Expenses"
            subLabel={`${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            loading={summaryLoading}
          >
            {summaryFirstCurrency
              ? formatMoney(summaryFirstCurrency[1].expenses, summaryFirstCurrency[0])
              : '—'}
          </SummaryCard>

          <SummaryCard
            label="Net Balance"
            subLabel="Income − Expenses"
            icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
            loading={summaryLoading}
          >
            {summaryFirstCurrency
              ? formatMoney(
                  summaryFirstCurrency[1].net.replace('-', ''),
                  summaryFirstCurrency[0],
                )
              : '—'}
          </SummaryCard>

          <SummaryCard
            label="Transactions"
            subLabel={`Recorded in ${MONTH_NAMES[selectedMonth - 1]}`}
            icon={<Hash className="w-3.5 h-3.5" />}
            loading={summaryLoading}
          >
            {summary ? summary.transactionCount.toLocaleString() : '—'}
          </SummaryCard>
        </div>

        {/* Multi-currency notice */}
        {hasMultipleCurrencies && summary && (
          <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-text)]">Multi-currency account · </span>
            {Object.entries(summary.currencies).map(([cur, totals], idx) => (
              <span key={cur}>
                {idx > 0 && ' · '}
                <span className="tabular-nums font-medium text-[var(--color-text)]">{cur}</span>
                {' '}Income: {formatMoney(totals.income, cur)} / Expenses: {formatMoney(totals.expenses, cur)}
              </span>
            ))}
          </div>
        )}

        {/* ── AI Analyst Panel ── */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          {/* Panel header — always visible */}
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            aria-expanded={aiOpen}
            aria-controls="ai-analyst-panel"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10">
                <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[var(--color-text)]">Ask about your transactions</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Get answers based on your actual financial records
                </p>
              </div>
            </div>
            {aiOpen ? (
              <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
            )}
          </button>

          {/* Collapsible panel body */}
          {aiOpen && (
            <div id="ai-analyst-panel" className="border-t border-[var(--color-border)] p-4 space-y-4">
              {/* Question chips */}
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleAskAI(q)}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer text-[var(--color-text-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input row */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label htmlFor="ai-question" className="sr-only">
                    Ask about your transactions
                  </label>
                  <textarea
                    id="ai-question"
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask something about your spending..."
                    rows={2}
                    maxLength={500}
                    disabled={aiLoading}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none resize-none disabled:opacity-60 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAskAI()}
                  disabled={!question.trim() || aiLoading}
                  aria-label="Ask AI"
                  className="px-4 py-2 h-[66px] rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-[var(--color-primary)]/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="w-4 h-4" />
                  )}
                  <span>Ask AI</span>
                </button>
              </div>

              {/* Error state */}
              {aiError && (
                <div className="p-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-sm text-[var(--color-text)]">
                  <span className="font-medium">Error: </span>
                  {aiError}
                </div>
              )}

              {/* Loading state */}
              {aiLoading && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Analyzing your {MONTH_NAMES[selectedMonth - 1]} transactions…</span>
                </div>
              )}

              {/* AI Response */}
              {aiResult && !aiLoading && (
                <div className="space-y-3">
                  {/* Answer */}
                  <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] space-y-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                      <p className="text-sm text-[var(--color-text)] leading-relaxed">{aiResult.answer}</p>
                    </div>

                    {/* Insights */}
                    {aiResult.insights.length > 0 && (
                      <ul className="space-y-1 pl-6">
                        {aiResult.insights.map((ins, i) => (
                          <li key={i} className="text-xs text-[var(--color-text-muted)] list-disc">
                            {ins}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Suggested follow-up chips */}
                  {aiResult.suggestedQuestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                        Follow-up questions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.suggestedQuestions.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => handleAskAI(q)}
                            disabled={aiLoading}
                            className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 transition-colors cursor-pointer text-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conversation actions */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleClearConversation}
                      className="text-[11px] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Start new conversation
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Transaction List ── */}
        <div className="space-y-4">
          {/* List header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">
                {MONTH_NAMES[selectedMonth - 1]} Transactions
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {total > 0 ? `${total} record${total !== 1 ? 's' : ''}` : 'No records found'}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Search */}
              <div>
                <label
                  htmlFor="filter-search"
                  className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1"
                >
                  Search
                </label>
                <input
                  id="filter-search"
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Search description…"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              {/* Type filter */}
              <div>
                <label
                  htmlFor="filter-type"
                  className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1"
                >
                  Type
                </label>
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as '' | 'income' | 'expense');
                    setFilterCategory('');
                    setOffset(0);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expense Only</option>
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label
                  htmlFor="filter-category"
                  className="block text-[11px] font-medium text-[var(--color-text-dim)] uppercase tracking-wider mb-1"
                >
                  Category
                </label>
                <select
                  id="filter-category"
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setOffset(0);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors cursor-pointer p-1 flex items-center gap-1"
                >
                  <span>Reset all filters</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <ResponsiveDataTable<Transaction>
            data={displayedTransactions}
            columns={columns}
            keyExtractor={(tx) => tx.id}
            loading={listLoading}
            actions={rowActions}
            mobileConfig={mobileConfig}
            breakpoint="md"
            ariaLabel="Transactions ledger"
            tableTitle={`${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} Transactions`}
            emptyTitle={`No transactions in ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            emptyDescription={
              hasActiveFilters
                ? 'No transactions matched your filters. Try clearing some filters.'
                : `You haven't recorded any transactions for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} yet.`
            }
            emptyIcon={<ReceiptText className="w-5 h-5 opacity-70" />}
            emptyAction={
              <Link
                href="/transactions/new"
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-contrast)] text-xs font-semibold transition-colors inline-block shadow-md shadow-[var(--color-primary)]/15 cursor-pointer"
              >
                Add a Transaction
              </Link>
            }
          />

          {/* Pagination */}
          <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)] shadow-[var(--shadow-card)]">
            <span>
              Showing {displayedTransactions.length > 0 ? offset + 1 : 0} to{' '}
              {Math.min(offset + displayedTransactions.length, total)} of {total} records
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={offset === 0 || listLoading}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-medium"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={offset + limit >= total || listLoading}
                onClick={() => setOffset(offset + limit)}
                className="px-3.5 py-2 min-h-[38px] rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete this ${deleteTarget.type} transaction of ${formatMoney(deleteTarget.amount, deleteTarget.currency)}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Confirm Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
