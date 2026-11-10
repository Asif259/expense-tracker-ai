import { z } from 'zod';
import { amountSchema, calendarDateSchema, SUPPORTED_CURRENCIES, } from '@ledgerly/shared-types';
export const transactionSummaryQuerySchema = z.object({
    month: z.coerce
        .number()
        .int()
        .min(1, 'month must be between 1 and 12')
        .max(12, 'month must be between 1 and 12'),
    year: z.coerce
        .number()
        .int()
        .min(2000, 'year must be 2000 or later')
        .max(2100, 'year must be 2100 or earlier'),
});
const analysisPeriodSchema = z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
});
const conversationMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000, 'conversation message must not exceed 2000 characters'),
});
export const transactionAnalysisSchema = z
    .object({
    question: z
        .string()
        .min(3, 'question must be at least 3 characters')
        .max(500, 'question must not exceed 500 characters')
        .trim(),
    period: analysisPeriodSchema,
    conversationHistory: z
        .array(conversationMessageSchema)
        .max(6, 'conversation history is limited to 6 messages')
        .optional()
        .default([]),
})
    .strict('Unexpected fields in analysis request');
export const createTransactionSchema = z
    .object({
    type: z.enum(['income', 'expense'], {
        errorMap: () => ({ message: 'type must be income or expense' }),
    }),
    amount: amountSchema,
    currency: z
        .enum(SUPPORTED_CURRENCIES, {
        errorMap: () => ({ message: 'currency is not supported' }),
    })
        .default('BDT'),
    category_id: z.string().uuid('category_id must be a valid UUID'),
    description: z.string().max(500, 'description must be at most 500 characters').nullable().optional(),
    transaction_date: calendarDateSchema,
})
    .strict('Unexpected fields in payload');
export const updateTransactionSchema = z
    .object({
    type: z.enum(['income', 'expense']).optional(),
    amount: amountSchema.optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).optional(),
    category_id: z.string().uuid('category_id must be a valid UUID').optional(),
    description: z.string().max(500, 'description must be at most 500 characters').nullable().optional(),
    transaction_date: calendarDateSchema.optional(),
})
    .strict('Unexpected fields in update payload')
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});
export const transactionQuerySchema = z.object({
    type: z.enum(['income', 'expense']).optional(),
    category_id: z.string().uuid().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD').optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
export const transactionParamSchema = z.object({
    id: z.string().uuid('id must be a valid UUID'),
});
//# sourceMappingURL=transaction.schema.js.map