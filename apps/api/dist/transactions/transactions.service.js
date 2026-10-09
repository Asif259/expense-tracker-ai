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
let TransactionsService = class TransactionsService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
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
};
TransactionsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SupabaseService])
], TransactionsService);
export { TransactionsService };
//# sourceMappingURL=transactions.service.js.map