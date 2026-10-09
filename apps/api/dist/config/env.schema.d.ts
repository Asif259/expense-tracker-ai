import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodNumber>;
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    GROQ_API_KEY: z.ZodString;
    GROQ_MODEL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    PORT: number;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    CORS_ORIGIN: string;
    NODE_ENV: "development" | "production" | "test";
    GROQ_API_KEY: string;
    GROQ_MODEL: string;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    GROQ_API_KEY: string;
    PORT?: number | undefined;
    CORS_ORIGIN?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    GROQ_MODEL?: string | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare function validateEnv(config: Record<string, unknown>): EnvConfig;
