var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TransactionsService_1;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
import { GroqService } from '../ai/groq.service.js';
function addDecimals(a, b) {
    const toInt = (s) => {
        const [intPart, decPart = ''] = s.split('.');
        const cents = decPart.padEnd(2, '0').slice(0, 2);
        return BigInt(intPart) * 100n + BigInt(cents);
    };
    const result = toInt(a) + toInt(b);
    const whole = result / 100n;
    const frac = result % 100n;
    return `${whole}.${String(frac).padStart(2, '0')}`;
}
function subtractDecimals(a, b) {
    const toInt = (s) => {
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
function monthBounds(year, month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    const fmt = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
}
let TransactionsService = TransactionsService_1 = class TransactionsService {
    supabaseService;
    groqService;
    logger = new Logger(TransactionsService_1.name);
    constructor(supabaseService, groqService) {
        this.supabaseService = supabaseService;
        this.groqService = groqService;
    }
    async create(token, userId, dto) {
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
    async findAll(token, userId, query) {
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
    async findOne(token, userId, id) {
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
    async update(token, userId, id, dto) {
        const client = this.supabaseService.getClientForToken(token);
        const updatePayload = {};
        if (dto.type !== undefined)
            updatePayload['type'] = dto.type;
        if (dto.amount !== undefined)
            updatePayload['amount'] = dto.amount;
        if (dto.currency !== undefined)
            updatePayload['currency'] = dto.currency;
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
    async remove(token, userId, id) {
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
    async getMonthlySummary(token, userId, query) {
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
        const rows = (data || []);
        const currencyMap = {};
        for (const row of rows) {
            const cur = row.currency.toUpperCase();
            if (!currencyMap[cur]) {
                currencyMap[cur] = { income: '0.00', expenses: '0.00' };
            }
            const amt = String(row.amount);
            if (row.type === 'income') {
                currencyMap[cur].income = addDecimals(currencyMap[cur].income, amt);
            }
            else {
                currencyMap[cur].expenses = addDecimals(currencyMap[cur].expenses, amt);
            }
        }
        const currencies = {};
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
    async analyzeTransactions(token, userId, dto) {
        const { startDate, endDate } = monthBounds(dto.period.year, dto.period.month);
        const periodLabel = `${MONTH_NAMES[dto.period.month - 1]} ${dto.period.year}`;
        const categoryNames = await this.fetchCategoryNames(token);
        const intent = await this.detectIntent(dto.question);
        const analysisData = await this.fetchAnalysisData(token, userId, intent, startDate, endDate, dto.period, categoryNames);
        const scrubbedHistory = dto.conversationHistory.map((message) => ({
            ...message,
            content: this.scrubIdentifiers(message.content, categoryNames),
        }));
        const aiResponse = await this.generateExplanation(dto.question, intent, periodLabel, analysisData, scrubbedHistory);
        return {
            answer: this.scrubIdentifiers(aiResponse.answer, categoryNames),
            dataUsed: {
                intent,
                period: periodLabel,
                queriedAt: new Date().toISOString(),
            },
            insights: aiResponse.insights.map((insight) => this.scrubIdentifiers(insight, categoryNames)),
            suggestedQuestions: aiResponse.suggestedQuestions,
        };
    }
    async fetchCategoryNames(token) {
        const names = new Map();
        try {
            const client = this.supabaseService.getClientForToken(token);
            const { data, error } = await client.from('categories').select('id, name');
            if (error || !data)
                return names;
            for (const row of data) {
                if (row?.id && row?.name)
                    names.set(row.id, row.name);
            }
        }
        catch (err) {
            this.logger.warn(`Category name lookup failed, using fallback labels: ${err}`);
        }
        return names;
    }
    withCategoryName(row, names) {
        const { category_id, ...rest } = row;
        return {
            ...rest,
            category: typeof category_id === 'string' ? (names.get(category_id) ?? 'Uncategorized') : 'Uncategorized',
        };
    }
    scrubIdentifiers(text, names) {
        let output = text;
        for (const [id, name] of names) {
            output = output.split(id).join(name);
        }
        return output.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'uncategorized category');
    }
    async detectIntent(question) {
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
            const parsed = JSON.parse(raw);
            const VALID_INTENTS = [
                'monthly_summary', 'top_category', 'largest_transaction',
                'category_spending', 'monthly_comparison', 'income_analysis',
                'transaction_search', 'spending_trends', 'general',
            ];
            if (parsed.intent && VALID_INTENTS.includes(parsed.intent)) {
                return parsed.intent;
            }
        }
        catch (err) {
            this.logger.warn(`Intent detection failed, defaulting to general: ${err}`);
        }
        return 'general';
    }
    async fetchAnalysisData(token, userId, intent, startDate, endDate, period, categoryNames) {
        const client = this.supabaseService.getClientForToken(token);
        switch (intent) {
            case 'monthly_summary': {
                const summary = await this.getMonthlySummary(token, userId, period);
                return { summary };
            }
            case 'top_category': {
                const { data, error } = await client
                    .from('transactions')
                    .select('category_id, amount, currency')
                    .eq('user_id', userId)
                    .eq('type', 'expense')
                    .gte('transaction_date', startDate)
                    .lte('transaction_date', endDate);
                if (error)
                    throw mapDatabaseError(error);
                const rows = (data || []);
                const totals = {};
                for (const row of rows) {
                    const categoryName = categoryNames.get(row.category_id) ?? 'Uncategorized';
                    const cur = row.currency.toUpperCase();
                    if (!totals[categoryName])
                        totals[categoryName] = {};
                    if (!totals[categoryName][cur])
                        totals[categoryName][cur] = '0.00';
                    totals[categoryName][cur] = addDecimals(totals[categoryName][cur], String(row.amount));
                }
                const { data: largest } = await client
                    .from('transactions')
                    .select('amount, currency, description, transaction_date, category_id')
                    .eq('user_id', userId)
                    .eq('type', 'expense')
                    .gte('transaction_date', startDate)
                    .lte('transaction_date', endDate)
                    .order('amount', { ascending: false })
                    .limit(5);
                return {
                    categoryTotals: totals,
                    largestExpenses: (largest || []).map((row) => this.withCategoryName(row, categoryNames)),
                };
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
                if (error)
                    throw mapDatabaseError(error);
                return {
                    largestTransactions: (data || []).map((row) => this.withCategoryName(row, categoryNames)),
                };
            }
            case 'category_spending': {
                const { data, error } = await client
                    .from('transactions')
                    .select('category_id, amount, currency, description, transaction_date')
                    .eq('user_id', userId)
                    .eq('type', 'expense')
                    .gte('transaction_date', startDate)
                    .lte('transaction_date', endDate)
                    .order('amount', { ascending: false });
                if (error)
                    throw mapDatabaseError(error);
                return {
                    expenseTransactions: (data || []).map((row) => this.withCategoryName(row, categoryNames)),
                };
            }
            case 'monthly_comparison': {
                const currentSummary = await this.getMonthlySummary(token, userId, period);
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
                if (error)
                    throw mapDatabaseError(error);
                const incomeRows = (data || []);
                const totals = {};
                for (const row of incomeRows) {
                    const cur = row.currency.toUpperCase();
                    totals[cur] = addDecimals(totals[cur] ?? '0.00', String(row.amount));
                }
                return {
                    incomeTransactions: (data || []).map((row) => this.withCategoryName(row, categoryNames)),
                    incomeTotals: totals,
                };
            }
            case 'transaction_search': {
                const { data, error } = await client
                    .from('transactions')
                    .select('amount, currency, description, transaction_date, category_id, type')
                    .eq('user_id', userId)
                    .gte('transaction_date', startDate)
                    .lte('transaction_date', endDate)
                    .order('transaction_date', { ascending: false })
                    .limit(50);
                if (error)
                    throw mapDatabaseError(error);
                return {
                    transactions: (data || []).map((row) => this.withCategoryName(row, categoryNames)),
                };
            }
            case 'spending_trends': {
                const months = [];
                for (let i = 0; i < 3; i++) {
                    let m = period.month - i;
                    let y = period.year;
                    if (m <= 0) {
                        m += 12;
                        y -= 1;
                    }
                    months.push(await this.getMonthlySummary(token, userId, { month: m, year: y }));
                }
                return { monthlyTrend: months };
            }
            default: {
                const summary = await this.getMonthlySummary(token, userId, period);
                return { summary };
            }
        }
    }
    async generateExplanation(question, intent, periodLabel, data, conversationHistory) {
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
        const messages = [
            { role: 'system', content: systemPrompt },
            ...historyMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userPrompt },
        ];
        const rawJson = await this.groqService.generateStructuredResponse(systemPrompt, [
            ...historyMessages.map((m) => `<${m.role}>${m.content}</${m.role}>`).join('\n'),
            userPrompt,
        ].filter(Boolean).join('\n'));
        let parsed;
        try {
            parsed = JSON.parse(rawJson);
        }
        catch {
            return {
                answer: 'I was unable to generate an analysis. Please try again.',
                insights: [],
                suggestedQuestions: ['Try rephrasing your question.'],
            };
        }
        return {
            answer: typeof parsed.answer === 'string' ? parsed.answer.slice(0, 1000) : 'No answer generated.',
            insights: Array.isArray(parsed.insights)
                ? parsed.insights.slice(0, 3).map((i) => String(i).slice(0, 160))
                : [],
            suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
                ? parsed.suggestedQuestions.slice(0, 3).map((q) => String(q).slice(0, 200))
                : [],
        };
    }
};
TransactionsService = TransactionsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SupabaseService,
        GroqService])
], TransactionsService);
export { TransactionsService };
//# sourceMappingURL=transactions.service.js.map