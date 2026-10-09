import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from './dto/transaction.schema.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Creates a manual transaction using the caller's authenticated Supabase client.
   * Derives user_id exclusively from verified authentication context.
   */
  async create(token: string, userId: string, dto: CreateTransactionDto) {
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

  /**
   * Retrieves transactions for the authenticated user with validated pagination and filtering.
   */
  async findAll(token: string, userId: string, query: TransactionQueryDto) {
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

  /**
   * Retrieves a single transaction owned by the authenticated user.
   */
  async findOne(token: string, userId: string, id: string) {
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

  /**
   * Updates permitted fields of a transaction owned by the authenticated user.
   */
  async update(token: string, userId: string, id: string, dto: UpdateTransactionDto) {
    const client = this.supabaseService.getClientForToken(token);

    // Prepare update payload containing only permitted fields
    const updatePayload: Record<string, unknown> = {};
    if (dto.type !== undefined) updatePayload['type'] = dto.type;
    if (dto.amount !== undefined) updatePayload['amount'] = dto.amount;
    if (dto.currency !== undefined) updatePayload['currency'] = dto.currency;
    if (dto.category_id !== undefined) updatePayload['category_id'] = dto.category_id;
    if (dto.description !== undefined) updatePayload['description'] = dto.description ?? null;
    if (dto.transaction_date !== undefined) updatePayload['transaction_date'] = dto.transaction_date;

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

  /**
   * Deletes a transaction owned by the authenticated user.
   */
  async remove(token: string, userId: string, id: string) {
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
}
