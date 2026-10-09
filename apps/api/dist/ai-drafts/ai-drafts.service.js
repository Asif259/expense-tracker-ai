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
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
let AiDraftsService = class AiDraftsService {
    supabaseService;
    supabaseAdminService;
    constructor(supabaseService, supabaseAdminService) {
        this.supabaseService = supabaseService;
        this.supabaseAdminService = supabaseAdminService;
    }
    async createDraft(userId, dto) {
        const { draftId } = await this.supabaseAdminService.createAiDraft({
            userId,
            type: dto.type,
            amount: dto.amount,
            currency: dto.currency,
            categoryId: dto.category_id,
            description: dto.description ?? null,
            transactionDate: dto.transaction_date,
        });
        return {
            id: draftId,
            message: 'Draft transaction created successfully',
        };
    }
    async listDrafts(token, userId) {
        const client = this.supabaseService.getClientForToken(token);
        const nowIso = new Date().toISOString();
        const { data, error } = await client
            .from('ai_draft_transactions')
            .select('id, user_id, payload, expires_at, created_at')
            .eq('user_id', userId)
            .gt('expires_at', nowIso)
            .order('created_at', { ascending: false });
        if (error) {
            throw mapDatabaseError(error);
        }
        return {
            data: data || [],
            total: data?.length || 0,
        };
    }
    async getDraft(token, userId, id) {
        const client = this.supabaseService.getClientForToken(token);
        const { data, error } = await client
            .from('ai_draft_transactions')
            .select('id, user_id, payload, expires_at, created_at')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error) {
            throw mapDatabaseError(error);
        }
        if (!data) {
            throw new NotFoundException(`Draft with ID ${id} not found`);
        }
        return data;
    }
    async deleteDraft(token, userId, id) {
        const client = this.supabaseService.getClientForToken(token);
        const { data, error } = await client
            .from('ai_draft_transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .select('id')
            .single();
        if (error) {
            throw mapDatabaseError(error);
        }
        if (!data) {
            throw new NotFoundException(`Draft with ID ${id} not found`);
        }
        return {
            message: 'Draft discarded successfully',
            id: data.id,
        };
    }
    async confirmDraft(token, draftId) {
        const client = this.supabaseService.getClientForToken(token);
        const { data, error } = await client.rpc('confirm_ai_draft', {
            p_draft_id: draftId,
        });
        if (error) {
            throw mapDatabaseError(error);
        }
        return {
            message: 'Draft confirmed and transaction created',
            transactionId: data,
        };
    }
};
AiDraftsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SupabaseService,
        SupabaseAdminService])
], AiDraftsService);
export { AiDraftsService };
//# sourceMappingURL=ai-drafts.service.js.map