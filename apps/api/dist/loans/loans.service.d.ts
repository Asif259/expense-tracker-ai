import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateLoanDto, UpdateLoanDto, RecordRepaymentDto, LoanQueryDto } from '@ledgerly/shared-types';
export interface CurrencyLoanSummary {
    currency: string;
    total_lent: number;
    total_borrowed: number;
    outstanding_receivables: number;
    outstanding_payables: number;
    overdue_receivables: number;
    overdue_payables: number;
    total_repaid_lent: number;
    total_repaid_borrowed: number;
    active_loans_count: number;
    overdue_loans_count: number;
    settled_loans_count: number;
}
export declare class LoansService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    create(token: string, userId: string, dto: CreateLoanDto): Promise<any>;
    findAll(token: string, userId: string, query: LoanQueryDto): Promise<{
        data: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    findOne(token: string, userId: string, id: string): Promise<any>;
    update(token: string, userId: string, id: string, dto: UpdateLoanDto): Promise<any>;
    remove(token: string, userId: string, id: string): Promise<{
        success: boolean;
    }>;
    recordRepayment(token: string, loanId: string, dto: RecordRepaymentDto): Promise<any>;
    removeRepayment(token: string, userId: string, loanId: string, repaymentId: string): Promise<{
        success: boolean;
    }>;
    getSummary(token: string, userId: string): Promise<{
        currencies: Record<string, CurrencyLoanSummary>;
    }>;
}
