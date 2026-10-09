import { ConfigService } from '@nestjs/config';
import { SupabaseClient, User } from '@supabase/supabase-js';
export declare class SupabaseService {
    private readonly configService;
    private readonly supabaseUrl;
    private readonly supabaseAnonKey;
    private readonly authClient;
    constructor(configService: ConfigService);
    verifyToken(token: string): Promise<User>;
    getClientForToken(token: string): SupabaseClient;
}
