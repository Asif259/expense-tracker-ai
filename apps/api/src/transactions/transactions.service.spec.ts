import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateTransactionDto } from './dto/transaction.schema.js';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let supabaseService: SupabaseService;
  let mockClient: any;

  const mockToken = 'mock-user-jwt';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockTransactionId = '770e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    mockClient = {
      from: vi.fn(),
    };

    supabaseService = {
      getClientForToken: vi.fn().mockReturnValue(mockClient),
      verifyToken: vi.fn(),
    } as unknown as SupabaseService;

    service = new TransactionsService(supabaseService);
  });

  describe('create', () => {
    const validDto: CreateTransactionDto = {
      type: 'expense',
      amount: '45.00',
      currency: 'USD',
      category_id: '660e8400-e29b-41d4-a716-446655440001',
      description: 'Coffee',
      transaction_date: '2026-03-15',
    };

    it('creates transaction using authenticated user client and derives user_id from auth context', async () => {
      const mockResult = { id: mockTransactionId, user_id: mockUserId, ...validDto };

      const singleMock = vi.fn().mockResolvedValue({ data: mockResult, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });

      mockClient.from.mockReturnValue({ insert: insertMock });

      const result = await service.create(mockToken, mockUserId, validDto);

      expect(supabaseService.getClientForToken).toHaveBeenCalledWith(mockToken);
      expect(mockClient.from).toHaveBeenCalledWith('transactions');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          amount: '45.00',
          currency: 'USD',
          type: 'expense',
          category_id: validDto.category_id,
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('maps database error when category trigger fails', async () => {
      const dbError = {
        name: 'PostgrestError',
        message: 'category_type_mismatch',
        code: 'P0004',
        details: '',
        hint: '',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: null, error: dbError });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });

      mockClient.from.mockReturnValue({ insert: insertMock });

      await expect(service.create(mockToken, mockUserId, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('queries transactions scoped strictly to authenticated user', async () => {
      const mockRows = [{ id: mockTransactionId, amount: '45.00' }];

      const queryChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRows, count: 1, error: null }),
      };

      mockClient.from.mockReturnValue(queryChain);

      const result = await service.findAll(mockToken, mockUserId, {
        limit: 10,
        offset: 0,
        type: 'expense',
      });

      expect(queryChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(queryChain.eq).toHaveBeenCalledWith('type', 'expense');
      expect(result.data).toEqual(mockRows);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns transaction when owned by user', async () => {
      const mockRow = { id: mockTransactionId, user_id: mockUserId };
      const singleMock = vi.fn().mockResolvedValue({ data: mockRow, error: null });
      const eqUserMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });

      mockClient.from.mockReturnValue({ select: selectMock });

      const result = await service.findOne(mockToken, mockUserId, mockTransactionId);
      expect(result).toEqual(mockRow);
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const eqUserMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });

      mockClient.from.mockReturnValue({ select: selectMock });

      await expect(
        service.findOne(mockToken, mockUserId, mockTransactionId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes transaction and returns success message', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: { id: mockTransactionId }, error: null });
      const eqUserMock = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: singleMock }) });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqIdMock });

      mockClient.from.mockReturnValue({ delete: deleteMock });

      const result = await service.remove(mockToken, mockUserId, mockTransactionId);
      expect(result.message).toBe('Transaction successfully deleted');
      expect(result.id).toBe(mockTransactionId);
    });
  });
});
