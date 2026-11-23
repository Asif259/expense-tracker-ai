// Behavior under test: BudgetsService.create / findAll / getProgress.
// Module under test: apps/api/src/budgets/budgets.service.ts.
// Existing test files for it: none — this is the first spec for the new budgets module.
// User's verbatim instruction: "Create Vitest unit tests for BudgetsService in tests/budgets/ or apps/api/src/budgets/ (following loans.service.spec.ts pattern)."
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetsService } from './budgets.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateBudgetDto } from '@ledgerly/shared-types';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let supabaseService: SupabaseService;
  let mockClient: any;

  const mockToken = 'mock-user-jwt';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockBudgetId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockClient = {
      from: vi.fn(),
    };

    supabaseService = {
      getClientForToken: vi.fn().mockReturnValue(mockClient),
    } as unknown as SupabaseService;

    service = new BudgetsService(supabaseService);
  });

  describe('create', () => {
    const validDto: CreateBudgetDto = {
      category_id: null,
      period_year: 2026,
      period_month: 11,
      limit_amount: '5000.00',
      currency: 'BDT',
    };

    it('creates budget using authenticated client and derives user_id from auth context', async () => {
      const mockResult = { id: mockBudgetId, user_id: mockUserId, ...validDto };

      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: mockResult, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });

      mockClient.from.mockReturnValue({ insert: insertMock });

      const result = await service.create(mockToken, mockUserId, validDto);

      expect(supabaseService.getClientForToken).toHaveBeenCalledWith(mockToken);
      expect(mockClient.from).toHaveBeenCalledWith('budgets');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          category_id: null,
          period_year: 2026,
          period_month: 11,
          limit_amount: '5000.00',
          currency: 'BDT',
        }),
      );
      expect(result.id).toBe(mockBudgetId);
    });
  });

  describe('findAll', () => {
    it("queries only the authenticated user's budgets and normalizes numeric limit_amount", async () => {
      const mockRows = [
        {
          id: mockBudgetId,
          user_id: mockUserId,
          category_id: null,
          period_year: 2026,
          period_month: 11,
          limit_amount: 5000,
          currency: 'BDT',
        },
      ];

      const order2Mock = vi
        .fn()
        .mockResolvedValue({ data: mockRows, error: null });
      const order1Mock = vi.fn().mockReturnValue({ order: order2Mock });
      const eqMock = vi.fn().mockReturnValue({ order: order1Mock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      mockClient.from.mockReturnValue({ select: selectMock });

      const result = await service.findAll(mockToken, mockUserId, {});

      expect(mockClient.from).toHaveBeenCalledWith('budgets');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result[0].limit_amount).toBe('5000.00');
    });
  });

  describe('getProgress', () => {
    it('computes spent vs limit per category, flagging over-budget', async () => {
      const mockBudgets = [
        {
          id: 'b-1',
          user_id: mockUserId,
          category_id: 'cat-food',
          period_year: 2026,
          period_month: 11,
          limit_amount: '4000.00',
          currency: 'BDT',
        },
      ];

      const mockCategories = [{ id: 'cat-food', name: 'Food & Dining' }];

      const mockTxns = [
        { amount: '2500.00', currency: 'BDT', category_id: 'cat-food' },
        { amount: '2000.00', currency: 'BDT', category_id: 'cat-food' },
      ];

      // budgets: .from('budgets').select('*').eq('user_id', ...).eq('period_year', ...).eq('period_month', ...)
      const budgetsEq3 = vi
        .fn()
        .mockResolvedValue({ data: mockBudgets, error: null });
      const budgetsEq2 = vi.fn().mockReturnValue({ eq: budgetsEq3 });
      const budgetsEq1 = vi.fn().mockReturnValue({ eq: budgetsEq2 });
      const budgetsSelect = vi.fn().mockReturnValue({ eq: budgetsEq1 });
      // categories: .from('categories').select('id, name') — no .eq chained
      const categoriesSelect = vi
        .fn()
        .mockResolvedValue({ data: mockCategories, error: null });
      // transactions: .from('transactions').select('amount, currency, category_id').eq('user_id', ...).gte(...).lt(...).eq('is_confirmed', true)
      const txEq = vi.fn().mockResolvedValue({ data: mockTxns, error: null });
      const txLt = vi.fn().mockReturnValue({ eq: txEq });
      const txGte = vi.fn().mockReturnValue({ lt: txLt });
      const txEqUser = vi.fn().mockReturnValue({ gte: txGte });
      const txSelect = vi.fn().mockReturnValue({ eq: txEqUser });

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'budgets') return { select: budgetsSelect };
        if (table === 'categories') return { select: categoriesSelect };
        if (table === 'transactions') return { select: txSelect };
        return { select: vi.fn() };
      });

      const result = await service.getProgress(mockToken, mockUserId, 2026, 11);

      expect(result).toHaveLength(1);
      expect(result[0].category_name).toBe('Food & Dining');
      expect(result[0].limit_amount).toBe('4000.00');
      expect(result[0].spent_amount).toBe('4500.00');
      expect(result[0].remaining_amount).toBe('0.00');
      expect(result[0].is_over_budget).toBe(true);
      expect(result[0].percent).toBe(113);
    });

    it('returns empty array when no budgets exist for the period', async () => {
      const budgetsEq3 = vi.fn().mockResolvedValue({ data: [], error: null });
      const budgetsEq2 = vi.fn().mockReturnValue({ eq: budgetsEq3 });
      const budgetsEq1 = vi.fn().mockReturnValue({ eq: budgetsEq2 });
      const budgetsSelect = vi.fn().mockReturnValue({ eq: budgetsEq1 });
      mockClient.from.mockReturnValue({ select: budgetsSelect });

      const result = await service.getProgress(mockToken, mockUserId, 2026, 11);
      expect(result).toEqual([]);
    });
  });
});
