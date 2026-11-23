import { z } from 'zod';
import { amountSchema } from './amount.schema.js';
import { calendarDateSchema } from './date.schema.js';
import { currencySchema } from '../constants/currencies.js';

// Constants
export const INVESTMENT_ASSET_TYPES = ['gold', 'silver', 'fdr_dps', 'sanchaypatra', 'stocks', 'mutual_fund', 'real_estate', 'other'] as const;
export type InvestmentAssetType = (typeof INVESTMENT_ASSET_TYPES)[number];

export const METAL_KARATS = ['24k', '22k', '21k', '18k', 'traditional'] as const;
export type MetalKarats = (typeof METAL_KARATS)[number];

// Zod schemas
export const createInvestmentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name too long'),
  asset_type: z.enum(INVESTMENT_ASSET_TYPES),
  invested_amount: amountSchema,
  currency: currencySchema.default('BDT'),
  purchase_date: calendarDateSchema,
  status: z.enum(['active', 'sold']).default('active'),
  sold_amount: amountSchema.optional(),
  sold_date: calendarDateSchema.optional(),
  linked_transaction_id: z.string().uuid().optional(),
  details: z.record(z.unknown()).default({}),
  notes: z.string().max(500).optional(),
});

export const updateInvestmentSchema = createInvestmentSchema.partial({
  name: true,
  asset_type: true,
  invested_amount: true,
  currency: true,
  purchase_date: true,
  status: true,
  details: true,
  notes: true,
});

export const sellInvestmentSchema = z.object({
  sold_amount: amountSchema,
  sold_date: calendarDateSchema,
  linked_transaction_id: z.string().uuid().optional(),
});

export const goldRateSchema = z.object({
  metal_type: z.enum(['gold', 'silver']),
  karat: z.enum(METAL_KARATS),
  market_price_per_gram: amountSchema,
  resale_price_per_gram: amountSchema,
  currency: currencySchema.default('BDT'),
});

export const investmentSummarySchema = z.object({
  totalInvested: amountSchema,
  currentValue: amountSchema,
  resaleValue: amountSchema,
  unrealizedPnlMarket: amountSchema,
  unrealizedPnlResale: amountSchema,
  returnPctMarket: z.string().regex(/^-?\d+(\.\d{1,2})?%$/),
  returnPctResale: z.string().regex(/^-?\d+(\.\d{1,2})?%$/),
  activeCount: z.number().int(),
  allocationByType: z.record(z.string()).optional(),
});

// Exported types from Zod schemas
export type CreateInvestmentDto = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentDto = z.infer<typeof updateInvestmentSchema>;
export type SellInvestmentDto = z.infer<typeof sellInvestmentSchema>;
export type InvestmentSummary = z.infer<typeof investmentSummarySchema>;
export type Investment = z.infer<typeof createInvestmentSchema>;

export * from './amount.schema.js';
export * from './date.schema.js';
export * from './loan.schema.js';