import { describe, it, expect } from 'vitest';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from './transaction.schema.js';

describe('transaction.schema validation', () => {
  const validPayload = {
    type: 'expense' as const,
    amount: '125.50',
    currency: 'USD' as const,
    category_id: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Grocery shopping',
    transaction_date: '2026-03-15',
  };

  describe('createTransactionSchema', () => {
    it('accepts valid transaction payload', () => {
      const result = createTransactionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe('125.50');
      }
    });

    it('defaults currency to BDT if omitted', () => {
      const { currency, ...withoutCurrency } = validPayload;
      const result = createTransactionSchema.safeParse(withoutCurrency);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('BDT');
      }
    });

    describe('amount precision and boundaries', () => {
      it('accepts valid two-decimal string amount "10.99"', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, amount: '10.99' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe('10.99');
        }
      });

      it('accepts valid two-decimal numeric amount 10.99', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, amount: 10.99 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe('10.99');
        }
      });

      it('rejects string "10.999" (excess decimal places)', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, amount: '10.999' });
        expect(result.success).toBe(false);
      });

      it('rejects number 10.999 (excess decimal places)', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, amount: 10.999 });
        expect(result.success).toBe(false);
      });

      it('rejects string "10.500" due to strict scale policy', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, amount: '10.500' });
        expect(result.success).toBe(false);
      });

      it('accepts numeric 10.500 normalized by JavaScript runtime to 10.5', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, amount: 10.500 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe('10.5');
        }
      });

      it('rejects zero and negative amounts', () => {
        expect(createTransactionSchema.safeParse({ ...validPayload, amount: '0' }).success).toBe(false);
        expect(createTransactionSchema.safeParse({ ...validPayload, amount: 0 }).success).toBe(false);
        expect(createTransactionSchema.safeParse({ ...validPayload, amount: '-10.50' }).success).toBe(false);
        expect(createTransactionSchema.safeParse({ ...validPayload, amount: -10.50 }).success).toBe(false);
      });

      it('accepts maximum permitted amount 9999999999999.99', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, amount: '9999999999999.99' });
        expect(result.success).toBe(true);
      });

      it('rejects amounts exceeding maximum permitted amount', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, amount: '10000000000000.00' });
        expect(result.success).toBe(false);
      });

      it('rejects NaN and Infinity', () => {
        expect(createTransactionSchema.safeParse({ ...validPayload, amount: Number.NaN }).success).toBe(false);
        expect(createTransactionSchema.safeParse({ ...validPayload, amount: Number.POSITIVE_INFINITY }).success).toBe(false);
        expect(createTransactionSchema.safeParse({ ...validPayload, amount: 'Infinity' }).success).toBe(false);
      });
    });

    describe('currency validation', () => {
      const supportedList = [
        'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
        'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB',
      ];

      it.each(supportedList)('accepts supported currency %s', (curr) => {
        const result = createTransactionSchema.safeParse({ ...validPayload, currency: curr });
        expect(result.success).toBe(true);
      });

      it('rejects unsupported currency', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, currency: 'XYZ' });
        expect(result.success).toBe(false);
      });
    });

    describe('date validation', () => {
      it('rejects invalid calendar dates like Feb 30', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, transaction_date: '2026-02-30' });
        expect(result.success).toBe(false);
      });

      it('rejects dates in distant future', () => {
        const result = createTransactionSchema.safeParse({ ...validPayload, transaction_date: '2099-12-31' });
        expect(result.success).toBe(false);
      });
    });

    describe('identity spoofing and protected fields', () => {
      it('rejects payloads attempting to supply user_id', () => {
        const result = createTransactionSchema.safeParse({
          ...validPayload,
          user_id: '660e8400-e29b-41d4-a716-446655440001',
        });
        expect(result.success).toBe(false);
      });

      it('rejects payloads attempting to supply id or is_confirmed', () => {
        const result = createTransactionSchema.safeParse({
          ...validPayload,
          id: '660e8400-e29b-41d4-a716-446655440001',
          is_confirmed: false,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateTransactionSchema', () => {
    it('accepts partial update payload', () => {
      const result = updateTransactionSchema.safeParse({ amount: '50.00' });
      expect(result.success).toBe(true);
    });

    it('rejects empty update payload', () => {
      const result = updateTransactionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects updates attempting to modify user_id', () => {
      const result = updateTransactionSchema.safeParse({
        amount: '50.00',
        user_id: '660e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(false);
    });
  });
});
