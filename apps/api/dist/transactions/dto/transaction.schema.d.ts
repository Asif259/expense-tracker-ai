import { z } from 'zod';
export declare const createTransactionSchema: z.ZodObject<{
    type: z.ZodEnum<["income", "expense"]>;
    amount: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodNumber, z.ZodString]>, string | number, string | number>, string, string | number>;
    currency: z.ZodDefault<z.ZodEnum<["BDT", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "INR", "CNY", "AED", "CHF", "HKD", "MYR", "THB"]>>;
    category_id: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    transaction_date: z.ZodEffects<z.ZodString, string, string>;
}, "strict", z.ZodTypeAny, {
    type: "income" | "expense";
    amount: string;
    currency: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB";
    category_id: string;
    transaction_date: string;
    description?: string | null | undefined;
}, {
    type: "income" | "expense";
    amount: string | number;
    category_id: string;
    transaction_date: string;
    currency?: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB" | undefined;
    description?: string | null | undefined;
}>;
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export declare const updateTransactionSchema: z.ZodEffects<z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["income", "expense"]>>;
    amount: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodNumber, z.ZodString]>, string | number, string | number>, string, string | number>>;
    currency: z.ZodOptional<z.ZodEnum<["BDT", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "INR", "CNY", "AED", "CHF", "HKD", "MYR", "THB"]>>;
    category_id: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    transaction_date: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strict", z.ZodTypeAny, {
    type?: "income" | "expense" | undefined;
    amount?: string | undefined;
    currency?: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB" | undefined;
    category_id?: string | undefined;
    description?: string | null | undefined;
    transaction_date?: string | undefined;
}, {
    type?: "income" | "expense" | undefined;
    amount?: string | number | undefined;
    currency?: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB" | undefined;
    category_id?: string | undefined;
    description?: string | null | undefined;
    transaction_date?: string | undefined;
}>, {
    type?: "income" | "expense" | undefined;
    amount?: string | undefined;
    currency?: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB" | undefined;
    category_id?: string | undefined;
    description?: string | null | undefined;
    transaction_date?: string | undefined;
}, {
    type?: "income" | "expense" | undefined;
    amount?: string | number | undefined;
    currency?: "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "INR" | "CNY" | "AED" | "CHF" | "HKD" | "MYR" | "THB" | undefined;
    category_id?: string | undefined;
    description?: string | null | undefined;
    transaction_date?: string | undefined;
}>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export declare const transactionQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["income", "expense"]>>;
    category_id: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    type?: "income" | "expense" | undefined;
    category_id?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    type?: "income" | "expense" | undefined;
    category_id?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type TransactionQueryDto = z.infer<typeof transactionQuerySchema>;
export declare const transactionParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type TransactionParamDto = z.infer<typeof transactionParamSchema>;
