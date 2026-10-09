import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';
import type { User } from '@supabase/supabase-js';

describe('Transactions API (/transactions)', () => {
  let app: INestApplication;
  let mockSupabaseService: any;
  let mockUserClient: any;

  const validToken = 'valid-user-jwt';
  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const validPayload = {
    type: 'expense',
    amount: '99.50',
    currency: 'USD',
    category_id: '660e8400-e29b-41d4-a716-446655440001',
    description: 'Groceries',
    transaction_date: '2026-03-15',
  };

  beforeEach(async () => {
    mockUserClient = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '770e8400-e29b-41d4-a716-446655440002', user_id: mockUser.id, ...validPayload },
              error: null,
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [{ id: '770e8400-e29b-41d4-a716-446655440002', user_id: mockUser.id, ...validPayload }],
                  count: 1,
                  error: null,
                }),
              }),
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: '770e8400-e29b-41d4-a716-446655440002', user_id: mockUser.id, ...validPayload },
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: '770e8400-e29b-41d4-a716-446655440002', user_id: mockUser.id, ...validPayload, amount: '120.00' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: '770e8400-e29b-41d4-a716-446655440002' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Authentication & Identity', () => {
    it('returns 401 when Authorization header is missing', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send(validPayload)
        .expect(401);

      expect(mockUserClient.from).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', 'Bearer invalid-token')
        .send(validPayload)
        .expect(401);

      expect(mockUserClient.from).not.toHaveBeenCalled();
    });

    it('returns 400 when body attempts to spoof user_id', async () => {
      const spoofedPayload = {
        ...validPayload,
        user_id: '11111111-1111-1111-1111-111111111111',
      };

      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send(spoofedPayload)
        .expect(400);

      // Proves invalid request does not call Supabase
      expect(mockUserClient.from).not.toHaveBeenCalled();
    });
  });

  describe('Amount & Currency Validation', () => {
    it('rejects string "10.999" (excess decimal places) before calling Supabase', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, amount: '10.999' })
        .expect(400);

      expect(mockUserClient.from).not.toHaveBeenCalled();
    });

    it('rejects number 10.999 (excess decimal places) before calling Supabase', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, amount: 10.999 })
        .expect(400);

      expect(mockUserClient.from).not.toHaveBeenCalled();
    });

    it('rejects string "10.500" due to strict scale policy before calling Supabase', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, amount: '10.500' })
        .expect(400);

      expect(mockUserClient.from).not.toHaveBeenCalled();
    });

    it('accepts numeric 10.500 normalized by JavaScript runtime to 10.5', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, amount: 10.500 })
        .expect(201);

      expect(mockUserClient.from).toHaveBeenCalled();
    });

    it('rejects unsupported currency "XYZ" before calling Supabase', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, currency: 'XYZ' })
        .expect(400);

      expect(mockUserClient.from).not.toHaveBeenCalled();
    });

    it('accepts supported currencies including CAD and JPY', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, currency: 'CAD' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, currency: 'JPY' })
        .expect(201);
    });

    it('rejects invalid calendar date like Feb 30 before calling Supabase', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, transaction_date: '2026-02-30' })
        .expect(400);

      expect(mockUserClient.from).not.toHaveBeenCalled();
    });
  });

  describe('CRUD Endpoints', () => {
    it('GET /transactions returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body.limit).toBe(10);
    });

    it('GET /transactions/:id returns single transaction', async () => {
      const txId = '770e8400-e29b-41d4-a716-446655440002';
      const res = await request(app.getHttpServer())
        .get(`/transactions/${txId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.id).toBe(txId);
    });

    it('PATCH /transactions/:id updates transaction', async () => {
      const txId = '770e8400-e29b-41d4-a716-446655440002';
      const res = await request(app.getHttpServer())
        .patch(`/transactions/${txId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ amount: '120.00' })
        .expect(200);

      expect(res.body.amount).toBe('120.00');
    });

    it('DELETE /transactions/:id removes transaction', async () => {
      const txId = '770e8400-e29b-41d4-a716-446655440002';
      const res = await request(app.getHttpServer())
        .delete(`/transactions/${txId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.message).toContain('deleted');
      expect(res.body.id).toBe(txId);
    });
  });
});
