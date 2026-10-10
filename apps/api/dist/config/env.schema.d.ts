import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    SUPABASE_URL: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SUPABASE_ANON_KEY: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    GROQ_API_KEY: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    GROQ_MODEL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    PORT: string | number;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    CORS_ORIGIN: string;
    NODE_ENV: "development" | "production" | "test";
    GROQ_API_KEY: string;
    GROQ_MODEL: string;
}, {
    PORT?: string | number | undefined;
    SUPABASE_URL?: string | undefined;
    SUPABASE_ANON_KEY?: string | undefined;
    SUPABASE_SERVICE_ROLE_KEY?: string | undefined;
    CORS_ORIGIN?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    GROQ_API_KEY?: string | undefined;
    GROQ_MODEL?: string | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare function validateEnv(config: Record<string, unknown>): EnvConfig;
