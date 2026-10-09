import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  private readonly authClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    this.supabaseAnonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    this.authClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Verifies the Supabase access token against the Supabase Auth server.
   * Derives the user identity strictly from the verified token.
   */
  async verifyToken(token: string): Promise<User> {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Missing or invalid authentication token');
    }

    try {
      const { data, error } = await this.authClient.auth.getUser(token);

      if (error || !data?.user) {
        throw new UnauthorizedException('Authentication token is invalid or expired');
      }

      return data.user;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Constructs an authenticated Supabase client using the caller's JWT.
   * This ensures row level security (RLS) policies and auth.uid() function
   * correctly evaluate under the authenticated user's identity.
   */
  getClientForToken(token: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
}
