import { z } from 'zod';
export declare const LOAN_DIRECTIONS: readonly ["lent", "borrowed"];
export type LoanDirection = (typeof LOAN_DIRECTIONS)[number];
export declare const PAYMENT_METHODS: readonly ["cash", "bkash", "nagad", "bank", "other"];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export declare const LOAN_STATUSES: readonly ["active", "overdue", "settled"];
export type LoanStatus = (typeof LOAN_STATUSES)[number];
export declare const validCalendarDateSchema: z.ZodType<string>;
export declare const createLoanSchema: z.ZodEffects<z.ZodObject<{
    person_name: z.ZodString;
    person_contact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    direction: z.ZodEnum<["lent", "borrowed"]>;
    principal_amount: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodNumber, z.ZodString]>, string | number, string | number>, string, string | number>;
    currency: z.ZodDefault<z.ZodEnum<["BDT", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "INR", "CNY", "AED", "CHF", "HKD", "MYR", "THB"]>>;
    payment_method: z.ZodEnum<["cash", "bkash", "nagad", "bank", "other"]>;
    loan_date: z.ZodType<string, z.ZodTypeDef, string>;
    due_date: z.ZodOptional<z.ZodNullable<z.ZodType<string, z.ZodTypeDef, string>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    person_name: string;
    direction: "lent" | "borrowed";
    principal_amount: string;
    currency: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB";
    payment_method: "cash" | "bkash" | "nagad" | "bank" | "other";
    loan_date: string;
    person_contact?: string | null | undefined;
    due_date?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    person_name: string;
    direction: "lent" | "borrowed";
    principal_amount: string | number;
    payment_method: "cash" | "bkash" | "nagad" | "bank" | "other";
    loan_date: string;
    person_contact?: string | null | undefined;
    currency?: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB" | undefined;
    due_date?: string | null | undefined;
    notes?: string | null | undefined;
}>, {
    person_name: string;
    direction: "lent" | "borrowed";
    principal_amount: string;
    currency: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB";
    payment_method: "cash" | "bkash" | "nagad" | "bank" | "other";
    loan_date: string;
    person_contact?: string | null | undefined;
    due_date?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    person_name: string;
    direction: "lent" | "borrowed";
    principal_amount: string | number;
    payment_method: "cash" | "bkash" | "nagad" | "bank" | "other";
    loan_date: string;
    person_contact?: string | null | undefined;
    currency?: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB" | undefined;
    due_date?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export type CreateLoanDto = z.infer<typeof createLoanSchema>;
export declare const updateLoanSchema: z.ZodObject<{
    person_name: z.ZodOptional<z.ZodString>;
    person_contact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    due_date: z.ZodOptional<z.ZodNullable<z.ZodType<string, z.ZodTypeDef, string>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    person_name?: string | undefined;
    person_contact?: string | null | undefined;
    due_date?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    person_name?: string | undefined;
    person_contact?: string | null | undefined;
    due_date?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export type UpdateLoanDto = z.infer<typeof updateLoanSchema>;
export declare const recordRepaymentSchema: z.ZodObject<{
    amount: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodNumber, z.ZodString]>, string | number, string | number>, string, string | number>;
    payment_date: z.ZodType<string, z.ZodTypeDef, string>;
    payment_method: z.ZodEnum<["cash", "bkash", "nagad", "bank", "other"]>;
    reference: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    payment_method: "cash" | "bkash" | "nagad" | "bank" | "other";
    amount: string;
    payment_date: string;
    notes?: string | null | undefined;
    reference?: string | null | undefined;
}, {
    payment_method: "cash" | "bkash" | "nagad" | "bank" | "other";
    amount: string | number;
    payment_date: string;
    notes?: string | null | undefined;
    reference?: string | null | undefined;
}>;
export type RecordRepaymentDto = z.infer<typeof recordRepaymentSchema>;
export declare const loanQuerySchema: z.ZodObject<{
    direction: z.ZodOptional<z.ZodEnum<["lent", "borrowed"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "overdue", "settled"]>>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: "active" | "overdue" | "settled" | undefined;
    direction?: "lent" | "borrowed" | undefined;
    search?: string | undefined;
}, {
    status?: "active" | "overdue" | "settled" | undefined;
    direction?: "lent" | "borrowed" | undefined;
    search?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type LoanQueryDto = z.infer<typeof loanQuerySchema>;
export declare const loanParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type LoanParamDto = z.infer<typeof loanParamSchema>;
export declare const repaymentParamSchema: z.ZodObject<{
    id: z.ZodString;
    repaymentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    repaymentId: string;
}, {
    id: string;
    repaymentId: string;
}>;
export type RepaymentParamDto = z.infer<typeof repaymentParamSchema>;
