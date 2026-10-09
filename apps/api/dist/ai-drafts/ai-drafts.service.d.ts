import { SupabaseService } from '../supabase/supabase.service.js';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import type { CreateAiDraftDto } from './dto/ai-draft.schema.js';
export declare class AiDraftsService {
    private readonly supabaseService;
    private readonly supabaseAdminService;
    constructor(supabaseService: SupabaseService, supabaseAdminService: SupabaseAdminService);
    createDraft(userId: string, dto: CreateAiDraftDto): Promise<{
        id: string;
        message: string;
    }>;
    listDrafts(token: string, userId: string): Promise<{
        data: {
            id: any;
            user_id: any;
            payload: any;
            expires_at: any;
            created_at: any;
        }[];
        total: number;
    }>;
    getDraft(token: string, userId: string, id: string): Promise<{
        id: any;
        user_id: any;
        payload: any;
        expires_at: any;
        created_at: any;
    }>;
    deleteDraft(token: string, userId: string, id: string): Promise<{
        message: string;
        id: any;
    }>;
    confirmDraft(token: string, draftId: string): Promise<{
        message: string;
        transactionId: string;
    }>;
}
