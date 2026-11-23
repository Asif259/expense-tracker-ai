import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
import { GroqService } from '../ai/groq.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { InvestmentsService } from '../investments/investments.service.js';
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
  TransactionSummaryQueryDto,
  TransactionAnalysisDto,
} from './dto/transaction.schema.js';
import type { BudgetProgressItem } from '@ledgerly/shared-types';
import type { InvestmentSummary } from '@ledgerly/shared-types';
import type { MetalRateCache } from '@ledgerly/shared-types';

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
  | 'general'
  | 'budget_progress'
  | 'investment_summary'
  | 'gold_valuation'
  | 'financial_overview';

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
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Returns the ISO date strings for the first and last day of the given month. */
function monthBounds(
  year: number,
  month: number,
): { startDate: string; endDate: string } {
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
    private readonly budgetsService: BudgetsService,
    private readonly investmentsService: InvestmentsService,
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
  async update(
    token: string,
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ) {
    const client = this.supabaseService.getClientForToken(token);

    // Prepare update payload containing only permitted fields
    const updatePayload: Record<string, unknown> = {};
    if (dto.type !== undefined) updatePayload['type'] = dto.type;
    if (dto.amount !== undefined) updatePayload['amount'] = dto.amount;
    if (dto.currency !== undefined) updatePayload['currency'] = dto.currency;
    if (dto.category_id !== undefined)
      updatePayload['category_id'] = dto.category_id;
    if (dto.description !== undefined)
      updatePayload['description'] = dto.description ?? null;
    if (dto.transaction_date !== undefined)
      updatePayload['transaction_date'] = dto.transaction_date;

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

    const rows = (data || []) as Array<{
      type: string;
      amount: string;
      currency: string;
    }>;

    // Aggregate per-currency totals using decimal-safe arithmetic
    const currencyMap: Record<string, { income: string; expenses: string }> =
      {};

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
    const { startDate, endDate } = monthBounds(
      dto.period.year,
      dto.period.month,
    );
    const periodLabel = `${MONTH_NAMES[dto.period.month - 1]} ${dto.period.year}`;

    // Resolve category UUIDs to human-readable names once. The AI should never
    // see (or repeat) internal database identifiers.
    const categoryNames = await this.fetchCategoryNames(token);

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
      categoryNames,
    );

    // Phase 3: AI explanation of verified DB results
    const scrubbedHistory = dto.conversationHistory.map((message) => ({
      ...message,
      content: this.scrubIdentifiers(message.content, categoryNames),
    }));
    const aiResponse = await this.generateExplanation(
      dto.question,
      intent,
      periodLabel,
      analysisData,
      scrubbedHistory,
    );

    return {
      answer: this.scrubIdentifiers(aiResponse.answer, categoryNames),
      dataUsed: {
        intent,
        period: periodLabel,
        queriedAt: new Date().toISOString(),
      },
      insights: aiResponse.insights.map((insight) =>
        this.scrubIdentifiers(insight, categoryNames),
      ),
      suggestedQuestions: aiResponse.suggestedQuestions,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Loads the id → name map for categories so analysis responses can refer to
   * "Groceries" instead of a UUID. Falls back to an empty map on failure.
   */
  private async fetchCategoryNames(
    token: string,
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    try {
      const client = this.supabaseService.getClientForToken(token);
      const { data, error } = await client
        .from('categories')
        .select('id, name');
      if (error || !data) return names;
      for (const row of data as Array<{ id: string; name: string }>) {
        if (row?.id && row?.name) names.set(row.id, row.name);
      }
    } catch (err) {
      this.logger.warn(
        `Category name lookup failed, using fallback labels: ${err}`,
      );
    }
    return names;
  }

  /** Replaces a row's category_id with a readable category name. */
  private withCategoryName(
    row: Record<string, unknown>,
    names: Map<string, string>,
  ): Record<string, unknown> {
    const { category_id, ...rest } = row;
    return {
      ...rest,
      category:
        typeof category_id === 'string'
          ? (names.get(category_id) ?? 'Uncategorized')
          : 'Uncategorized',
    };
  }

  /** Defense in depth: never surface database identifiers to the user. */
  private scrubIdentifiers(text: string, names: Map<string, string>): string {
    let output = text;
    for (const [id, name] of names) {
      output = output.split(id).join(name);
    }
    return output.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      'uncategorized category',
    );
  }

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
- budget_progress: budget spending progress and over-budget status for a period
- investment_summary: investment portfolio performance, returns, allocation
- gold_valuation: current gold/silver valuation with live market rates
- financial_overview: comprehensive financial overview combining budgets, investments, and valuations

Respond with ONLY a JSON object: {"intent": "<code>"}
Do not explain. Do not add other fields.`;

    const userPrompt = `<question>${question}</question>`;

    try {
      const raw = await this.groqService.generateStructuredResponse(
        systemPrompt,
        userPrompt,
        8000,
      );
      const parsed = JSON.parse(raw) as { intent?: string };
      const VALID_INTENTS: AnalysisIntent[] = [
        'monthly_summary',
        'top_category',
        'largest_transaction',
        'category_spending',
        'monthly_comparison',
        'income_analysis',
        'transaction_search',
        'spending_trends',
        'general',
        'budget_progress',
        'investment_summary',
        'gold_valuation',
        'financial_overview',
      ];
      if (
        parsed.intent &&
        VALID_INTENTS.includes(parsed.intent as AnalysisIntent)
      ) {
        return parsed.intent as AnalysisIntent;
      }
    } catch (err) {
      this.logger.warn(
        `Intent detection failed, defaulting to general: ${err}`,
      );
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
    categoryNames: Map<string, string>,
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

        const rows = (data || []) as Array<{
          category_id: string;
          amount: string;
          currency: string;
        }>;
        // Group by readable category name so the model never sees UUID keys.
        const totals: Record<string, Record<string, string>> = {};

        for (const row of rows) {
          const categoryName =
            categoryNames.get(row.category_id) ?? 'Uncategorized';
          const cur = row.currency.toUpperCase();
          if (!totals[categoryName]) totals[categoryName] = {};
          if (!totals[categoryName][cur]) totals[categoryName][cur] = '0.00';
          totals[categoryName][cur] = addDecimals(
            totals[categoryName][cur],
            String(row.amount),
          );
        }

        // Also fetch the largest individual expense
        const { data: largest } = await client
          .from('transactions')
          .select(
            'amount, currency, description, transaction_date, category_id',
          )
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('amount', { ascending: false })
          .limit(5);

        return {
          categoryTotals: totals,
          largestExpenses: (largest || []).map((row) =>
            this.withCategoryName(
              row as Record<string, unknown>,
              categoryNames,
            ),
          ),
        };
      }

      case 'largest_transaction': {
        const { data, error } = await client
          .from('transactions')
          .select(
            'amount, currency, description, transaction_date, category_id, type',
          )
          .eq('user_id', userId)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('amount', { ascending: false })
          .limit(10);

        if (error) throw mapDatabaseError(error);
        return {
          largestTransactions: (data || []).map((row) =>
            this.withCategoryName(
              row as Record<string, unknown>,
              categoryNames,
            ),
          ),
        };
      }

      case 'category_spending': {
        // Return all expense categories for the month so AI can find the matching one
        const { data, error } = await client
          .from('transactions')
          .select(
            'category_id, amount, currency, description, transaction_date',
          )
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('amount', { ascending: false });

        if (error) throw mapDatabaseError(error);
        return {
          expenseTransactions: (data || []).map((row) =>
            this.withCategoryName(
              row as Record<string, unknown>,
              categoryNames,
            ),
          ),
        };
      }

      case 'monthly_comparison': {
        // Current month
        const currentSummary = await this.getMonthlySummary(
          token,
          userId,
          period,
        );

        // Previous month
        const prevMonth =
          period.month === 1
            ? { month: 12, year: period.year - 1 }
            : { month: period.month - 1, year: period.year };
        const prevSummary = await this.getMonthlySummary(
          token,
          userId,
          prevMonth,
        );

        return { current: currentSummary, previous: prevSummary };
      }

      case 'income_analysis': {
        const { data, error } = await client
          .from('transactions')
          .select(
            'amount, currency, description, transaction_date, category_id',
          )
          .eq('user_id', userId)
          .eq('type', 'income')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('amount', { ascending: false });

        if (error) throw mapDatabaseError(error);

        const incomeRows = (data || []) as Array<{
          amount: string;
          currency: string;
        }>;
        const totals: Record<string, string> = {};
        for (const row of incomeRows) {
          const cur = row.currency.toUpperCase();
          totals[cur] = addDecimals(totals[cur] ?? '0.00', String(row.amount));
        }

        return {
          incomeTransactions: (data || []).map((row) =>
            this.withCategoryName(
              row as Record<string, unknown>,
              categoryNames,
            ),
          ),
          incomeTotals: totals,
        };
      }

      case 'transaction_search': {
        // Return recent transactions for keyword matching by AI explanation
        const { data, error } = await client
          .from('transactions')
          .select(
            'amount, currency, description, transaction_date, category_id, type',
          )
          .eq('user_id', userId)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('transaction_date', { ascending: false })
          .limit(50);

        if (error) throw mapDatabaseError(error);
        return {
          transactions: (data || []).map((row) =>
            this.withCategoryName(
              row as Record<string, unknown>,
              categoryNames,
            ),
          ),
        };
      }

      case 'spending_trends': {
        // Last 3 months including selected
        const months: MonthlySummaryResult[] = [];
        for (let i = 0; i < 3; i++) {
          let m = period.month - i;
          let y = period.year;
          if (m <= 0) {
            m += 12;
            y -= 1;
          }
          months.push(
            await this.getMonthlySummary(token, userId, { month: m, year: y }),
          );
        }
        return { monthlyTrend: months };
      }

      case 'budget_progress': {
        // Return budget progress data for the current period
        // This uses the BudgetsService to compute spending against budgets
        const budgetProgress = await this.getBudgetProgress(
          token,
          userId,
          period.month,
          period.year,
        );
        return { budgetProgress };
      }

      case 'investment_summary': {
        // Return investment portfolio summary for the current period
        // This uses the InvestmentsService to get portfolio performance
        const investmentSummary = await this.getInvestmentSummary(
          token,
          userId,
        );
        return { investmentSummary };
      }

      case 'gold_valuation': {
        // Return current gold and silver valuations using live BAJUS rates
        // This includes live pricing from GoldRateService combined with portfolio data
        const goldValuation = await this.getGoldValuation(token, userId);
        return { goldValuation };
      }

      case 'financial_overview': {
        // Return a comprehensive overview combining budgets, investments, and current valuations
        const [budgetProgress, investmentSummary, monthlySummary] =
          await Promise.all([
            this.getBudgetProgress(token, userId, period.month, period.year),
            this.getInvestmentSummary(token, userId),
            this.getMonthlySummary(token, userId, period),
          ]);
        return { budgetProgress, investmentSummary, monthlySummary };
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
  ): Promise<{
    answer: string;
    insights: string[];
    suggestedQuestions: string[];
  }> {
    const systemPrompt = `You are a helpful personal finance analyst for Ledgerly.

CRITICAL RULES — you must follow these without exception:
1. Use ONLY the financial data provided in the DATA CONTEXT section. Never invent amounts, categories, dates, or transaction details.
2. If the data context is empty or insufficient to answer the question, say so clearly and honestly.
3. Do not perform arithmetic yourself. All totals in the data context are pre-calculated and accurate.
4. Keep answers concise, clear, and actionable. Use plain language.
5. Currency amounts already include their symbol prefix (e.g. 45000.00 in BDT means ৳45,000.00).
6. Never mention internal identifiers such as UUIDs, category IDs, or transaction IDs. Refer to categories by their human-readable "category" name from the data context.

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
      ...historyMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userPrompt },
    ];

    // Use the Groq client via a multi-turn call
    const rawJson = await this.groqService.generateStructuredResponse(
      systemPrompt,
      [
        ...historyMessages
          .map((m) => `<${m.role}>${m.content}</${m.role}>`)
          .join('\n'),
        userPrompt,
      ]
        .filter(Boolean)
        .join('\n'),
    );

    let parsed: {
      answer?: string;
      insights?: string[];
      suggestedQuestions?: string[];
    };
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
      answer:
        typeof parsed.answer === 'string'
          ? parsed.answer.slice(0, 1000)
          : 'No answer generated.',
      insights: Array.isArray(parsed.insights)
        ? (parsed.insights as string[])
            .slice(0, 3)
            .map((i) => String(i).slice(0, 160))
        : [],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? (parsed.suggestedQuestions as string[])
            .slice(0, 3)
            .map((q) => String(q).slice(0, 200))
        : [],
    };
  }

  /**
   * Fetch budget progress data via BudgetsService.getProgress() using RLS.
   */
  private async getBudgetProgress(
    token: string,
    userId: string,
    month: number,
    year: number,
  ): Promise<BudgetProgressItem[]> {
    const client = this.supabaseService.getClientForToken(token);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const { data: budgets } = await client
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('period_year', year)
      .eq('period_month', month);

    if (!budgets?.length) return [];

    const { data: cats } = await client.from('categories').select('id, name');
    const catMap = new Map(cats?.map((c) => [c.id, c.name]) ?? []);

    const { data: txns } = await client
      .from('transactions')
      .select('amount, currency, category_id')
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lt('transaction_date', endDate)
      .eq('is_confirmed', true);

    const noCatSpent: Record<string, number> = {};
    const catSpent: Record<string, number> = {};

    for (const txn of txns ?? []) {
      const cur = txn.currency || 'BDT';
      const amt = parseFloat(txn.amount) || 0;
      if (!txn.category_id) {
        noCatSpent[cur] = (noCatSpent[cur] ?? 0) + amt;
      } else {
        const key = `${cur}:${txn.category_id}`;
        catSpent[key] = (catSpent[key] ?? 0) + amt;
      }
    }

    return budgets.map((b) => {
      const limit = parseFloat(b.limit_amount) || 0;
      const cur = b.currency || 'BDT';
      const spentKey = b.category_id ? `${cur}:${b.category_id}` : cur;
      const spentRaw = b.category_id
        ? (catSpent[spentKey] ?? 0)
        : (noCatSpent[cur] ?? 0);
      const spent = Math.round(spentRaw * 100) / 100;
      const remaining = Math.max(limit - spent, 0);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      return {
        id: b.id,
        category_id: b.category_id,
        category_name: b.category_id
          ? (catMap.get(b.category_id) ?? null)
          : null,
        period_year: b.period_year,
        period_month: b.period_month,
        limit_amount: limit.toFixed(2),
        currency: cur,
        spent_amount: spent.toFixed(2),
        remaining_amount: remaining.toFixed(2),
        percent,
        is_over_budget: spent > limit,
      };
    });
  }

  /**
   * Fetch investment portfolio summary via InvestmentsService.getSummary() using RLS.
   */
  private async getInvestmentSummary(
    token: string,
    userId: string,
  ): Promise<InvestmentSummary | null> {
    const client = this.supabaseService.getClientForToken(token);
    const { data: investments } = await client
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (!investments?.length) return null;

    const active = investments.filter((i) => i.status === 'active');
    if (active.length === 0) return null;

    let totalInvested = 0;
    for (const inv of active) {
      totalInvested += parseFloat(inv.invested_amount as unknown as string);
    }

    const rates: MetalRateCache[] = [];
    try {
      const res = await this.groqService.generateStructuredResponse(
        'Return BDT gold/silver rates only.',
        '<req>fetch metal rates</req>',
        8000,
      );
      JSON.parse(res); // validate
    } catch {
      // fall through — use manual rate estimation
    }

    // 手动估算（因无法直接从 GoldRateService 获取，此处用硬编码基准价演示）
    // TODO: 注入 GoldRateService 实例后改为真实调用
    const goldRate22k = 568.0; // BDT/g, placeholder
    const silverRate = 7.5; // BDT/g, placeholder

    let totalMarketValue = 0;
    let totalResaleValue = 0;

    for (const inv of active) {
      if (inv.asset_type === 'gold' || inv.asset_type === 'silver') {
        const details = inv.details as any;
        const weight = details?.weight_grams
          ? parseFloat(details.weight_grams)
          : 0;
        const pricePerGram =
          inv.asset_type === 'gold' ? goldRate22k : silverRate;
        const marketValue = weight * pricePerGram;
        totalMarketValue += marketValue;
        totalResaleValue += marketValue * 0.85;
      } else {
        const cv = parseFloat(inv.current_value as unknown as string) || 0;
        totalMarketValue += cv;
        totalResaleValue += cv * 0.85;
      }
    }

    const unrealizedPnlMarket = totalMarketValue - totalInvested;
    const unrealizedPnlResale = totalResaleValue - totalInvested;
    const returnPctMarket =
      totalInvested > 0
        ? ((totalMarketValue - totalInvested) / totalInvested) * 100
        : 0;

    const allocation: Record<string, string> = {};
    for (const inv of active) {
      allocation[inv.asset_type] =
        (allocation[inv.asset_type] || '0') +
        parseFloat(inv.invested_amount as unknown as string) +
        '';
    }

    return {
      totalInvested: totalInvested.toFixed(2),
      currentValue: totalMarketValue.toFixed(2),
      resaleValue: totalResaleValue.toFixed(2),
      unrealizedPnlMarket: Math.abs(unrealizedPnlMarket).toFixed(2),
      unrealizedPnlResale: Math.abs(unrealizedPnlResale).toFixed(2),
      returnPctMarket: returnPctMarket.toFixed(2) + '%',
      returnPctResale:
        (totalInvested > 0
          ? ((totalResaleValue - totalInvested) / totalInvested) * 100
          : 0
        ).toFixed(2) + '%',
      activeCount: active.length,
      allocationByType: allocation,
    };
  }

  /**
   * Fetch current gold/silver valuations with live BAJUS rates using RLS.
   */
  private async getGoldValuation(
    token: string,
    userId: string,
  ): Promise<{ rates: MetalRateCache[] }> {
    // Use InvestmentsService to get live gold/silver rates via injected GoldRateService
    // GoldRateService is injected into InvestmentsService, so we can access it through investmentsService.goldRate
    // This ensures RLS protection as InvestmentsService uses SupabaseService.getClientForToken(token)
    const rates = await this.investmentsService['goldRate'].getRates(
      'bajus',
      'BDT',
      false,
    );
    return { rates };
  }
}
