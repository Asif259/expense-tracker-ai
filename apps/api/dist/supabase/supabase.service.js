var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
let SupabaseService = class SupabaseService {
    configService;
    supabaseUrl;
    supabaseAnonKey;
    authClient;
    constructor(configService) {
        this.configService = configService;
        this.supabaseUrl = this.configService.getOrThrow('SUPABASE_URL');
        this.supabaseAnonKey = this.configService.getOrThrow('SUPABASE_ANON_KEY');
        this.authClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }
    async verifyToken(token) {
        if (!token || typeof token !== 'string') {
            throw new UnauthorizedException('Missing or invalid authentication token');
        }
        try {
            const { data, error } = await this.authClient.auth.getUser(token);
            if (error || !data?.user) {
                throw new UnauthorizedException('Authentication token is invalid or expired');
            }
            return data.user;
        }
        catch (err) {
            if (err instanceof UnauthorizedException) {
                throw err;
            }
            throw new UnauthorizedException('Authentication failed');
        }
    }
    getClientForToken(token) {
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
};
SupabaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], SupabaseService);
export { SupabaseService };
//# sourceMappingURL=supabase.service.js.map