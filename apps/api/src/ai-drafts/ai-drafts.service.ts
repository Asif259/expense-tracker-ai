import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
import type { CreateAiDraftDto } from './dto/ai-draft.schema.js';

@Injectable()
export class AiDraftsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly supabaseAdminService: SupabaseAdminService,
  ) {}

  /**
   * Creates an AI transaction draft using the service-role admin client wrapper.
   * Derives user identity strictly from authenticated context.
   */
  async createDraft(userId: string, dto: CreateAiDraftDto) {
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

  /**
   * Lists all active (unexpired) drafts for the authenticated user using their user-scoped client.
   */
  async listDrafts(token: string, userId: string) {
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

  /**
   * Retrieves a single active draft owned by the authenticated user.
   */
  async getDraft(token: string, userId: string, id: string) {
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

  /**
   * Discards a draft owned by the authenticated user.
   */
  async deleteDraft(token: string, userId: string, id: string) {
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

  /**
   * Confirms an AI draft by invoking the atomic confirm_ai_draft RPC function
   * using the caller's authenticated Supabase client.
   * PostgreSQL automatically populates auth.uid() and validates category ownership and amount.
   */
  async confirmDraft(token: string, draftId: string) {
    const client = this.supabaseService.getClientForToken(token);

    const { data, error } = await client.rpc('confirm_ai_draft', {
      p_draft_id: draftId,
    });

    if (error) {
      throw mapDatabaseError(error);
    }

    return {
      message: 'Draft confirmed and transaction created',
      transactionId: data as string,
    };
  }
}
