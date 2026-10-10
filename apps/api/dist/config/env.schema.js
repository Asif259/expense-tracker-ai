import { z } from 'zod';
export const envSchema = z.object({
    PORT: z.union([z.string(), z.number()]).default(3001),
    SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional().default('https://placeholder.supabase.co'),
    SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required').optional().default('placeholder-anon-key'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').optional().default('placeholder-service-role-key'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required').optional().default('placeholder-groq-key'),
    GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
});
export function validateEnv(config) {
    const result = envSchema.safeParse(config);
    if (!result.success) {
        const formattedErrors = result.error.errors
            .map((err) => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
        console.warn(`[Ledgerly API] ⚠️ Environment validation warning: ${formattedErrors}`);
    }
    const data = result.success ? result.data : envSchema.parse({});
    if (!config.SUPABASE_URL || String(config.SUPABASE_URL).includes('placeholder')) {
        console.warn('[Ledgerly API] ⚠️ WARNING: SUPABASE_URL not configured. Authentication and database requests will fail.');
    }
    if (!config.GROQ_API_KEY || String(config.GROQ_API_KEY).includes('placeholder')) {
        console.warn('[Ledgerly API] ⚠️ WARNING: GROQ_API_KEY not configured. AI parsing requests will fail.');
    }
    return data;
}
//# sourceMappingURL=env.schema.js.map