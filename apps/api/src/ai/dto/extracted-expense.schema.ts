import { z } from 'zod';
import {
  amountSchema,
  calendarDateSchema,
  SUPPORTED_CURRENCIES,
} from '@ledgerly/shared-types';

/**
 * Raw untrusted schema matching Groq model output JSON.
 */
export const rawAiExtractionSchema = z.object({
  type: z.enum(['income', 'expense']).nullable().optional(),
  amount: z.union([z.string(), z.number()]).nullable().optional(),
  currency: z.string().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  transaction_date: z.string().nullable().optional(),
  category_name: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  clarification_needed: z.boolean().default(false),
  clarification_reason: z.string().nullable().optional(),
});

export type RawAiExtraction = z.infer<typeof rawAiExtractionSchema>;

/**
 * Validated structured extraction ready for AI draft creation.
 */
export const validatedAiDraftInputSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: amountSchema,
  currency: z.enum(SUPPORTED_CURRENCIES),
  description: z.string().min(1, 'description cannot be empty').max(500),
  transaction_date: calendarDateSchema,
  category_id: z.string().uuid('category_id must be a valid UUID'),
});

export type ValidatedAiDraftInput = z.infer<typeof validatedAiDraftInputSchema>;
