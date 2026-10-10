import { describe, it, expect } from 'vitest';
import { createAiDraftSchema } from './ai-draft.schema.js';

describe('createAiDraftSchema validation', () => {
  const validDraft = {
    type: 'expense' as const,
    amount: '45.00',
    currency: 'USD' as const,
    category_id: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Coffee and snacks',
    transaction_date: '2026-03-15',
  };

  it('accepts valid draft payload', () => {
    const result = createAiDraftSchema.safeParse(validDraft);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe('45.00');
      expect(result.data.currency).toBe('USD');
    }
  });

  it('defaults currency to BDT if omitted', () => {
    const { currency, ...withoutCurrency } = validDraft;
    const result = createAiDraftSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('BDT');
    }
  });

  describe('amount precision and boundary regression tests', () => {
    it('accepts exact boundary amount 9999999999999.99', () => {
      const result = createAiDraftSchema.safeParse({
        ...validDraft,
        amount: '9999999999999.99',
      });
      expect(result.success).toBe(true);
    });

    it('rejects amount above max 10000000000000.00', () => {
      const result = createAiDraftSchema.safeParse({
        ...validDraft,
        amount: '10000000000000.00',
      });
      expect(result.success).toBe(false);
    });

    it('rejects excess decimal places like 10.999 and 10.555', () => {
      expect(createAiDraftSchema.safeParse({ ...validDraft, amount: '10.999' }).success).toBe(false);
      expect(createAiDraftSchema.safeParse({ ...validDraft, amount: '10.555' }).success).toBe(false);
      expect(createAiDraftSchema.safeParse({ ...validDraft, amount: 10.999 }).success).toBe(false);
    });

    it('rejects zero and negative amounts', () => {
      expect(createAiDraftSchema.safeParse({ ...validDraft, amount: '0' }).success).toBe(false);
      expect(createAiDraftSchema.safeParse({ ...validDraft, amount: '-0.01' }).success).toBe(false);
      expect(createAiDraftSchema.safeParse({ ...validDraft, amount: 0 }).success).toBe(false);
    });

    it('rejects non-finite values (NaN, Infinity)', () => {
      expect(createAiDraftSchema.safeParse({ ...validDraft, amount: Number.NaN }).success).toBe(false);
      expect(createAiDraftSchema.safeParse({ ...validDraft, amount: Number.POSITIVE_INFINITY }).success).toBe(false);
    });
  });

  describe('currency allowlist validation', () => {
    const supported = [
      'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
      'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB',
    ];

    it.each(supported)('accepts supported currency %s', (curr) => {
      const result = createAiDraftSchema.safeParse({ ...validDraft, currency: curr });
      expect(result.success).toBe(true);
    });

    it('rejects unsupported currency ABC', () => {
      const result = createAiDraftSchema.safeParse({ ...validDraft, currency: 'ABC' });
      expect(result.success).toBe(false);
    });
  });
});
