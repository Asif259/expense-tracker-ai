import { SupabaseService } from '../supabase/supabase.service.js';
import { GroqService } from '../ai/groq.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { InvestmentsService } from '../investments/investments.service.js';
import type { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto, TransactionSummaryQueryDto, TransactionAnalysisDto } from './dto/transaction.schema.js';
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
export type AnalysisIntent = 'monthly_summary' | 'top_category' | 'largest_transaction' | 'category_spending' | 'monthly_comparison' | 'income_analysis' | 'transaction_search' | 'spending_trends' | 'general' | 'budget_progress' | 'investment_summary' | 'gold_valuation' | 'financial_overview';
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
export declare class TransactionsService {
    private readonly supabaseService;
    private readonly groqService;
    private readonly budgetsService;
    private readonly investmentsService;
    private readonly logger;
    constructor(supabaseService: SupabaseService, groqService: GroqService, budgetsService: BudgetsService, investmentsService: InvestmentsService);
    create(token: string, userId: string, dto: CreateTransactionDto): Promise<any>;
    findAll(token: string, userId: string, query: TransactionQueryDto): Promise<{
        data: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    findOne(token: string, userId: string, id: string): Promise<any>;
    update(token: string, userId: string, id: string, dto: UpdateTransactionDto): Promise<any>;
    remove(token: string, userId: string, id: string): Promise<{
        message: string;
        id: any;
    }>;
    getMonthlySummary(token: string, userId: string, query: TransactionSummaryQueryDto): Promise<MonthlySummaryResult>;
    analyzeTransactions(token: string, userId: string, dto: TransactionAnalysisDto): Promise<AnalysisResult>;
    private fetchCategoryNames;
    private withCategoryName;
    private scrubIdentifiers;
    private detectIntent;
    private fetchAnalysisData;
    private generateExplanation;
    private getBudgetProgress;
    private getInvestmentSummary;
    private getGoldValuation;
}
