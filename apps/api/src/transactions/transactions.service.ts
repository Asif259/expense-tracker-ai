import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
import { GroqService } from '../ai/groq.service.js';
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
  TransactionSummaryQueryDto,
  TransactionAnalysisDto,
} from './dto/transaction.schema.js';

/** Per-currency income/expense breakdown returned by the summary endpoint. */
export interface CurrencySummary {
  income: string;
  expenses: string;
  net: string;
}

export interface MonthlySummaryResult {
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  currencies: Record<string, CurrencySummary>;
  transactionCount: number;
}

/** Intent categories the AI analysis engine can detect. */
export type AnalysisIntent =
  | 'monthly_summary'
  | 'top_category'
  | 'largest_transaction'
  | 'category_spending'
  | 'monthly_comparison'
  | 'income_analysis'
  | 'transaction_search'
  | 'spending_trends'
  | 'general';

export interface AnalysisResult {
  answer: string;
  dataUsed: {
    intent: AnalysisIntent;
    period: string;
    queriedAt: string;
  };
  insights: string[];
  suggestedQuestions: string[];
}

/** Decimal-safe addition using string parsing (avoids floating-point). */
function addDecimals(a: string, b: string): string {
  // Work in integer cents (up to 2 decimal places)
  const toInt = (s: string) => {
    const [intPart, decPart = ''] = s.split('.');
    const cents = decPart.padEnd(2, '0').slice(0, 2);
    return BigInt(intPart) * 100n + BigInt(cents);
  };
  const result = toInt(a) + toInt(b);
  const whole = result / 100n;
  const frac = result % 100n;
  return `${whole}.${String(frac).padStart(2, '0')}`;
}

