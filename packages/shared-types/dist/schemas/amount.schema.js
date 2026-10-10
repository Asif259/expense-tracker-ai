import { z } from 'zod';
export const MAX_AMOUNT = 9_999_999_999_999.99;
export const MAX_AMOUNT_STRING = '9999999999999.99';
// Regex: strictly 1 to 13 integer digits, optional dot with 1 or 2 decimal digits
const AMOUNT_REGEX = /^\d{1,13}(\.\d{1,2})?$/;
export const amountSchema = z
    .union([
    z.number().finite('amount must be a finite number'),
    z.string(),
])
    .superRefine((val, ctx) => {
    let strVal;
    let numVal;
    if (typeof val === 'string') {
        // Reject surrounding whitespace rather than silently trimming it
        if (val !== val.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'amount must not contain surrounding whitespace',
            });
            return;
        }
        strVal = val;
        numVal = Number(val);
    }
    else {
        // JavaScript number: literals like 10.500 normalize to 10.5 in runtime
        numVal = val;
        strVal = val.toString();
    }
    // 1. Finiteness & numeric validity
    if (Number.isNaN(numVal) || !Number.isFinite(numVal)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'amount must be a valid finite number',
        });
        return;
    }
    // 2. Positivity check
    if (numVal <= 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'amount must be greater than zero',
        });
        return;
    }
    // 3. Maximum limit check
    if (numVal > MAX_AMOUNT) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `amount must not exceed ${MAX_AMOUNT_STRING}`,
        });
        return;
    }
    // 4. Exact scale and integer digit check:
    // - Rejects string "10.500" (has 3 decimal places)
    // - Rejects string "10.999" and numeric 10.999 (has 3 decimal places)
    // - Rejects > 13 integer digits
    // - Accepts string "10.99", numeric 10.99, and numeric 10.500 (evaluated by runtime as "10.5")
    if (!AMOUNT_REGEX.test(strVal)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'amount must have at most 13 integer digits and at most 2 decimal places',
        });
        return;
    }
})
    .transform((val) => {
    // Return canonical decimal string representation for Supabase forwarding
    return typeof val === 'number' ? val.toString() : val;
});
