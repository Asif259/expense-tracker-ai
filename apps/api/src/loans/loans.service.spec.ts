import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoansService } from './loans.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateLoanDto, RecordRepaymentDto } from '@ledgerly/shared-types';

describe('LoansService', () => {
  let service: LoansService;
  let supabaseService: SupabaseService;
  let mockClient: any;

  const mockToken = 'mock-user-jwt';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockLoanId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockClient = {
      from: vi.fn(),
      rpc: vi.fn(),
    };

    supabaseService = {
      getClientForToken: vi.fn().mockReturnValue(mockClient),
    } as unknown as SupabaseService;

    service = new LoansService(supabaseService);
  });

  describe('create', () => {
    const validDto: CreateLoanDto = {
      person_name: 'Rahim',
      direction: 'lent',
      principal_amount: '1000.00',
      currency: 'BDT',
      payment_method: 'bkash',
      loan_date: '2026-10-10',
      due_date: '2026-10-15',
      notes: 'Lunch loan',
    };

    it('creates loan using authenticated client and derives user_id from auth context', async () => {
      const mockResult = { id: mockLoanId, user_id: mockUserId, ...validDto };

      const singleMock = vi.fn().mockResolvedValue({ data: mockResult, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });

      mockClient.from.mockReturnValue({ insert: insertMock });

      const result = await service.create(mockToken, mockUserId, validDto);

      expect(supabaseService.getClientForToken).toHaveBeenCalledWith(mockToken);
      expect(mockClient.from).toHaveBeenCalledWith('loans');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          person_name: 'Rahim',
          direction: 'lent',
          principal_amount: '1000.00',
        }),
      );
      expect(result.outstanding_balance).toBe(1000);
      expect(result.status).toBe('active');
    });
  });

  describe('recordRepayment', () => {
    const repaymentDto: RecordRepaymentDto = {
      amount: '500.00',
      payment_date: '2026-10-12',
      payment_method: 'bkash',
      reference: 'TXN9988',
    };

    it('invokes record_loan_repayment RPC with user token', async () => {
      const mockRpcResponse = {
        repayment_id: '880e8400-e29b-41d4-a716-446655440003',
        loan_id: mockLoanId,
        amount: 500,
        total_repaid: 500,
        outstanding_balance: 500,
        progress_pct: 50,
        status: 'active',
      };

      mockClient.rpc.mockResolvedValue({ data: mockRpcResponse, error: null });

      const result = await service.recordRepayment(mockToken, mockLoanId, repaymentDto);

      expect(mockClient.rpc).toHaveBeenCalledWith('record_loan_repayment', {
        p_loan_id: mockLoanId,
        p_amount: '500.00',
        p_payment_date: '2026-10-12',
        p_payment_method: 'bkash',
        p_reference: 'TXN9988',
        p_notes: null,
      });
      expect(result.outstanding_balance).toBe(500);
      expect(result.progress_pct).toBe(50);
    });
  });

  describe('getSummary', () => {
    it('aggregates metrics grouped strictly by currency', async () => {
      const mockLoans = [
        {
          id: '1',
          user_id: mockUserId,
          direction: 'lent',
          principal_amount: 1000,
          total_repaid: 400,
          outstanding_balance: 600,
          currency: 'BDT',
          status: 'active',
        },
        {
          id: '2',
          user_id: mockUserId,
          direction: 'borrowed',
          principal_amount: 500,
          total_repaid: 500,
          outstanding_balance: 0,
          currency: 'BDT',
          status: 'settled',
        },
        {
          id: '3',
          user_id: mockUserId,
          direction: 'lent',
          principal_amount: 200,
          total_repaid: 0,
          outstanding_balance: 200,
          currency: 'USD',
          status: 'overdue',
        },
      ];

      const eqMock = vi.fn().mockResolvedValue({ data: mockLoans, error: null });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      mockClient.from.mockReturnValue({ select: selectMock });

      const result = await service.getSummary(mockToken, mockUserId);

      expect(result.currencies.BDT).toBeDefined();
      expect(result.currencies.BDT?.total_lent).toBe(1000);
      expect(result.currencies.BDT?.outstanding_receivables).toBe(600);
      expect(result.currencies.BDT?.total_borrowed).toBe(500);
      expect(result.currencies.BDT?.settled_loans_count).toBe(1);

      expect(result.currencies.USD).toBeDefined();
      expect(result.currencies.USD?.overdue_receivables).toBe(200);
      expect(result.currencies.USD?.overdue_loans_count).toBe(1);
    });
  });
});
