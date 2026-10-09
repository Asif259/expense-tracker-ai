import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';
import { SupabaseAdminService } from '../src/supabase/supabase-admin.service.js';
import { GroqService } from '../src/ai/groq.service.js';
import type { User } from '@supabase/supabase-js';

describe('AI API (/ai/parse-expense)', () => {
  let app: INestApplication;
  let mockSupabaseService: any;
  let mockSupabaseAdminService: any;
  let mockGroqService: any;
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
  const categoryId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    mockUserClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            data: [
              { id: categoryId, name: 'Food & Dining', type: 'expense', is_system: true },
              { id: '22222222-2222-2222-2222-222222222222', name: 'Salary', type: 'income', is_system: true },
            ],
            error: null,
          }),
        }),
      }),
      rpc: vi.fn(),
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

    mockGroqService = {
      generateStructuredResponse: vi.fn(),
      getModelName: vi.fn().mockReturnValue('llama-3.3-70b-versatile'),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .overrideProvider(SupabaseAdminService)
      .useValue(mockSupabaseAdminService)
      .overrideProvider(GroqService)
      .useValue(mockGroqService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Authentication and Input Validation', () => {
    it('returns 401 when Authorization header is missing', async () => {
      await request(app.getHttpServer())
        .post('/ai/parse-expense')
        .send({ text: 'Spent 350 taka on lunch today.' })
        .expect(401);

      expect(mockGroqService.generateStructuredResponse).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/ai/parse-expense')
        .set('Authorization', 'Bearer invalid-token')
        .send({ text: 'Spent 350 taka on lunch today.' })
        .expect(401);

      expect(mockGroqService.generateStructuredResponse).not.toHaveBeenCalled();
    });

    it('returns 400 when text is empty or missing', async () => {
      await request(app.getHttpServer())
        .post('/ai/parse-expense')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(mockGroqService.generateStructuredResponse).not.toHaveBeenCalled();
    });
  });

  describe('Parsing and Draft Creation Flow', () => {
    it('successfully parses natural language, creates AI draft, and returns review response without confirming', async () => {
      const groqResponse = JSON.stringify({
        type: 'expense',
        amount: '350.00',
        currency: 'BDT',
        description: 'Lunch',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      mockGroqService.generateStructuredResponse.mockResolvedValue(groqResponse);

      const res = await request(app.getHttpServer())
        .post('/ai/parse-expense')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Spent 350 taka on lunch today.' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.clarificationNeeded).toBe(false);
      expect(res.body.draftId).toBe(draftId);
      expect(res.body.extracted.amount).toBe('350.00');
      expect(res.body.extracted.currency).toBe('BDT');
      expect(res.body.extracted.category_id).toBe(categoryId);

      // Verify createAiDraft called
      expect(mockSupabaseAdminService.createAiDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          amount: '350.00',
          currency: 'BDT',
          categoryId,
        }),
      );

      // Verify confirm_ai_draft was NEVER called
      expect(mockUserClient.rpc).not.toHaveBeenCalled();

      // Verify no sensitive keys leaked in response
      expect(JSON.stringify(res.body)).not.toContain('test-service-role-key');
      expect(JSON.stringify(res.body)).not.toContain('test-groq-api-key');
    });

    it('returns structured clarification when essential information is missing and does NOT call createAiDraft', async () => {
      const groqResponse = JSON.stringify({
        type: 'expense',
        amount: '350.00',
        currency: null,
        description: 'Lunch',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: true,
        clarification_reason: 'Currency was not specified.',
      });

      mockGroqService.generateStructuredResponse.mockResolvedValue(groqResponse);

      const res = await request(app.getHttpServer())
        .post('/ai/parse-expense')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Spent 350 on lunch today.' })
        .expect(200);

      expect(res.body.success).toBe(false);
      expect(res.body.clarificationNeeded).toBe(true);
      expect(res.body.message).toContain('Currency was not specified');
      expect(mockSupabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('returns structured clarification when category is unknown and does NOT invent a category ID', async () => {
      const groqResponse = JSON.stringify({
        type: 'expense',
        amount: '150.00',
        currency: 'USD',
        description: 'Cryptocurrency node fee',
        transaction_date: '2026-03-15',
        category_name: 'Blockchain Nodes',
        clarification_needed: false,
      });

      mockGroqService.generateStructuredResponse.mockResolvedValue(groqResponse);

      const res = await request(app.getHttpServer())
        .post('/ai/parse-expense')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Spent 150 USD on blockchain node fee.' })
        .expect(200);

      expect(res.body.success).toBe(false);
      expect(res.body.clarificationNeeded).toBe(true);
      expect(res.body.message).toContain('Could not identify an appropriate category');
      expect(res.body.proposedCategory).toBe('Blockchain Nodes');
      expect(mockSupabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });
  });

  describe('Provider Errors and Resilience', () => {
    it('returns 429 when Groq rate limit is exceeded', async () => {
      const { HttpException, HttpStatus } = await import('@nestjs/common');
      mockGroqService.generateStructuredResponse.mockRejectedValue(
        new HttpException(
          { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'AI service rate limit exceeded' },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      const res = await request(app.getHttpServer())
        .post('/ai/parse-expense')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Spent 100 USD.' })
        .expect(429);

      expect(res.body.message).toContain('rate limit');
    });

    it('returns 504 when Groq times out', async () => {
      const { GatewayTimeoutException } = await import('@nestjs/common');
      mockGroqService.generateStructuredResponse.mockRejectedValue(
        new GatewayTimeoutException('AI service request timed out'),
      );

      const res = await request(app.getHttpServer())
        .post('/ai/parse-expense')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Spent 100 USD.' })
        .expect(504);

      expect(res.body.message).toContain('timed out');
    });
  });
});
