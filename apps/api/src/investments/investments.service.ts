// File: apps/api/src/investments/investments.service.ts
// Purpose: Service handling investment CRUD with live valuation for gold/silver
// Callers: InvestmentsController, will be used by frontend API client
// Uses: SupabaseService (user-scoped), GoldRateService, shared-types schemas
// User instruction: "Implement a complete Investments section... multi-asset portfolio tracking"

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { GoldRateService } from './gold-rate.service.js';
import { mapDatabaseError } from '../common/errors/database-error.mapper.js';
import type {
  Investment,
  CreateInvestmentDto,
  UpdateInvestmentDto,
  SellInvestmentDto,
  InvestmentSummary,
} from '@ledgerly/shared-types';
import { amountSchema } from '@ledgerly/shared-types';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly goldRate: GoldRateService,
  ) {}

  async findAll(
    token: string,
    userId: string,
    search?: string,
    assetType?: string,
    status?: string,
    limit = 50,
    offset = 0,
  ): Promise<{ data: Investment[]; total: number }> {
    const client = this.supabase.getClientForToken(token);
    let query = client
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike('name', `%${search}%`);
    if (assetType) query = query.eq('asset_type', assetType);
    if (status) query = query.eq('status', status);

    const { data, count } = await query;
    // Normalize numeric strings to 2-decimal strings
    const normalized = (data || []).map((row) => ({
      ...row,
      invested_amount:
        typeof row.invested_amount === 'number'
          ? row.invested_amount.toFixed(2)
          : row.invested_amount,
      current_value:
        typeof row.current_value === 'number'
          ? row.current_value.toFixed(2)
          : row.current_value,
      sold_amount: row.sold_amount
        ? typeof row.sold_amount === 'number'
          ? row.sold_amount.toFixed(2)
          : row.sold_amount
        : null,
    }));

    return { data: normalized, total: count || 0 };
  }

  async findOne(
    token: string,
    userId: string,
    id: string,
  ): Promise<Investment> {
    const client = this.supabase.getClientForToken(token);
    const { data } = await client
      .from('investments')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (!data) throw new Error('Investment not found');
    return {
      ...data,
      invested_amount: (data.invested_amount as unknown as number).toFixed(2),
      current_value: (data.current_value as unknown as number).toFixed(2),
      sold_amount: data.sold_amount
        ? (data.sold_amount as unknown as number).toFixed(2)
        : null,
    };
  }

  async create(
    token: string,
    userId: string,
    dto: CreateInvestmentDto,
    transactionCategoryId?: string,
  ): Promise<Investment> {
    const client = this.supabase.getClientForToken(token);
    // For gold/silver, fetch live rates if use_live_rate
    let currentValue: string = dto.invested_amount;
    if (dto.asset_type === 'gold' || dto.asset_type === 'silver') {
      const rates = await this.goldRate.getRates();
      const rate = rates.find(
        (r) =>
          r.metal_type === dto.asset_type &&
          r.karat === (dto.details as any)?.karat,
      );
      if (rate && (dto.details as any)?.weight_grams) {
        const valuation = this.calculateLiveValuation(
          dto.details as any,
          rate.market_price_per_gram,
        );
        currentValue = valuation.currentValue;
      }
    }

    const payload = {
      ...dto,
      current_value: currentValue,
      user_id: userId,
    };

    const { data, error } = await client
      .from('investments')
      .insert(payload)
      .select()
      .single();
    if (error) {
      this.logger.error(
        `Failed to create investment [${error.code}]: ${error.message}` +
          (error.details ? ` | details: ${error.details}` : '') +
          (error.hint ? ` | hint: ${error.hint}` : ''),
      );
      throw mapDatabaseError(error);
    }
    if (!data) throw new InternalServerErrorException('Failed to create investment');

    // Optional: record as transaction
    if (transactionCategoryId) {
      await this.recordLinkedTransaction(token, userId, data.id, 'expense');
    }

    return {
      ...data,
      invested_amount: (data.invested_amount as unknown as number).toFixed(2),
      current_value: (data.current_value as unknown as number).toFixed(2),
    };
  }

  async update(
    token: string,
    userId: string,
    id: string,
    dto: UpdateInvestmentDto,
  ): Promise<Investment> {
    const client = this.supabase.getClientForToken(token);
    const { data } = await client
      .from('investments')
      .update(dto)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (!data) throw new Error('Investment not found');
    return {
      ...data,
      invested_amount: (data.invested_amount as unknown as number).toFixed(2),
      current_value: (data.current_value as unknown as number).toFixed(2),
    };
  }

  async sell(
    token: string,
    userId: string,
    id: string,
    dto: SellInvestmentDto,
    transactionCategoryId?: string,
  ): Promise<Investment> {
    const client = this.supabase.getClientForToken(token);
    const { data: investment } = await client
      .from('investments')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (!investment) throw new Error('Investment not found');

    const payload = {
      status: 'sold',
      sold_amount: dto.sold_amount,
      sold_date: dto.sold_date,
      linked_transaction_id: dto.linked_transaction_id,
    };

    const { data } = await client
      .from('investments')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (!data) throw new Error('Investment not updated');

    if (transactionCategoryId) {
      await this.recordLinkedTransaction(token, userId, data.id, 'income');
    }

    return {
      ...data,
      invested_amount: (data.invested_amount as unknown as number).toFixed(2),
      current_value: (data.current_value as unknown as number).toFixed(2),
      sold_amount: (data.sold_amount as unknown as number).toFixed(2),
    };
  }

  async delete(
    token: string,
    userId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const client = this.supabase.getClientForToken(token);
    const { data } = await client
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    return { success: !!data };
  }

  async getSummary(token: string, userId: string): Promise<InvestmentSummary> {
    const client = this.supabase.getClientForToken(token);
    const { data: investments } = await client
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (!investments) return this.emptySummary();

    const active = investments.filter((i) => i.status === 'active');
    const totalInvested = active.reduce(
      (sum, i) => sum + parseFloat(i.invested_amount as unknown as string),
      0,
    );
    const rates = await this.goldRate.getRates();

    let totalMarketValue = 0;
    let totalResaleValue = 0;

    active.forEach((inv) => {
      if (inv.asset_type === 'gold' || inv.asset_type === 'silver') {
        const rate = rates.find(
          (r) =>
            r.metal_type === inv.asset_type && r.karat === inv.details?.karat,
        );
        if (rate && inv.details?.weight_grams) {
          const marketValue =
            parseFloat(inv.details.weight_grams) *
            parseFloat(rate.market_price_per_gram);
          const resaleValue =
            parseFloat(inv.details.weight_grams) *
            parseFloat(rate.resale_price_per_gram);
          totalMarketValue += marketValue;
          totalResaleValue += resaleValue;
        } else {
          totalMarketValue += parseFloat(
            inv.current_value as unknown as string,
          );
          totalResaleValue +=
            parseFloat(inv.current_value as unknown as string) * 0.85;
        }
      } else {
        totalMarketValue += parseFloat(inv.current_value as unknown as string);
        totalResaleValue +=
          parseFloat(inv.current_value as unknown as string) * 0.85;
      }
    });

    const unrealizedPnlMarket = totalMarketValue - totalInvested;
    const unrealizedPnlResale = totalResaleValue - totalInvested;
    const returnPctMarket =
      totalInvested > 0
        ? ((totalMarketValue - totalInvested) / totalInvested) * 100
        : 0;
    const returnPctResale =
      totalInvested > 0
        ? ((totalResaleValue - totalInvested) / totalInvested) * 100
        : 0;

    const allocation: Record<string, string> = {};
    active.forEach((inv) => {
      allocation[inv.asset_type] =
        (allocation[inv.asset_type] || '0') +
        parseFloat(inv.invested_amount as unknown as string) +
        '';
    });

    return {
      totalInvested: totalInvested.toFixed(2),
      currentValue: totalMarketValue.toFixed(2),
      resaleValue: totalResaleValue.toFixed(2),
      unrealizedPnlMarket: Math.abs(unrealizedPnlMarket).toFixed(2),
      unrealizedPnlResale: Math.abs(unrealizedPnlResale).toFixed(2),
      returnPctMarket: returnPctMarket.toFixed(2) + '%',
      returnPctResale: returnPctResale.toFixed(2) + '%',
      activeCount: active.length,
      allocationByType: allocation,
    };
  }

  private calculateLiveValuation(
    details: Record<string, unknown>,
    ratePerGram: string,
  ): { currentValue: string } {
    const weight = parseFloat(details.weight_grams as string);
    const makingCharge = details.making_charge_amount
      ? parseFloat(details.making_charge_amount as string)
      : 0;
    const vat = details.vat_percent
      ? parseFloat(details.vat_percent as string)
      : 5;
    const marketValue = weight * parseFloat(ratePerGram);
    const vatAmount = (marketValue + makingCharge) * (vat / 100);
    const total = marketValue + makingCharge + vatAmount;
    return { currentValue: total.toFixed(2) };
  }

  private async recordLinkedTransaction(
    token: string,
    userId: string,
    investmentId: string,
    type: 'expense' | 'income',
  ): Promise<void> {
    const client = this.supabase.getClientForToken(token);
    const payload = {
      type,
      amount:
        type === 'expense'
          ? (
              await client
                .from('investments')
                .select('invested_amount')
                .eq('id', investmentId)
                .single()
            ).data?.invested_amount
          : type === 'income'
            ? (
                await client
                  .from('investments')
                  .select('sold_amount')
                  .eq('id', investmentId)
                  .single()
              ).data?.sold_amount
            : '0',
      currency: 'BDT',
      description: `Linked to investment ${investmentId}`,
      transaction_date: new Date().toISOString().split('T')[0],
    };
    await client.from('transactions').insert(payload);
  }

  private emptySummary(): InvestmentSummary {
    return {
      totalInvested: '0.00',
      currentValue: '0.00',
      resaleValue: '0.00',
      unrealizedPnlMarket: '0.00',
      unrealizedPnlResale: '0.00',
      returnPctMarket: '0.00%',
      returnPctResale: '0.00%',
      activeCount: 0,
      allocationByType: {},
    };
  }
}
