import { z } from 'zod';
import { amountSchema } from './amount.schema.js';
import { currencySchema } from '../constants/currencies.js';
export const LOAN_DIRECTIONS = ['lent', 'borrowed'];
export const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'bank', 'other'];
export const LOAN_STATUSES = ['active', 'overdue', 'settled'];
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const validCalendarDateSchema = z
    .string()
    .regex(DATE_REGEX, 'Date must be in YYYY-MM-DD format')
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
            message: 'Must be a valid calendar date',
        });
    }
});
export const createLoanSchema = z
    .object({
    person_name: z
        .string()
        .trim()
        .min(1, 'Person name is required')
        .max(255, 'Person name cannot exceed 255 characters'),
    person_contact: z
        .string()
        .trim()
        .max(255, 'Contact details cannot exceed 255 characters')
        .nullable()
        .optional(),
    direction: z.enum(LOAN_DIRECTIONS, {
        errorMap: () => ({ message: 'Direction must be either lent or borrowed' }),
    }),
    principal_amount: amountSchema,
    currency: currencySchema.default('BDT'),
    payment_method: z.enum(PAYMENT_METHODS, {
        errorMap: () => ({ message: 'Payment method must be cash, bkash, nagad, bank, or other' }),
    }),
    loan_date: validCalendarDateSchema,
    due_date: validCalendarDateSchema.nullable().optional(),
    notes: z
        .string()
        .trim()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .nullable()
        .optional(),
})
    .superRefine((data, ctx) => {
    if (data.due_date && data.due_date < data.loan_date) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['due_date'],
            message: 'Expected repayment date cannot be earlier than loan date',
        });
    }
});
export const updateLoanSchema = z.object({
    person_name: z
        .string()
        .trim()
        .min(1, 'Person name is required')
        .max(255, 'Person name cannot exceed 255 characters')
        .optional(),
    person_contact: z
        .string()
        .trim()
        .max(255, 'Contact details cannot exceed 255 characters')
        .nullable()
        .optional(),
    due_date: validCalendarDateSchema.nullable().optional(),
    notes: z
        .string()
        .trim()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .nullable()
        .optional(),
});
export const recordRepaymentSchema = z.object({
    amount: amountSchema,
    payment_date: validCalendarDateSchema,
    payment_method: z.enum(PAYMENT_METHODS, {
        errorMap: () => ({ message: 'Payment method must be cash, bkash, nagad, bank, or other' }),
    }),
    reference: z
        .string()
        .trim()
        .max(255, 'Reference cannot exceed 255 characters')
        .nullable()
        .optional(),
    notes: z
        .string()
        .trim()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .nullable()
        .optional(),
});
export const loanQuerySchema = z.object({
    direction: z.enum(LOAN_DIRECTIONS).optional(),
    status: z.enum(LOAN_STATUSES).optional(),
    search: z.string().trim().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});
export const loanParamSchema = z.object({
    id: z.string().uuid('Invalid loan ID format'),
});
export const repaymentParamSchema = z.object({
    id: z.string().uuid('Invalid loan ID format'),
    repaymentId: z.string().uuid('Invalid repayment ID format'),
});
