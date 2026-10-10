import { z } from 'zod';
export declare const MAX_AMOUNT = 9999999999999.99;
export declare const MAX_AMOUNT_STRING = "9999999999999.99";
export declare const amountSchema: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodNumber, z.ZodString]>, string | number, string | number>, string, string | number>;
