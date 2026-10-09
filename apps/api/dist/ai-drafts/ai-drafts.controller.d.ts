import { AiDraftsService } from './ai-drafts.service.js';
import type { CreateAiDraftDto, AiDraftParamDto } from './dto/ai-draft.schema.js';
import type { User } from '@supabase/supabase-js';
export declare class AiDraftsController {
    private readonly aiDraftsService;
    constructor(aiDraftsService: AiDraftsService);
    create(user: User, dto: CreateAiDraftDto): Promise<{
        id: string;
        message: string;
    }>;
    list(token: string, user: User): Promise<{
        data: {
            id: any;
            user_id: any;
            payload: any;
            expires_at: any;
            created_at: any;
        }[];
        total: number;
    }>;
    get(token: string, user: User, params: AiDraftParamDto): Promise<{
        id: any;
        user_id: any;
        payload: any;
        expires_at: any;
        created_at: any;
    }>;
    delete(token: string, user: User, params: AiDraftParamDto): Promise<{
        message: string;
        id: any;
    }>;
    confirm(token: string, params: AiDraftParamDto): Promise<{
        message: string;
        transactionId: string;
    }>;
}
