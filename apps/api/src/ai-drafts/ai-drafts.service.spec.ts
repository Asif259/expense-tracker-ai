import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AiDraftsService } from './ai-drafts.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import type { CreateAiDraftDto } from './dto/ai-draft.schema.js';

describe('AiDraftsService', () => {
  let service: AiDraftsService;
  let supabaseService: SupabaseService;
  let supabaseAdminService: SupabaseAdminService;
  let mockUserClient: any;

  const mockToken = 'mock-user-jwt';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDraftId = '880e8400-e29b-41d4-a716-446655440003';
  const mockTxId = '990e8400-e29b-41d4-a716-446655440004';

  beforeEach(() => {
    mockUserClient = {
      from: vi.fn(),
      rpc: vi.fn(),
    };

    supabaseService = {
      getClientForToken: vi.fn().mockReturnValue(mockUserClient),
      verifyToken: vi.fn(),
    } as unknown as SupabaseService;

    supabaseAdminService = {
      createAiDraft: vi.fn(),
    } as unknown as SupabaseAdminService;

    service = new AiDraftsService(supabaseService, supabaseAdminService);
  });

  describe('createDraft', () => {
    const validDto: CreateAiDraftDto = {
      type: 'expense',
      amount: '89.99',
      currency: 'EUR',
      category_id: '660e8400-e29b-41d4-a716-446655440001',
      description: 'Book purchase',
      transaction_date: '2026-03-15',
    };

    it('creates AI draft using encapsulated service-role admin service with verified userId', async () => {
      vi.spyOn(supabaseAdminService, 'createAiDraft').mockResolvedValue({ draftId: mockDraftId });

      const result = await service.createDraft(mockUserId, validDto);

      expect(supabaseAdminService.createAiDraft).toHaveBeenCalledWith({
        userId: mockUserId,
        type: validDto.type,
        amount: validDto.amount,
        currency: validDto.currency,
        categoryId: validDto.category_id,
        description: validDto.description,
        transactionDate: validDto.transaction_date,
      });

      expect(result).toEqual({
        id: mockDraftId,
        message: 'Draft transaction created successfully',
      });
    });
  });

  describe('listDrafts', () => {
    it('queries active drafts using authenticated user client', async () => {
      const mockDrafts = [{ id: mockDraftId, payload: { amount: '89.99' } }];

      const queryChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockDrafts, error: null }),
      };

      mockUserClient.from.mockReturnValue(queryChain);

      const result = await service.listDrafts(mockToken, mockUserId);

      expect(supabaseService.getClientForToken).toHaveBeenCalledWith(mockToken);
      expect(queryChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(queryChain.gt).toHaveBeenCalledWith('expires_at', expect.any(String));
      expect(result.data).toEqual(mockDrafts);
      expect(result.total).toBe(1);
    });
  });

  describe('confirmDraft', () => {
    it('invokes atomic confirm_ai_draft RPC using user-scoped client so auth.uid() is active', async () => {
      mockUserClient.rpc.mockResolvedValue({ data: mockTxId, error: null });

      const result = await service.confirmDraft(mockToken, mockDraftId);

      expect(supabaseService.getClientForToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserClient.rpc).toHaveBeenCalledWith('confirm_ai_draft', {
        p_draft_id: mockDraftId,
      });
      expect(result).toEqual({
        message: 'Draft confirmed and transaction created',
        transactionId: mockTxId,
      });
    });

    it('maps database error when draft is expired or already confirmed', async () => {
      mockUserClient.rpc.mockResolvedValue({
        data: null,
        error: {
          name: 'PostgrestError',
          message: 'draft_not_available',
          code: 'P0001',
          details: '',
          hint: '',
        },
      });

      await expect(service.confirmDraft(mockToken, mockDraftId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
