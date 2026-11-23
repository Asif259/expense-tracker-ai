import { z } from 'zod';
import { amountSchema } from './amount.schema.js';
import { currencySchema } from '../constants/currencies.js';

export const createBudgetSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  period_year: z.number().int().min(2000).max(2100),
  period_month: z.number().int().min(1).max(12),
  limit_amount: amountSchema,
  currency: currencySchema.default('BDT'),
});

export const updateBudgetSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  limit_amount: amountSchema.optional(),
  currency: currencySchema.optional(),
});

export const budgetQuerySchema = z.object({
  month: z.string().regex(/^\d{1,2}$/).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  category_id: z.string().uuid().optional(),
}).optional().default({});

export const budgetProgressItemSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid().nullable(),
  category_name: z.string().nullable(),
  period_year: z.number().int(),
  period_month: z.number().int(),
  limit_amount: z.string().regex(/^\d{1,13}\.\d{2}$/),
  currency: z.string().length(3),
  spent_amount: z.string().regex(/^\d{1,13}\.\d{2}$/),
  remaining_amount: z.string().regex(/^\d{1,13}\.\d{2}$/),
  percent: z.number().int().min(0).max(200),
  is_over_budget: z.boolean(),
});

export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
export type BudgetQueryDto = z.infer<typeof budgetQuerySchema>;
export type BudgetProgressItem = z.infer<typeof budgetProgressItemSchema>;