/** Decimal-safe subtraction (a - b). Returns negative as a plain string prefixed with '-'. */
function subtractDecimals(a: string, b: string): string {
  const toInt = (s: string) => {
    const [intPart, decPart = ''] = s.split('.');
    const cents = decPart.padEnd(2, '0').slice(0, 2);
    return BigInt(intPart) * 100n + BigInt(cents);
  };
  const diff = toInt(a) - toInt(b);
  const abs = diff < 0n ? -diff : diff;
  const whole = abs / 100n;
  const frac = abs % 100n;
  const formatted = `${whole}.${String(frac).padStart(2, '0')}`;
  return diff < 0n ? `-${formatted}` : formatted;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns the ISO date strings for the first and last day of the given month. */
function monthBounds(year: number, month: number): { startDate: string; endDate: string } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // day 0 = last day of previous month
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly groqService: GroqService,
  ) {}

  /**
   * Creates a manual transaction using the caller's authenticated Supabase client.
   * Derives user_id exclusively from verified authentication context.
   */
  async create(token: string, userId: string, dto: CreateTransactionDto) {
    const client = this.supabaseService.getClientForToken(token);

    const { data, error } = await client
      .from('transactions')
      .insert({
        user_id: userId,
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency,
        category_id: dto.category_id,
        description: dto.description ?? null,
        transaction_date: dto.transaction_date,
        is_ai_generated: false,
        is_confirmed: true,
      })
      .select()
      .single();

    if (error) {
      throw mapDatabaseError(error);
    }

    return data;
  }

  /**
   * Retrieves transactions for the authenticated user with validated pagination and filtering.
   */
  async findAll(token: string, userId: string, query: TransactionQueryDto) {
    const client = this.supabaseService.getClientForToken(token);

    let dbQuery = client
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (query.type) {
      dbQuery = dbQuery.eq('type', query.type);
    }
    if (query.category_id) {
      dbQuery = dbQuery.eq('category_id', query.category_id);
    }
    if (query.startDate) {
      dbQuery = dbQuery.gte('transaction_date', query.startDate);
    }
    if (query.endDate) {
      dbQuery = dbQuery.lte('transaction_date', query.endDate);
    }

    dbQuery = dbQuery
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    const { data, count, error } = await dbQuery;

    if (error) {
      throw mapDatabaseError(error);
    }

    return {
      data: data || [],
      total: count ?? (data?.length || 0),
      limit: query.limit,
      offset: query.offset,
    };
  }

  /**
   * Retrieves a single transaction owned by the authenticated user.
   */
  async findOne(token: string, userId: string, id: string) {
    const client = this.supabaseService.getClientForToken(token);

    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw mapDatabaseError(error);
    }

    if (!data) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return data;
  }

  /**
   * Updates permitted fields of a transaction owned by the authenticated user.
   */
  async update(token: string, userId: string, id: string, dto: UpdateTransactionDto) {
    const client = this.supabaseService.getClientForToken(token);

    // Prepare update payload containing only permitted fields
    const updatePayload: Record<string, unknown> = {};
    if (dto.type !== undefined) updatePayload['type'] = dto.type;
    if (dto.amount !== undefined) updatePayload['amount'] = dto.amount;
    if (dto.currency !== undefined) updatePayload['currency'] = dto.currency;
    if (dto.category_id !== undefined) updatePayload['category_id'] = dto.category_id;
    if (dto.description !== undefined) updatePayload['description'] = dto.description ?? null;
    if (dto.transaction_date !== undefined) updatePayload['transaction_date'] = dto.transaction_date;

    const { data, error } = await client
      .from('transactions')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw mapDatabaseError(error);
    }

    if (!data) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return data;
  }

  /**
   * Deletes a transaction owned by the authenticated user.
   */
  async remove(token: string, userId: string, id: string) {
    const client = this.supabaseService.getClientForToken(token);

    const { data, error } = await client
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error) {
      throw mapDatabaseError(error);
    }

    if (!data) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return {
      message: 'Transaction successfully deleted',
      id: data.id,
    };
  }

  // ── Monthly Summary ─────────────────────────────────────────────────────────

  /**
   * Returns income, expenses, net balance and transaction count for the requested month.
   * Uses BigInt arithmetic via addDecimals/subtractDecimals — never floating-point.
   * Groups by currency so multi-currency accounts are never silently combined.
   */
  async getMonthlySummary(
    token: string,
    userId: string,
    query: TransactionSummaryQueryDto,
  ): Promise<MonthlySummaryResult> {
    const { startDate, endDate } = monthBounds(query.year, query.month);
    const client = this.supabaseService.getClientForToken(token);

    const { data, count, error } = await client
      .from('transactions')
      .select('type, amount, currency', { count: 'exact' })
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) {
      throw mapDatabaseError(error);
    }

    const rows = (data || []) as Array<{ type: string; amount: string; currency: string }>;

    // Aggregate per-currency totals using decimal-safe arithmetic
    const currencyMap: Record<string, { income: string; expenses: string }> = {};

    for (const row of rows) {
      const cur = row.currency.toUpperCase();
      if (!currencyMap[cur]) {
        currencyMap[cur] = { income: '0.00', expenses: '0.00' };
      }
      const amt = String(row.amount);
      if (row.type === 'income') {
        currencyMap[cur].income = addDecimals(currencyMap[cur].income, amt);
      } else {
        currencyMap[cur].expenses = addDecimals(currencyMap[cur].expenses, amt);
      }
    }

    // Build result with net = income - expenses per currency
    const currencies: Record<string, CurrencySummary> = {};
    for (const [cur, totals] of Object.entries(currencyMap)) {
      currencies[cur] = {
        income: totals.income,
        expenses: totals.expenses,
        net: subtractDecimals(totals.income, totals.expenses),
      };
    }

    return {
      period: {
        month: query.month,
        year: query.year,
        startDate,
        endDate,
      },
      currencies,
      transactionCount: count ?? rows.length,
    };
  }

  // ── AI Transaction Analysis ─────────────────────────────────────────────────

  /**
   * Two-phase analysis:
   *   Phase 1 — Intent detection via Groq (lightweight: question text only).
   *   Phase 2 — Targeted DB aggregation based on detected intent.
   *   Phase 3 — Groq explanation of DB-sourced data (no fabrication possible).
   *
   * Security: user identity always from verified JWT, never from request body.
   * Prompt injection: AI never executes SQL or modifies DB queries.
   */
  async analyzeTransactions(
    token: string,
    userId: string,
    dto: TransactionAnalysisDto,
  ): Promise<AnalysisResult> {
    const { startDate, endDate } = monthBounds(dto.period.year, dto.period.month);
    const periodLabel = `${MONTH_NAMES[dto.period.month - 1]} ${dto.period.year}`;

    // Phase 1: Detect intent (question only, no financial data sent to AI yet)
    const intent = await this.detectIntent(dto.question);

    // Phase 2: Targeted DB query for the detected intent
    const analysisData = await this.fetchAnalysisData(
      token,
      userId,
      intent,
      startDate,
      endDate,
      dto.period,
    );

    // Phase 3: AI explanation of verified DB results
    const aiResponse = await this.generateExplanation(
      dto.question,
      intent,
      periodLabel,
      analysisData,
      dto.conversationHistory,
    );

    return {
      answer: aiResponse.answer,
      dataUsed: {
        intent,
        period: periodLabel,
        queriedAt: new Date().toISOString(),
      },
      insights: aiResponse.insights,
      suggestedQuestions: aiResponse.suggestedQuestions,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /** Phase 1: Detect the user's analytical intent from their question text. */
  private async detectIntent(question: string): Promise<AnalysisIntent> {
    const systemPrompt = `You are a financial question classifier for a personal finance app.
Classify the user's question into exactly one of these intent codes:
- monthly_summary: general summary, overview, how am I doing
- top_category: highest spending category, biggest expense category
- largest_transaction: biggest single transaction or expense
- category_spending: spending for a specific named category (food, transport, etc.)
- monthly_comparison: comparing this month vs last month or previous periods
- income_analysis: questions about income, salary, earnings
- transaction_search: find specific transactions by keyword or payment method
- spending_trends: trends over multiple months
- general: anything else

Respond with ONLY a JSON object: {"intent": "<code>"}
Do not explain. Do not add other fields.`;

    const userPrompt = `<question>${question}</question>`;

    try {
      const raw = await this.groqService.generateStructuredResponse(systemPrompt, userPrompt, 8000);
      const parsed = JSON.parse(raw) as { intent?: string };
      const VALID_INTENTS: AnalysisIntent[] = [
        'monthly_summary', 'top_category', 'largest_transaction',
        'category_spending', 'monthly_comparison', 'income_analysis',
        'transaction_search', 'spending_trends', 'general',
      ];
      if (parsed.intent && VALID_INTENTS.includes(parsed.intent as AnalysisIntent)) {
        return parsed.intent as AnalysisIntent;
      }
    } catch (err) {
      this.logger.warn(`Intent detection failed, defaulting to general: ${err}`);
    }

    return 'general';
  }

  /** Phase 2: Fetch only the data needed for the detected intent from the DB. */
  private async fetchAnalysisData(
    token: string,
    userId: string,
    intent: AnalysisIntent,
    startDate: string,
    endDate: string,
    period: { month: number; year: number },
  ): Promise<Record<string, unknown>> {
    const client = this.supabaseService.getClientForToken(token);

    switch (intent) {
      case 'monthly_summary': {
        const summary = await this.getMonthlySummary(token, userId, period);
        return { summary };
      }

      case 'top_category': {
        // Get expense totals by category for the month
        const { data, error } = await client
          .from('transactions')
          .select('category_id, amount, currency')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate);

        if (error) throw mapDatabaseError(error);

        const rows = (data || []) as Array<{ category_id: string; amount: string; currency: string }>;
        const totals: Record<string, Record<string, string>> = {};

        for (const row of rows) {
          const cur = row.currency.toUpperCase();
          if (!totals[row.category_id]) totals[row.category_id] = {};
          if (!totals[row.category_id][cur]) totals[row.category_id][cur] = '0.00';
          totals[row.category_id][cur] = addDecimals(totals[row.category_id][cur], String(row.amount));
        }

        // Also fetch the largest individual expense
        const { data: largest } = await client
          .from('transactions')
          .select('amount, currency, description, transaction_date, category_id')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('amount', { ascending: false })
          .limit(5);

        return { categoryTotals: totals, largestExpenses: largest || [] };
      }

      case 'largest_transaction': {
        const { data, error } = await client
          .from('transactions')
          .select('amount, currency, description, transaction_date, category_id, type')
          .eq('user_id', userId)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('amount', { ascending: false })
          .limit(10);

        if (error) throw mapDatabaseError(error);
        return { largestTransactions: data || [] };
      }

      case 'category_spending': {
        // Return all expense categories for the month so AI can find the matching one
        const { data, error } = await client
          .from('transactions')
          .select('category_id, amount, currency, description, transaction_date')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('amount', { ascending: false });

        if (error) throw mapDatabaseError(error);
        return { expenseTransactions: data || [] };
      }

      case 'monthly_comparison': {
        // Current month
        const currentSummary = await this.getMonthlySummary(token, userId, period);

        // Previous month
        const prevMonth = period.month === 1
          ? { month: 12, year: period.year - 1 }
          : { month: period.month - 1, year: period.year };
        const prevSummary = await this.getMonthlySummary(token, userId, prevMonth);

        return { current: currentSummary, previous: prevSummary };
      }

      case 'income_analysis': {
        const { data, error } = await client
          .from('transactions')
          .select('amount, currency, description, transaction_date, category_id')
          .eq('user_id', userId)
          .eq('type', 'income')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('amount', { ascending: false });

        if (error) throw mapDatabaseError(error);

        const incomeRows = (data || []) as Array<{ amount: string; currency: string }>;
        const totals: Record<string, string> = {};
        for (const row of incomeRows) {
          const cur = row.currency.toUpperCase();
          totals[cur] = addDecimals(totals[cur] ?? '0.00', String(row.amount));
        }

        return { incomeTransactions: data || [], incomeTotals: totals };
      }

      case 'transaction_search': {
        // Return recent transactions for keyword matching by AI explanation
        const { data, error } = await client
          .from('transactions')
          .select('amount, currency, description, transaction_date, category_id, type')
          .eq('user_id', userId)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('transaction_date', { ascending: false })
          .limit(50);

        if (error) throw mapDatabaseError(error);
        return { transactions: data || [] };
      }

      case 'spending_trends': {
        // Last 3 months including selected
        const months: MonthlySummaryResult[] = [];
        for (let i = 0; i < 3; i++) {
          let m = period.month - i;
          let y = period.year;
          if (m <= 0) { m += 12; y -= 1; }
          months.push(await this.getMonthlySummary(token, userId, { month: m, year: y }));
        }
        return { monthlyTrend: months };
      }

      default: {
        // General: return the monthly summary
        const summary = await this.getMonthlySummary(token, userId, period);
        return { summary };
      }
    }
  }

  /**
   * Phase 3: Pass verified DB data to Groq for natural-language explanation.
   * The system prompt explicitly forbids the AI from inventing any financial figures.
   */
  private async generateExplanation(
    question: string,
    intent: AnalysisIntent,
    periodLabel: string,
    data: Record<string, unknown>,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ answer: string; insights: string[]; suggestedQuestions: string[] }> {
    const systemPrompt = `You are a helpful personal finance analyst for Ledgerly.

CRITICAL RULES — you must follow these without exception:
1. Use ONLY the financial data provided in the DATA CONTEXT section. Never invent amounts, categories, dates, or transaction details.
2. If the data context is empty or insufficient to answer the question, say so clearly and honestly.
3. Do not perform arithmetic yourself. All totals in the data context are pre-calculated and accurate.
4. Keep answers concise, clear, and actionable. Use plain language.
5. Currency amounts already include their symbol prefix (e.g. 45000.00 in BDT means ৳45,000.00).

Respond with a JSON object containing:
- "answer": string — direct answer to the user's question (200 words max)
- "insights": string[] — 1 to 3 short observations from the data (each max 80 chars)
- "suggestedQuestions": string[] — 2 to 3 natural follow-up questions

DATA CONTEXT (pre-calculated from the database, trusted):
${JSON.stringify(data, null, 2)}

Analysis period: ${periodLabel}
Detected intent: ${intent}`;

    const historyMessages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const userPrompt = `<question>${question}</question>`;

    // Build messages array including conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...historyMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userPrompt },
    ];

    // Use the Groq client via a multi-turn call
    const rawJson = await this.groqService.generateStructuredResponse(
      systemPrompt,
      [
        ...historyMessages.map((m) => `<${m.role}>${m.content}</${m.role}>`).join('\n'),
        userPrompt,
      ].filter(Boolean).join('\n'),
    );

    let parsed: { answer?: string; insights?: string[]; suggestedQuestions?: string[] };
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return {
        answer: 'I was unable to generate an analysis. Please try again.',
        insights: [],
        suggestedQuestions: ['Try rephrasing your question.'],
      };
    }

    return {
      answer: typeof parsed.answer === 'string' ? parsed.answer.slice(0, 1000) : 'No answer generated.',
      insights: Array.isArray(parsed.insights)
        ? (parsed.insights as string[]).slice(0, 3).map((i) => String(i).slice(0, 160))
        : [],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? (parsed.suggestedQuestions as string[]).slice(0, 3).map((q) => String(q).slice(0, 200))
        : [],
    };
  }
}
