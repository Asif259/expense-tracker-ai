import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';
import { SupabaseAdminService } from '../src/supabase/supabase-admin.service.js';
import type { User } from '@supabase/supabase-js';

describe('AI Drafts API (/ai-drafts)', () => {
  let app: INestApplication;
  let mockSupabaseService: any;
  let mockSupabaseAdminService: any;
  let mockUserClient: any;

  const validToken = 'valid-user-jwt';
  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const draftId = '880e8400-e29b-41d4-a716-446655440003';
  const transactionId = '990e8400-e29b-41d4-a716-446655440004';

  const validDraftPayload = {
    type: 'expense',
    amount: '65.00',
    currency: 'USD',
    category_id: '660e8400-e29b-41d4-a716-446655440001',
    description: 'Team lunch',
    transaction_date: '2026-03-15',
  };

  beforeEach(async () => {
    mockUserClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: draftId, user_id: mockUser.id, payload: validDraftPayload }],
                error: null,
              }),
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: draftId, user_id: mockUser.id, payload: validDraftPayload },
                error: null,
              }),
            }),
            single: vi.fn().mockResolvedValue({
              data: { id: draftId, user_id: mockUser.id, payload: validDraftPayload },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: draftId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockImplementation((fn: string, args: any) => {
        if (fn === 'confirm_ai_draft' && args.p_draft_id === draftId) {
          return Promise.resolve({ data: transactionId, error: null });
        }
        return Promise.resolve({
          data: null,
          error: { name: 'PostgrestError', message: 'draft_not_available', code: 'P0001', details: '', hint: '' },
        });
      }),
    };

    mockSupabaseService = {
      verifyToken: vi.fn().mockImplementation(async (token: string) => {
        if (token === validToken) {
          return mockUser;
        }
        throw new Error('Invalid token');
      }),
      getClientForToken: vi.fn().mockReturnValue(mockUserClient),
    };

    mockSupabaseAdminService = {
      createAiDraft: vi.fn().mockResolvedValue({ draftId }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .overrideProvider(SupabaseAdminService)
      .useValue(mockSupabaseAdminService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Draft Creation', () => {
    it('returns 401 when Authorization header is missing', async () => {
      await request(app.getHttpServer())
        .post('/ai-drafts')
        .send(validDraftPayload)
        .expect(401);

      expect(mockSupabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('creates AI draft via service-role wrapper and derives userId from authentication context', async () => {
      const res = await request(app.getHttpServer())
        .post('/ai-drafts')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validDraftPayload)
        .expect(201);

      expect(mockSupabaseAdminService.createAiDraft).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: validDraftPayload.type,
        amount: validDraftPayload.amount,
        currency: validDraftPayload.currency,
        categoryId: validDraftPayload.category_id,
        description: validDraftPayload.description,
        transactionDate: validDraftPayload.transaction_date,
      });

      expect(res.body.id).toBe(draftId);
      // Ensure no service-role secrets are exposed in response
      expect(JSON.stringify(res.body)).not.toContain('test-service-role-key');
    });

    it('rejects invalid amount on draft creation before calling service-role wrapper', async () => {
      await request(app.getHttpServer())
        .post('/ai-drafts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validDraftPayload, amount: '10.999' })
        .expect(400);

      expect(mockSupabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });
  });

  describe('Draft Listing, Retrieval and Deletion', () => {
    it('GET /ai-drafts lists user drafts', async () => {
      const res = await request(app.getHttpServer())
        .get('/ai-drafts')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(draftId);
    });

    it('GET /ai-drafts/:id retrieves single draft', async () => {
      const res = await request(app.getHttpServer())
        .get(`/ai-drafts/${draftId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.id).toBe(draftId);
    });

    it('DELETE /ai-drafts/:id discards draft', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/ai-drafts/${draftId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.message).toContain('discarded');
      expect(res.body.id).toBe(draftId);
    });
  });

  describe('Draft Confirmation', () => {
    it('POST /ai-drafts/:id/confirm invokes confirm_ai_draft RPC using user-scoped client', async () => {
      const res = await request(app.getHttpServer())
        .post(`/ai-drafts/${draftId}/confirm`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(mockSupabaseService.getClientForToken).toHaveBeenCalledWith(validToken);
      expect(mockUserClient.rpc).toHaveBeenCalledWith('confirm_ai_draft', {
        p_draft_id: draftId,
      });

      expect(res.body.transactionId).toBe(transactionId);
    });

    it('POST /ai-drafts/:id/confirm maps draft_not_available error safely without leaking internal SQL', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer())
        .post(`/ai-drafts/${nonExistentId}/confirm`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(res.body.message).toContain('Draft not found');
      expect(JSON.stringify(res.body)).not.toContain('auth.uid()');
    });

    it('rejects duplicate confirmation attempts with 404', async () => {
      // Simulate RPC error when draft was already confirmed/deleted
      mockUserClient.rpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'P0001',
          message: 'draft_not_available',
          details: 'Draft not found, expired, already confirmed, or locked',
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/ai-drafts/${draftId}/confirm`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(res.body.message).toContain('already confirmed');
    });
  });
});
