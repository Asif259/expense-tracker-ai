import { z } from 'zod';
import { amountSchema } from './amount.schema.js';
import { calendarDateSchema } from './date.schema.js';
import { currencySchema } from '../constants/currencies.js';

// Constants
export const INVESTMENT_ASSET_TYPES = ['gold', 'silver', 'fdr_dps', 'sanchaypatra', 'stocks', 'mutual_fund', 'real_estate', 'other'] as const;
export type InvestmentAssetType = (typeof INVESTMENT_ASSET_TYPES)[number];

export const METAL_KARATS = ['24k', '22k', '21k', '18k', 'traditional'] as const;
export type MetalKarats = (typeof METAL_KARATS)[number];

export const BD_GOLD_CONSTANTS = {
  GRAMS_PER_VORI: 11.664,
  ANA_PER_VORI: 16,
  RATI_PER_VORI: 96,
  POINT_PER_VORI: 960,
  DEFAULT_VAT_PERCENT: 5,
  DEFAULT_RESALE_DEDUCTION_PERCENT: 15,
} as const;

// Helper: Bangladesh weight units to grams
export function bdWeightToGrams(params: {
  vori?: number;
  ana?: number;
  rati?: number;
  point?: number;
}): number {
  const vori = params.vori || 0;
  const ana = params.ana || 0;
  const rati = params.rati || 0;
  const point = params.point || 0;
  return parseFloat((
    vori * BD_GOLD_CONSTANTS.GRAMS_PER_VORI +
    ana * BD_GOLD_CONSTANTS.GRAMS_PER_VORI / BD_GOLD_CONSTANTS.ANA_PER_VORI +
    rati * BD_GOLD_CONSTANTS.GRAMS_PER_VORI / (BD_GOLD_CONSTANTS.ANA_PER_VORI * BD_GOLD_CONSTANTS.RATI_PER_VORI) +
    point * BD_GOLD_CONSTANTS.GRAMS_PER_VORI / (BD_GOLD_CONSTANTS.ANA_PER_VORI * BD_GOLD_CONSTANTS.RATI_PER_VORI * BD_GOLD_CONSTANTS.POINT_PER_VORI)
  ).toFixed(4));
}

export function gramsToBdWeight(grams: number): { vori: number; ana: number; rati: number; point: number } {
  const vori = Math.round(grams / BD_GOLD_CONSTANTS.GRAMS_PER_VORI * 100) / 100;
  const remaining = grams - vori * BD_GOLD_CONSTANTS.GRAMS_PER_VORI;
  const ana = Math.round(remaining / (BD_GOLD_CONSTANTS.GRAMS_PER_VORI / BD_GOLD_CONSTANTS.ANA_PER_VORI) * 100) / 100;
  const rati = Math.round((remaining - ana * (BD_GOLD_CONSTANTS.GRAMS_PER_VORI / BD_GOLD_CONSTANTS.ANA_PER_VORI)) / (BD_GOLD_CONSTANTS.GRAMS_PER_VORI / (BD_GOLD_CONSTANTS.ANA_PER_VORI * BD_GOLD_CONSTANTS.RATI_PER_VORI)) * 100) / 100;
  const point = Math.round((remaining - ana * (BD_GOLD_CONSTANTS.GRAMS_PER_VORI / BD_GOLD_CONSTANTS.ANA_PER_VORI) - rati * (BD_GOLD_CONSTANTS.GRAMS_PER_VORI / (BD_GOLD_CONSTANTS.ANA_PER_VORI * BD_GOLD_CONSTANTS.RATI_PER_VORI))) / (BD_GOLD_CONSTANTS.GRAMS_PER_VORI / (BD_GOLD_CONSTANTS.ANA_PER_VORI * BD_GOLD_CONSTANTS.RATI_PER_VORI * BD_GOLD_CONSTANTS.POINT_PER_VORI)) * 100) / 100;
  return { vori, ana, rati, point };
}

// Metal valuation calculation
export function calculateMetalValuation(params: {
  weightGrams: number;
  ratePerGram: string; // 2-decimal string
  makingChargeAmount?: string | number; // BDT amount or % of base
  makingChargeType?: 'flat' | 'percent';
  vatPercent?: number;
  resaleDeductionPercent?: number;
}): {
  weightGrams: string;
  baseMarketValue: string;
  makingChargeAmount: string;
  vatAmount: string;
  totalBuyCost: string;
  resaleValue: string;
} {
  const rate = parseFloat(params.ratePerGram);
  const weight = parseFloat(params.weightGrams.toFixed(4));
  const baseMarketValue = weight * rate;
  let makingCharge = 0;
  if (params.makingChargeAmount) {
    if (params.makingChargeType === 'percent') {
      makingCharge = baseMarketValue * (parseFloat(params.makingChargeAmount as string) / 100);
    } else {
      makingCharge = parseFloat(params.makingChargeAmount as string);
    }
  }
  const vatPercent = params.vatPercent ?? BD_GOLD_CONSTANTS.DEFAULT_VAT_PERCENT;
  const vatAmount = (baseMarketValue + makingCharge) * (vatPercent / 100);
  const totalBuyCost = baseMarketValue + makingCharge + vatAmount;
  const resaleDeductionPercent = params.resaleDeductionPercent ?? BD_GOLD_CONSTANTS.DEFAULT_RESALE_DEDUCTION_PERCENT;
  const resaleValue = baseMarketValue * (1 - resaleDeductionPercent / 100);

  const toTwoDecimal = (num: number) => num.toFixed(2);
  return {
    weightGrams: toTwoDecimal(weight),
    baseMarketValue: toTwoDecimal(baseMarketValue),
    makingChargeAmount: toTwoDecimal(makingCharge),
    vatAmount: toTwoDecimal(vatAmount),
    totalBuyCost: toTwoDecimal(totalBuyCost),
    resaleValue: toTwoDecimal(resaleValue),
  };
}

// Zod schemas
export const metalDetailsSchema = z.object({
  karat: z.enum(METAL_KARATS),
  weight_grams: z.string().regex(/^\d{1,13}\.\d{2}$/).transform(Number),
  vori: z.number().min(0).max(9999),
  ana: z.number().min(0).max(999),
  rati: z.number().min(0).max(99),
  point: z.number().min(0).max(999),
  buy_rate_per_gram: amountSchema,
  custom_current_rate_per_gram: amountSchema.optional(),
  use_live_rate: z.boolean().default(true),
  making_charge_amount: amountSchema,
  making_charge_type: z.enum(['flat', 'percent']).default('flat'),
  vat_percent: z.number().min(0).max(100).default(BD_GOLD_CONSTANTS.DEFAULT_VAT_PERCENT),
  resale_deduction_percent: z.number().min(0).max(100).default(BD_GOLD_CONSTANTS.DEFAULT_RESALE_DEDUCTION_PERCENT),
});

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