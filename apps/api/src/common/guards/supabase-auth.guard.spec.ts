import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import type { User } from '@supabase/supabase-js';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let reflector: Reflector;
  let supabaseService: SupabaseService;

  beforeEach(() => {
    reflector = new Reflector();
    supabaseService = {
      verifyToken: vi.fn(),
      getClientForToken: vi.fn(),
    } as unknown as SupabaseService;
    guard = new SupabaseAuthGuard(reflector, supabaseService);
  });

  function createMockContext(headers: Record<string, string>, isPublic = false): ExecutionContext {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

    const request = {
      headers,
    };

    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access to public endpoints without authorization header', async () => {
    const context = createMockContext({}, true);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(supabaseService.verifyToken).not.toHaveBeenCalled();
  });

  it('rejects request when Authorization header is missing', async () => {
    const context = createMockContext({}, false);
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authorization header is missing'),
    );
  });

  it('rejects request when scheme is not Bearer', async () => {
    const context = createMockContext({ authorization: 'Basic dXNlcjpwYXNz' }, false);
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authorization header must use Bearer scheme'),
    );
  });

  it('rejects request with invalid or expired token', async () => {
    const context = createMockContext({ authorization: 'Bearer expired-token' }, false);
    vi.spyOn(supabaseService, 'verifyToken').mockRejectedValue(
      new UnauthorizedException('Authentication token is invalid or expired'),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('authenticates valid token and attaches user and token to request', async () => {
    const mockUser: User = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const context = createMockContext({ authorization: 'Bearer valid-jwt-token' }, false);
    vi.spyOn(supabaseService, 'verifyToken').mockResolvedValue(mockUser);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest() as Record<string, unknown>;
    expect(req['user']).toEqual(mockUser);
    expect(req['accessToken']).toBe('valid-jwt-token');
  });
});
