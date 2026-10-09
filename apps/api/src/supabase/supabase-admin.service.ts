import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';

export interface CreateAiDraftParams {
  userId: string;
  type: 'income' | 'expense';
  amount: string;
  currency: string;
  categoryId: string;
  description?: string | null;
  transactionDate: string;
}

@Injectable()
export class SupabaseAdminService {
  private readonly logger = new Logger(SupabaseAdminService.name);
  private readonly privilegedClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    // Private privileged client: strictly isolated within this service.
    // Never exposed directly to controllers, logs, or external consumers.
    this.privilegedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Invokes the database function public.create_ai_draft using the service_role key.
   * Derives user identity exclusively from the verified server-side caller.
   */
  async createAiDraft(params: CreateAiDraftParams): Promise<{ draftId: string }> {
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

    return { draftId: data as string };
  }
}
