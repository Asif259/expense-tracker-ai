import { LoansService } from './loans.service.js';
import type { CreateLoanDto, UpdateLoanDto, RecordRepaymentDto, LoanQueryDto, LoanParamDto, RepaymentParamDto } from '@ledgerly/shared-types';
import type { User } from '@supabase/supabase-js';
export declare class LoansController {
    private readonly loansService;
    constructor(loansService: LoansService);
    create(token: string, user: User, dto: CreateLoanDto): Promise<any>;
    findAll(token: string, user: User, query: LoanQueryDto): Promise<{
        data: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getSummary(token: string, user: User): Promise<{
        currencies: Record<string, import("./loans.service.js").CurrencyLoanSummary>;
    }>;
    findOne(token: string, user: User, params: LoanParamDto): Promise<any>;
    update(token: string, user: User, params: LoanParamDto, dto: UpdateLoanDto): Promise<any>;
    remove(token: string, user: User, params: LoanParamDto): Promise<{
        success: boolean;
    }>;
    recordRepayment(token: string, params: LoanParamDto, dto: RecordRepaymentDto): Promise<any>;
    removeRepayment(token: string, user: User, params: RepaymentParamDto): Promise<{
        success: boolean;
    }>;
}
