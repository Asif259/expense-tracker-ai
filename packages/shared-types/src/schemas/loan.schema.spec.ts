import { describe, it, expect } from 'vitest';
import {
  createLoanSchema,
  updateLoanSchema,
  recordRepaymentSchema,
} from './loan.schema.js';

describe('Loan Schemas', () => {
  describe('createLoanSchema', () => {
    it('accepts valid lent loan with due date', () => {
      const result = createLoanSchema.safeParse({
        person_name: 'Rahim',
        person_contact: '+8801700000000',
        direction: 'lent',
        principal_amount: '1000.00',
        currency: 'BDT',
        payment_method: 'bkash',
        loan_date: '2026-10-10',
        due_date: '2026-10-15',
        notes: 'Personal loan',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid borrowed loan without due date', () => {
      const result = createLoanSchema.safeParse({
        person_name: 'Karim',
        direction: 'borrowed',
        principal_amount: 500,
        currency: 'USD',
        payment_method: 'cash',
        loan_date: '2026-10-10',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid direction', () => {
      const result = createLoanSchema.safeParse({
        person_name: 'Rahim',
        direction: 'invested',
        principal_amount: '100.00',
        payment_method: 'cash',
        loan_date: '2026-10-10',
      });
      expect(result.success).toBe(false);
    });

    it('rejects scale > 2 in principal_amount', () => {
      const result = createLoanSchema.safeParse({
        person_name: 'Rahim',
        direction: 'lent',
        principal_amount: '100.555',
        payment_method: 'cash',
        loan_date: '2026-10-10',
      });
      expect(result.success).toBe(false);
    });

    it('rejects due_date earlier than loan_date', () => {
      const result = createLoanSchema.safeParse({
        person_name: 'Rahim',
        direction: 'lent',
        principal_amount: '100.00',
        payment_method: 'cash',
        loan_date: '2026-10-10',
        due_date: '2026-10-05',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Expected repayment date cannot be earlier');
      }
    });

    it('rejects invalid calendar dates like February 30', () => {
      const result = createLoanSchema.safeParse({
        person_name: 'Rahim',
        direction: 'lent',
        principal_amount: '100.00',
        payment_method: 'cash',
        loan_date: '2026-02-30',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('recordRepaymentSchema', () => {
    it('accepts valid repayment with reference', () => {
      const result = recordRepaymentSchema.safeParse({
        amount: '250.00',
        payment_date: '2026-10-12',
        payment_method: 'nagad',
        reference: 'TXN123456',
        notes: 'Partial payment',
      });
      expect(result.success).toBe(true);
    });

    it('rejects zero or negative repayment', () => {
      const resultZero = recordRepaymentSchema.safeParse({
        amount: '0.00',
        payment_date: '2026-10-12',
        payment_method: 'cash',
      });
      expect(resultZero.success).toBe(false);

      const resultNeg = recordRepaymentSchema.safeParse({
        amount: '-50.00',
        payment_date: '2026-10-12',
        payment_method: 'cash',
      });
      expect(resultNeg.success).toBe(false);
    });

    it('rejects invalid payment method', () => {
      const result = recordRepaymentSchema.safeParse({
        amount: '50.00',
        payment_date: '2026-10-12',
        payment_method: 'crypto',
      });
      expect(result.success).toBe(false);
    });
  });
});
