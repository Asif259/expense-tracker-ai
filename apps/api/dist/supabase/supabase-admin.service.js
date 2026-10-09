var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SupabaseAdminService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
let SupabaseAdminService = SupabaseAdminService_1 = class SupabaseAdminService {
    configService;
    logger = new Logger(SupabaseAdminService_1.name);
    privilegedClient;
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.getOrThrow('SUPABASE_URL');
        const serviceRoleKey = this.configService.getOrThrow('SUPABASE_SERVICE_ROLE_KEY');
        this.privilegedClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }
    async createAiDraft(params) {
        const { data, error } = await this.privilegedClient.rpc('create_ai_draft', {
            p_user_id: params.userId,
            p_type: params.type,
            p_amount: params.amount,
            p_currency: params.currency,
            p_category_id: params.categoryId,
            p_description: params.description || null,
            p_transaction_date: params.transactionDate,
        });
        if (error) {
            this.logger.error(`create_ai_draft RPC failed: ${error.message} (${error.code})`);
            throw mapDatabaseError(error);
        }
        return { draftId: data };
    }
};
SupabaseAdminService = SupabaseAdminService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], SupabaseAdminService);
export { SupabaseAdminService };
//# sourceMappingURL=supabase-admin.service.js.map