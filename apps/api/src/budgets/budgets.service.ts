import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
import type {
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetQueryDto,
  BudgetProgressItem,
} from '@ledgerly/shared-types';

@Injectable()
export class BudgetsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(token: string, userId: string, dto: CreateBudgetDto) {
    const client = this.supabaseService.getClientForToken(token);

    const { data, error } = await client
      .from('budgets')
      .insert({
        user_id: userId,
        category_id: dto.category_id ?? null,
        period_year: dto.period_year,
        period_month: dto.period_month,
        limit_amount: dto.limit_amount,
        currency: dto.currency,
      })
      .select()
      .single();

    if (error) throw mapDatabaseError(error);
    return data;
  }

  async findAll(token: string, userId: string, query: BudgetQueryDto = {}) {
    const client = this.supabaseService.getClientForToken(token);

    let dbQuery = client.from('budgets').select('*').eq('user_id', userId);

    if (query.month) dbQuery = dbQuery.eq('period_month', Number(query.month));
    if (query.year) dbQuery = dbQuery.eq('period_year', Number(query.year));
    if (query.category_id)
      dbQuery = dbQuery.eq('category_id', query.category_id);

    const { data, error } = await dbQuery
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (error) throw mapDatabaseError(error);
    return (data ?? []).map(this.normalizeRow);
  }

  async findOne(token: string, userId: string, id: string) {
    const client = this.supabaseService.getClientForToken(token);

    const { data, error } = await client
      .from('budgets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data)
      throw mapDatabaseError(
        error ?? new NotFoundException('Budget not found'),
      );
    return this.normalizeRow(data);
  }

  async update(
    token: string,
    userId: string,
    id: string,
    dto: UpdateBudgetDto,
  ) {
    const client = this.supabaseService.getClientForToken(token);

    const payload: Record<string, unknown> = {};
    if (dto.category_id !== undefined) payload.category_id = dto.category_id;
    if (dto.limit_amount !== undefined) payload.limit_amount = dto.limit_amount;
    if (dto.currency !== undefined) payload.currency = dto.currency;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('budgets')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw mapDatabaseError(error);
    if (!data) throw new NotFoundException('Budget not found');
    return this.normalizeRow(data);
  }

  async remove(token: string, userId: string, id: string) {
    const client = this.supabaseService.getClientForToken(token);
    const { error } = await client
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw mapDatabaseError(error);
    return { success: true };
  }

  /**
   * Aggregates spent amounts per budget for a given month/year, returning progress items
   * suitable for chart rendering. Spent is computed from confirmed transactions.
   */
  async getProgress(
    token: string,
    userId: string,
    year: number,
    month: number,
  ): Promise<BudgetProgressItem[]> {
    const client = this.supabaseService.getClientForToken(token);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const { data: budgets, error: bErr } = await client
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('period_year', year)
      .eq('period_month', month);

    if (bErr) throw mapDatabaseError(bErr);
    if (!budgets?.length) return [];

    // Fetch all categories to resolve names
    const { data: cats, error: cErr } = await client
      .from('categories')
      .select('id, name');
    if (cErr) throw mapDatabaseError(cErr);
    const catMap = new Map(cats?.map((c) => [c.id, c.name]) ?? []);

    // Aggregate spent by category+currency and unassigned+currency
    const noCatSpent: Record<string, number> = {};
    const catSpent: Record<string, number> = {};

    const { data: txns, error: tErr } = await client
      .from('transactions')
      .select('amount, currency, category_id')
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lt('transaction_date', endDate)
      .eq('is_confirmed', true);

    if (tErr) throw mapDatabaseError(tErr);

    for (const txn of txns ?? []) {
      const cur = txn.currency || 'BDT';
      const amt = parseFloat(txn.amount) || 0;
      const cid = txn.category_id;
      if (!cid) {
        noCatSpent[cur] = (noCatSpent[cur] ?? 0) + amt;
      } else {
        const key = `${cur}:${cid}`;
        catSpent[key] = (catSpent[key] ?? 0) + amt;
      }
    }

    return budgets.map((b) => {
      const limit = parseFloat(b.limit_amount) || 0;
      const cur = b.currency || 'BDT';
      const spentKey = b.category_id ? `${cur}:${b.category_id}` : cur;
      const spentRaw = b.category_id
        ? (catSpent[spentKey] ?? 0)
        : (noCatSpent[cur] ?? 0);
      const spent = Math.round(spentRaw * 100) / 100;
      const remaining = Math.max(limit - spent, 0);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      return {
        id: b.id,
        category_id: b.category_id,
        category_name: b.category_id
          ? (catMap.get(b.category_id) ?? null)
          : null,
        period_year: b.period_year,
        period_month: b.period_month,
        limit_amount: limit.toFixed(2),
        currency: cur,
        spent_amount: spent.toFixed(2),
        remaining_amount: remaining.toFixed(2),
        percent,
        is_over_budget: spent > limit,
      };
    });
  }

  private normalizeRow(row: Record<string, unknown>) {
    const amount = row.limit_amount as unknown;
    return {
      ...row,
      limit_amount:
        typeof amount === 'number'
          ? amount.toFixed(2)
          : typeof amount === 'string' && amount !== ''
            ? amount
            : '0.00',
    };
  }
}
