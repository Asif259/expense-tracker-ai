import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseExtractorService } from './expense-extractor.service.js';
import { GroqService } from './groq.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';

describe('ExpenseExtractorService', () => {
  let service: ExpenseExtractorService;
  let groqService: GroqService;
  let supabaseService: SupabaseService;
  let supabaseAdminService: SupabaseAdminService;
  let mockUserClient: any;

  const mockToken = 'mock-user-token';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDraftId = '880e8400-e29b-41d4-a716-446655440003';

  const mockCategories = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Food & Dining', type: 'expense', is_system: true },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Transportation', type: 'expense', is_system: true },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Freelance', type: 'income', is_system: true },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Salary', type: 'income', is_system: true },
  ];

  beforeEach(() => {
    mockUserClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        }),
      }),
      rpc: vi.fn(),
    };

    groqService = {
      generateStructuredResponse: vi.fn(),
      getModelName: vi.fn().mockReturnValue('llama-3.3-70b-versatile'),
    } as unknown as GroqService;

    supabaseService = {
      getClientForToken: vi.fn().mockReturnValue(mockUserClient),
      verifyToken: vi.fn(),
    } as unknown as SupabaseService;

    supabaseAdminService = {
      createAiDraft: vi.fn().mockResolvedValue({ draftId: mockDraftId }),
    } as unknown as SupabaseAdminService;

    service = new ExpenseExtractorService(groqService, supabaseService, supabaseAdminService);
  });

  describe('Successful extraction and draft creation', () => {
    it('extracts valid expense and creates AI draft through service-role wrapper without confirming', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '350.00',
        currency: 'BDT',
        description: 'Lunch with colleagues',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent 350 taka on lunch with colleagues today.',
      });

      expect(result.success).toBe(true);
      expect(result.clarificationNeeded).toBe(false);
      expect(result.draftId).toBe(mockDraftId);
      expect(result.extracted?.amount).toBe('350.00');
      expect(result.extracted?.currency).toBe('BDT');
      expect(result.extracted?.category_id).toBe('11111111-1111-1111-1111-111111111111');

      // Verifies draft created via admin wrapper
      expect(supabaseAdminService.createAiDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: 'expense',
          amount: '350.00',
          currency: 'BDT',
          categoryId: '11111111-1111-1111-1111-111111111111',
        }),
      );

      // CRITICAL SAFETY PROOF: confirm_ai_draft RPC is NEVER called during parsing
      expect(mockUserClient.rpc).not.toHaveBeenCalled();
    });

    it('extracts valid income and matches income category', async () => {
      const groqOutput = JSON.stringify({
        type: 'income',
        amount: '5000',
        currency: 'BDT',
        description: 'Web development freelance project',
        transaction_date: '2026-03-15',
        category_name: 'Freelance',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Received 5000 taka from freelance work.',
      });

      expect(result.success).toBe(true);
      expect(result.extracted?.type).toBe('income');
      expect(result.extracted?.category_id).toBe('33333333-3333-3333-3333-333333333333');
      expect(supabaseAdminService.createAiDraft).toHaveBeenCalled();
    });
  });

  describe('Financial Safety & Validation Rejection (Proof no DB write occurs)', () => {
    it('requests clarification when currency is ambiguous/missing and does NOT call Supabase', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '350.00',
        currency: null,
        description: 'Lunch',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: true,
        clarification_reason: 'Currency was not specified.',
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent 350 on lunch today.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('Currency was not specified');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('rejects unsupported currency "XYZ" and does NOT write to database', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '50.00',
        currency: 'XYZ',
        description: 'Book',
        transaction_date: '2026-03-15',
        category_name: 'Shopping',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent 50 XYZ on book.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('unsupported');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('rejects missing amount and does NOT write to database', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: null,
        currency: 'USD',
        description: 'Dinner',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Paid for dinner in USD.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('Amount was not specified');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('rejects negative amount from model and does NOT write to database', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '-50.00',
        currency: 'USD',
        description: 'Refund',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent -50 on food.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('Amount validation failed');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('rejects zero amount from model and does NOT write to database', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '0',
        currency: 'USD',
        description: 'Free sample',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent 0 on food.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('Amount validation failed');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('rejects excess precision "10.999" and does NOT write to database', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '10.999',
        currency: 'USD',
        description: 'Gasoline',
        transaction_date: '2026-03-15',
        category_name: 'Transportation',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Paid 10.999 for gas.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('Amount validation failed');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('rejects string "10.500" due to strict scale policy and does NOT write to database', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '10.500',
        currency: 'USD',
        description: 'Coffee',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Paid 10.500 for coffee.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('Amount validation failed');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('rejects over-limit amount exceeding 9999999999999.99', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '10000000000000.00',
        currency: 'USD',
        description: 'Large asset',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent ten trillion dollars.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('Amount validation failed');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('rejects nonfinite amount (NaN)', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: 'NaN',
        currency: 'USD',
        description: 'Item',
        transaction_date: '2026-03-15',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent NaN.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('falls back to today UTC date when date is unrecognised, missing, or invalid (e.g. Feb 30)', async () => {
      const todayUtc = new Date().toISOString().slice(0, 10);
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '50.00',
        currency: 'USD',
        description: 'Dinner',
        transaction_date: '2026-02-30',
        category_name: 'Food & Dining',
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent 50 on dinner on Feb 30.',
      });

      expect(result.success).toBe(true);
      expect(result.clarificationNeeded).toBe(false);
      expect(result.extracted?.transaction_date).toBe(todayUtc);
      expect(supabaseAdminService.createAiDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionDate: todayUtc,
        }),
      );
    });

    it('handles malformed/unparseable JSON from model safely', async () => {
      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue('Not a json response');

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Spent 50 dollars.',
      });

      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });

    it('does NOT invent category ID when category matching is uncertain', async () => {
      const groqOutput = JSON.stringify({
        type: 'expense',
        amount: '150.00',
        currency: 'USD',
        description: 'Crypto mining rig coolant',
        transaction_date: '2026-03-15',
        category_name: 'Cryptocurrency Hardware Maintenance',
        category_id: '99999999-9999-9999-9999-999999999999', // Model invented category ID
        clarification_needed: false,
      });

      vi.spyOn(groqService, 'generateStructuredResponse').mockResolvedValue(groqOutput);

      const result = await service.parseAndCreateDraft(mockToken, mockUserId, {
        text: 'Bought crypto mining coolant for 150 USD.',
      });

      // Proof: Did not trust invented ID or create draft with bogus foreign key
      expect(result.success).toBe(false);
      expect(result.clarificationNeeded).toBe(true);
      expect(result.message).toContain('Could not identify an appropriate category');
      expect(result.proposedCategory).toBe('Cryptocurrency Hardware Maintenance');
      expect(supabaseAdminService.createAiDraft).not.toHaveBeenCalled();
    });
  });
});
