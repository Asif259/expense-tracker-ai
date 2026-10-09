import { z } from 'zod';
import { amountSchema, calendarDateSchema, SUPPORTED_CURRENCIES, } from '@ledgerly/shared-types';
export const createAiDraftSchema = z
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
    .strict('Unexpected fields in draft payload');
export const aiDraftParamSchema = z.object({
    id: z.string().uuid('id must be a valid UUID'),
});
//# sourceMappingURL=ai-draft.schema.js.map