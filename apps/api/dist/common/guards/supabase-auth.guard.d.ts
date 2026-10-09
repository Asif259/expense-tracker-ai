import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../supabase/supabase.service.js';
export declare class SupabaseAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly supabaseService;
    constructor(reflector: Reflector, supabaseService: SupabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
