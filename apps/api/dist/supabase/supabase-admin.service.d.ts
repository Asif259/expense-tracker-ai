import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export interface CreateAiDraftParams {
    userId: string;
    type: 'income' | 'expense';
    amount: string;
    currency: string;
    categoryId: string;
    description?: string | null;
    transactionDate: string;
}
export declare class SupabaseAdminService {
    private readonly configService;
    private readonly logger;
    private readonly privilegedClient;
    constructor(configService: ConfigService);
    getPrivilegedClient(): SupabaseClient;
    createAiDraft(params: CreateAiDraftParams): Promise<{
        draftId: string;
    }>;
}
