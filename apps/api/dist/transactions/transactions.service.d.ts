import { SupabaseService } from '../supabase/supabase.service.js';
import { GroqService } from '../ai/groq.service.js';
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
export type AnalysisIntent = 'monthly_summary' | 'top_category' | 'largest_transaction' | 'category_spending' | 'monthly_comparison' | 'income_analysis' | 'transaction_search' | 'spending_trends' | 'general';
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
    private readonly logger;
    constructor(supabaseService: SupabaseService, groqService: GroqService);
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
}
