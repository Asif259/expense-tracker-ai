var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
let SupabaseAuthGuard = class SupabaseAuthGuard {
    reflector;
    supabaseService;
    constructor(reflector, supabaseService) {
        this.reflector = reflector;
        this.supabaseService = supabaseService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            throw new UnauthorizedException('Authorization header is missing');
        }
        const [scheme, token] = authHeader.trim().split(/\s+/);
        if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
            throw new UnauthorizedException('Authorization header must use Bearer scheme');
        }
        let user;
        try {
            user = await this.supabaseService.verifyToken(token);
        }
        catch (err) {
            if (err instanceof UnauthorizedException) {
                throw err;
            }
            throw new UnauthorizedException('Authentication token is invalid or expired');
        }
        request['user'] = user;
        request['accessToken'] = token;
        return true;
    }
};
SupabaseAuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector,
        SupabaseService])
], SupabaseAuthGuard);
export { SupabaseAuthGuard };
//# sourceMappingURL=supabase-auth.guard.js.map