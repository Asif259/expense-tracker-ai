import { TransactionsService } from './transactions.service.js';
import type { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto, TransactionParamDto, TransactionSummaryQueryDto, TransactionAnalysisDto } from './dto/transaction.schema.js';
import type { User } from '@supabase/supabase-js';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(token: string, user: User, dto: CreateTransactionDto): Promise<any>;
    findAll(token: string, user: User, query: TransactionQueryDto): Promise<{
        data: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getMonthlySummary(token: string, user: User, query: TransactionSummaryQueryDto): Promise<import("./transactions.service.js").MonthlySummaryResult>;
    analyzeTransactions(token: string, user: User, dto: TransactionAnalysisDto): Promise<import("./transactions.service.js").AnalysisResult>;
    findOne(token: string, user: User, params: TransactionParamDto): Promise<any>;
    update(token: string, user: User, params: TransactionParamDto, dto: UpdateTransactionDto): Promise<any>;
    remove(token: string, user: User, params: TransactionParamDto): Promise<{
        message: string;
        id: any;
    }>;
}
