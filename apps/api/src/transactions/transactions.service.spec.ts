import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { GroqService } from '../ai/groq.service.js';
import type { CreateTransactionDto } from './dto/transaction.schema.js';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let supabaseService: SupabaseService;
  let groqService: GroqService;
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

    groqService = {
      generateStructuredResponse: vi.fn(),
      getModelName: vi.fn().mockReturnValue('llama-3.3-70b-versatile'),
    } as unknown as GroqService;

    service = new TransactionsService(supabaseService, groqService);
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

  // ── getMonthlySummary ──────────────────────────────────────────────────────

  describe('getMonthlySummary', () => {
    const buildQueryChain = (rows: any[], count: number) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: rows, count, error: null }),
    });

    it('defaults to current month boundaries and aggregates income and expenses per currency', async () => {
      const rows = [
        { type: 'income', amount: '45000.00', currency: 'BDT' },
        { type: 'expense', amount: '28500.00', currency: 'BDT' },
      ];
      mockClient.from.mockReturnValue(buildQueryChain(rows, 2));

      const result = await service.getMonthlySummary(mockToken, mockUserId, { month: 11, year: 2026 });

      expect(result.transactionCount).toBe(2);
      expect(result.currencies['BDT'].income).toBe('45000.00');
      expect(result.currencies['BDT'].expenses).toBe('28500.00');
      expect(result.currencies['BDT'].net).toBe('16500.00');
      expect(result.period.startDate).toBe('2026-11-01');
      expect(result.period.endDate).toBe('2026-11-30');
    });

    it('returns net with negative sign when expenses exceed income', async () => {
      const rows = [
        { type: 'income', amount: '5000.00', currency: 'BDT' },
        { type: 'expense', amount: '8000.00', currency: 'BDT' },
      ];
      mockClient.from.mockReturnValue(buildQueryChain(rows, 2));

      const result = await service.getMonthlySummary(mockToken, mockUserId, { month: 10, year: 2026 });
      expect(result.currencies['BDT'].net).toBe('-3000.00');
    });

    it('returns empty currencies map and zero count for a month with no transactions', async () => {
      mockClient.from.mockReturnValue(buildQueryChain([], 0));

      const result = await service.getMonthlySummary(mockToken, mockUserId, { month: 1, year: 2026 });

      expect(result.transactionCount).toBe(0);
      expect(Object.keys(result.currencies)).toHaveLength(0);
    });

    it('keeps BDT and USD totals separate — never combined', async () => {
      const rows = [
        { type: 'income', amount: '1000.00', currency: 'BDT' },
        { type: 'expense', amount: '50.00', currency: 'USD' },
      ];
      mockClient.from.mockReturnValue(buildQueryChain(rows, 2));

      const result = await service.getMonthlySummary(mockToken, mockUserId, { month: 11, year: 2026 });

      expect(result.currencies['BDT']).toBeDefined();
      expect(result.currencies['USD']).toBeDefined();
      expect(Object.keys(result.currencies)).toHaveLength(2);
    });

    it('handles large decimal amounts without floating-point errors', async () => {
      const rows = [
        { type: 'income', amount: '9999999999.99', currency: 'BDT' },
        { type: 'income', amount: '0.01', currency: 'BDT' },
      ];
      mockClient.from.mockReturnValue(buildQueryChain(rows, 2));

      const result = await service.getMonthlySummary(mockToken, mockUserId, { month: 11, year: 2026 });
      expect(result.currencies['BDT'].income).toBe('10000000000.00');
    });

    it('queries only user-scoped records', async () => {
      const chain = buildQueryChain([], 0);
      mockClient.from.mockReturnValue(chain);

      await service.getMonthlySummary(mockToken, mockUserId, { month: 11, year: 2026 });

      expect(supabaseService.getClientForToken).toHaveBeenCalledWith(mockToken);
      expect(chain.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('handles February boundary correctly (2026-02-01 to 2026-02-28)', async () => {
      mockClient.from.mockReturnValue(buildQueryChain([], 0));

      const result = await service.getMonthlySummary(mockToken, mockUserId, { month: 2, year: 2026 });
      expect(result.period.startDate).toBe('2026-02-01');
      expect(result.period.endDate).toBe('2026-02-28');
    });

    it('handles leap year February boundary (2024-02-01 to 2024-02-29)', async () => {
      mockClient.from.mockReturnValue(buildQueryChain([], 0));

      const result = await service.getMonthlySummary(mockToken, mockUserId, { month: 2, year: 2024 });
      expect(result.period.startDate).toBe('2024-02-01');
      expect(result.period.endDate).toBe('2024-02-29');
    });

    it('handles December boundary correctly (2026-12-01 to 2026-12-31)', async () => {
      mockClient.from.mockReturnValue(buildQueryChain([], 0));

      const result = await service.getMonthlySummary(mockToken, mockUserId, { month: 12, year: 2026 });
      expect(result.period.startDate).toBe('2026-12-01');
      expect(result.period.endDate).toBe('2026-12-31');
    });
  });

  // ── analyzeTransactions ───────────────────────────────────────────────────

  describe('analyzeTransactions', () => {
    const mockGroqService = () =>
      ({
        generateStructuredResponse: vi.fn(),
        getModelName: vi.fn().mockReturnValue('llama-3.3-70b-versatile'),
      }) as unknown as GroqService;

    beforeEach(() => {
      // Re-instantiate with GroqService for analysis tests
      (service as any).groqService = mockGroqService();
    });

    const buildSummaryChain = () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    });

    it('detects intent and calls DB aggregation before Groq explanation', async () => {
      mockClient.from.mockReturnValue(buildSummaryChain());

      const intentResponse = JSON.stringify({ intent: 'monthly_summary' });
      const explanationResponse = JSON.stringify({
        answer: 'You have no transactions this month.',
        insights: [],
        suggestedQuestions: ['Add your first transaction.'],
      });

      (service as any).groqService.generateStructuredResponse
        .mockResolvedValueOnce(intentResponse)   // Phase 1: intent
        .mockResolvedValueOnce(explanationResponse); // Phase 3: explanation

      const result = await service.analyzeTransactions(mockToken, mockUserId, {
        question: 'Summarize my activity',
        period: { month: 11, year: 2026 },
        conversationHistory: [],
      });

      expect(result.answer).toBe('You have no transactions this month.');
      expect(result.dataUsed.intent).toBe('monthly_summary');
      expect(result.dataUsed.period).toBe('November 2026');
    });

    it('defaults to general intent when Groq returns an unexpected value', async () => {
      mockClient.from.mockReturnValue(buildSummaryChain());

      (service as any).groqService.generateStructuredResponse
        .mockResolvedValueOnce(JSON.stringify({ intent: 'unknown_intent' }))
        .mockResolvedValueOnce(JSON.stringify({ answer: 'General answer', insights: [], suggestedQuestions: [] }));

      const result = await service.analyzeTransactions(mockToken, mockUserId, {
        question: 'Some question',
        period: { month: 11, year: 2026 },
        conversationHistory: [],
      });

      expect(result.dataUsed.intent).toBe('general');
    });

    it('gracefully handles Groq JSON parse failure in explanation phase', async () => {
      mockClient.from.mockReturnValue(buildSummaryChain());

      (service as any).groqService.generateStructuredResponse
        .mockResolvedValueOnce(JSON.stringify({ intent: 'monthly_summary' }))
        .mockResolvedValueOnce('not valid json {{{{');

      const result = await service.analyzeTransactions(mockToken, mockUserId, {
        question: 'What is my summary?',
        period: { month: 11, year: 2026 },
        conversationHistory: [],
      });

      expect(result.answer).toContain('unable to generate');
    });

    it('enforces user ownership on all DB queries inside analysis', async () => {
      const chain = buildSummaryChain();
      mockClient.from.mockReturnValue(chain);

      (service as any).groqService.generateStructuredResponse
        .mockResolvedValue(JSON.stringify({ intent: 'monthly_summary' }));

      (service as any).groqService.generateStructuredResponse
        .mockResolvedValueOnce(JSON.stringify({ intent: 'monthly_summary' }))
        .mockResolvedValueOnce(JSON.stringify({ answer: 'ok', insights: [], suggestedQuestions: [] }));

      await service.analyzeTransactions(mockToken, mockUserId, {
        question: 'summary',
        period: { month: 11, year: 2026 },
        conversationHistory: [],
      });

      // getClientForToken must always be called with the JWT, never with a user-supplied value
      expect(supabaseService.getClientForToken).toHaveBeenCalledWith(mockToken);
      expect(chain.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });
  });
});
