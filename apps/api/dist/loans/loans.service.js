var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
let LoansService = class LoansService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(token, userId, dto) {
        const client = this.supabaseService.getClientForToken(token);
        const { data, error } = await client
            .from('loans')
            .insert({
            user_id: userId,
            person_name: dto.person_name,
            person_contact: dto.person_contact ?? null,
            direction: dto.direction,
            principal_amount: dto.principal_amount,
            currency: dto.currency,
            payment_method: dto.payment_method,
            loan_date: dto.loan_date,
            due_date: dto.due_date ?? null,
            notes: dto.notes ?? null,
        })
            .select()
            .single();
        if (error) {
            throw mapDatabaseError(error);
        }
        return {
            ...data,
            total_repaid: 0,
            outstanding_balance: Number(data.principal_amount),
            progress_pct: 0,
            status: 'active',
        };
    }
    async findAll(token, userId, query) {
        const client = this.supabaseService.getClientForToken(token);
        let dbQuery = client
            .from('loans_with_details')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
        if (query.direction) {
            dbQuery = dbQuery.eq('direction', query.direction);
        }
        if (query.status) {
            dbQuery = dbQuery.eq('status', query.status);
        }
        if (query.search) {
            const s = query.search;
            dbQuery = dbQuery.or(`person_name.ilike.%${s}%,notes.ilike.%${s}%`);
        }
        dbQuery = dbQuery
            .order('created_at', { ascending: false })
            .range(query.offset, query.offset + query.limit - 1);
        const { data, error, count } = await dbQuery;
        if (error) {
            throw mapDatabaseError(error);
        }
        return {
            data: data ?? [],
            total: count ?? 0,
            limit: query.limit,
            offset: query.offset,
        };
    }
    async findOne(token, userId, id) {
        const client = this.supabaseService.getClientForToken(token);
        const { data: loan, error: loanErr } = await client
            .from('loans_with_details')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (loanErr || !loan) {
            throw mapDatabaseError(loanErr ?? new NotFoundException('Loan not found'));
        }
        const { data: repayments, error: repErr } = await client
            .from('loan_repayments')
            .select('*')
            .eq('loan_id', id)
            .eq('user_id', userId)
            .order('payment_date', { ascending: false })
            .order('created_at', { ascending: false });
        if (repErr) {
            throw mapDatabaseError(repErr);
        }
        return {
            ...loan,
            repayments: repayments ?? [],
        };
    }
    async update(token, userId, id, dto) {
        const client = this.supabaseService.getClientForToken(token);
        const updatePayload = {
            updated_at: new Date().toISOString(),
        };
        if (dto.person_name !== undefined)
            updatePayload.person_name = dto.person_name;
        if (dto.person_contact !== undefined)
            updatePayload.person_contact = dto.person_contact;
        if (dto.due_date !== undefined)
            updatePayload.due_date = dto.due_date;
        if (dto.notes !== undefined)
            updatePayload.notes = dto.notes;
        const { data, error } = await client
            .from('loans')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) {
            throw mapDatabaseError(error);
        }
        if (!data) {
            throw new NotFoundException('Loan not found');
        }
        return this.findOne(token, userId, id);
    }
    async remove(token, userId, id) {
        const client = this.supabaseService.getClientForToken(token);
        const { error } = await client
            .from('loans')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            throw mapDatabaseError(error);
        }
        return { success: true };
    }
    async recordRepayment(token, loanId, dto) {
        const client = this.supabaseService.getClientForToken(token);
        const { data, error } = await client.rpc('record_loan_repayment', {
            p_loan_id: loanId,
            p_amount: dto.amount,
            p_payment_date: dto.payment_date,
            p_payment_method: dto.payment_method,
            p_reference: dto.reference ?? null,
            p_notes: dto.notes ?? null,
        });
        if (error) {
            throw mapDatabaseError(error);
        }
        return data;
    }
    async removeRepayment(token, userId, loanId, repaymentId) {
        const client = this.supabaseService.getClientForToken(token);
        const { error } = await client
            .from('loan_repayments')
            .delete()
            .eq('id', repaymentId)
            .eq('loan_id', loanId)
            .eq('user_id', userId);
        if (error) {
            throw mapDatabaseError(error);
        }
        return { success: true };
    }
    async getSummary(token, userId) {
        const client = this.supabaseService.getClientForToken(token);
        const { data: loans, error } = await client
            .from('loans_with_details')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            throw mapDatabaseError(error);
        }
        const summaries = {};
        for (const loan of loans ?? []) {
            const cur = loan.currency || 'BDT';
            if (!summaries[cur]) {
                summaries[cur] = {
                    currency: cur,
                    total_lent: 0,
                    total_borrowed: 0,
                    outstanding_receivables: 0,
                    outstanding_payables: 0,
                    overdue_receivables: 0,
                    overdue_payables: 0,
                    total_repaid_lent: 0,
                    total_repaid_borrowed: 0,
                    active_loans_count: 0,
                    overdue_loans_count: 0,
                    settled_loans_count: 0,
                };
            }
            const s = summaries[cur];
            const principal = Number(loan.principal_amount) || 0;
            const repaid = Number(loan.total_repaid) || 0;
            const balance = Number(loan.outstanding_balance) || 0;
            if (loan.direction === 'lent') {
                s.total_lent += principal;
                s.outstanding_receivables += balance;
                s.total_repaid_lent += repaid;
                if (loan.status === 'overdue') {
                    s.overdue_receivables += balance;
                }
            }
            else {
                s.total_borrowed += principal;
                s.outstanding_payables += balance;
                s.total_repaid_borrowed += repaid;
                if (loan.status === 'overdue') {
                    s.overdue_payables += balance;
                }
            }
            if (loan.status === 'settled') {
                s.settled_loans_count += 1;
            }
            else if (loan.status === 'overdue') {
                s.overdue_loans_count += 1;
            }
            else {
                s.active_loans_count += 1;
            }
        }
        for (const k of Object.keys(summaries)) {
            const s = summaries[k];
            s.total_lent = Number(s.total_lent.toFixed(2));
            s.total_borrowed = Number(s.total_borrowed.toFixed(2));
            s.outstanding_receivables = Number(s.outstanding_receivables.toFixed(2));
            s.outstanding_payables = Number(s.outstanding_payables.toFixed(2));
            s.overdue_receivables = Number(s.overdue_receivables.toFixed(2));
            s.overdue_payables = Number(s.overdue_payables.toFixed(2));
            s.total_repaid_lent = Number(s.total_repaid_lent.toFixed(2));
            s.total_repaid_borrowed = Number(s.total_repaid_borrowed.toFixed(2));
        }
        return {
            currencies: summaries,
        };
    }
};
LoansService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SupabaseService])
], LoansService);
export { LoansService };
//# sourceMappingURL=loans.service.js.map