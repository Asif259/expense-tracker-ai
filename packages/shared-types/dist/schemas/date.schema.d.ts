import { z } from 'zod';
/**
 * Validates real calendar dates in strictly YYYY-MM-DD format.
 * Rejects invalid calendar days (e.g., 2026-02-30), special values,
 * and dates more than 1 day in the future (matching DB constraint).
 */
export declare const calendarDateSchema: z.ZodEffects<z.ZodString, string, string>;
