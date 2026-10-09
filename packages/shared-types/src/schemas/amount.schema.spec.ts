import { describe, it, expect } from 'vitest';
import { amountSchema, MAX_AMOUNT, MAX_AMOUNT_STRING } from './amount.schema.js';

describe('amountSchema regression test suite', () => {
  describe('Valid inputs', () => {
    it('accepts valid 2-decimal string "10.99"', () => {
      const result = amountSchema.safeParse('10.99');
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe('10.99');
    });

    it('accepts valid 2-decimal number 10.99 and normalizes to string "10.99"', () => {
      const result = amountSchema.safeParse(10.99);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe('10.99');
    });

    it('accepts string "10.5"', () => {
      const result = amountSchema.safeParse('10.5');
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe('10.5');
    });

    it('accepts number 10.5 and normalizes to string "10.5"', () => {
      const result = amountSchema.safeParse(10.5);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe('10.5');
    });

    it('accepts numeric 10.500 (evaluated by JS runtime as 10.5) and normalizes to string "10.5"', () => {
      const result = amountSchema.safeParse(10.500);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe('10.5');
    });

    it('accepts maximum supported amount as string and number', () => {
      const resStr = amountSchema.safeParse(MAX_AMOUNT_STRING);
      expect(resStr.success).toBe(true);
      if (resStr.success) expect(resStr.data).toBe(MAX_AMOUNT_STRING);

      const resNum = amountSchema.safeParse(MAX_AMOUNT);
      expect(resNum.success).toBe(true);
      if (resNum.success) expect(resNum.data).toBe(MAX_AMOUNT_STRING);
    });
  });

  describe('Invalid inputs', () => {
    it('rejects string "10.500" due to lexical scale of 3 decimal places', () => {
      const result = amountSchema.safeParse('10.500');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 2 decimal places');
      }
    });

    it('rejects string "10.999" due to 3 decimal places', () => {
      const result = amountSchema.safeParse('10.999');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 2 decimal places');
      }
    });

    it('rejects numeric 10.999 due to 3 decimal places', () => {
      const result = amountSchema.safeParse(10.999);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 2 decimal places');
      }
    });

    it('rejects zero as number and string', () => {
      expect(amountSchema.safeParse(0).success).toBe(false);
      expect(amountSchema.safeParse('0').success).toBe(false);
    });

    it('rejects negative amounts as number and string', () => {
      expect(amountSchema.safeParse(-5).success).toBe(false);
      expect(amountSchema.safeParse('-5').success).toBe(false);
      expect(amountSchema.safeParse('-10.99').success).toBe(false);
    });

    it('rejects values exceeding the maximum amount', () => {
      expect(amountSchema.safeParse(10_000_000_000_000).success).toBe(false);
      expect(amountSchema.safeParse('10000000000000.00').success).toBe(false);
    });

    it('rejects surrounding whitespace rather than silently trimming it', () => {
      const resLeading = amountSchema.safeParse(' 10.99');
      expect(resLeading.success).toBe(false);
      if (!resLeading.success) {
        expect(resLeading.error.issues[0].message).toContain('surrounding whitespace');
      }

      const resTrailing = amountSchema.safeParse('10.99 ');
      expect(resTrailing.success).toBe(false);
      if (!resTrailing.success) {
        expect(resTrailing.error.issues[0].message).toContain('surrounding whitespace');
      }
    });

    it('rejects non-numeric strings, NaN, and Infinity', () => {
      expect(amountSchema.safeParse('abc').success).toBe(false);
      expect(amountSchema.safeParse(NaN).success).toBe(false);
      expect(amountSchema.safeParse(Infinity).success).toBe(false);
      expect(amountSchema.safeParse(-Infinity).success).toBe(false);
    });
  });
});
