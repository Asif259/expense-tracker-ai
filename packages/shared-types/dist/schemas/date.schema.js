import { z } from 'zod';
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/**
 * Validates real calendar dates in strictly YYYY-MM-DD format.
 * Rejects invalid calendar days (e.g., 2026-02-30), special values,
 * and dates more than 1 day in the future (matching DB constraint).
 */
export const calendarDateSchema = z
    .string()
    .regex(DATE_REGEX, 'transaction_date must be in YYYY-MM-DD format')
    .superRefine((val, ctx) => {
    const parts = val.split('-').map(Number);
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    if (utcDate.getUTCFullYear() !== year ||
        utcDate.getUTCMonth() !== month - 1 ||
        utcDate.getUTCDate() !== day) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'transaction_date must be a valid calendar date',
        });
        return;
    }
    // Check maximum future date: not more than 1 day in the future (UTC)
    const now = new Date();
    const maxFutureDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    if (utcDate.getTime() > maxFutureDate.getTime()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'transaction_date cannot be more than one day in the future',
        });
        return;
    }
});
