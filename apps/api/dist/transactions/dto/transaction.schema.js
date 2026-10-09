import { z } from 'zod';
import { amountSchema, calendarDateSchema, SUPPORTED_CURRENCIES, } from '@ledgerly/shared-types';
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