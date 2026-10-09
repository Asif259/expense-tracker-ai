import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto } from './dto/transaction.schema.js';
export declare class TransactionsService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
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
}
