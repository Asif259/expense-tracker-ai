import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '@ledgerly/shared-types';

export const parseExpenseSchema = z
  .object({
    text: z
      .string({ required_error: 'text is required' })
      .min(1, 'text cannot be empty')
      .max(1000, 'text must not exceed 1000 characters'),
    currency_preference: z
      .enum(SUPPORTED_CURRENCIES, {
        errorMap: () => ({ message: 'currency_preference is not a supported currency' }),
      })
      .optional(),
  })
  .strict('Unexpected fields in payload');

export type ParseExpenseDto = z.infer<typeof parseExpenseSchema>;
