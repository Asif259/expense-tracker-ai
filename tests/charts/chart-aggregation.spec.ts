import { describe, it, expect } from 'vitest';
import {
  aggregateMonthlyCashFlow,
  aggregateSpendingTrend,
  aggregateCategoryBreakdown,
  aggregateLoanPortfolio,
  aggregateRepaymentHistory,
  aggregateBudgetProgress,
  getCurrenciesFromTransactions,
  filterTransactions,
} from '../../apps/web/src/lib/chart-aggregation';
import { getChartPalette, getBaseChartOptions } from '../../apps/web/src/lib/chart-theme';
import type { Transaction, Loan } from '../../apps/web/src/lib/api';
import type { Category } from '../../apps/web/src/lib/categories';

describe('Chart.js Financial Data Aggregation', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      user_id: 'user-1',
      type: 'income',
      amount: '50000.00',
      currency: 'BDT',
      category_id: 'cat-salary',
      description: 'Monthly Salary',
      transaction_date: '2026-01-05T00:00:00Z',
      is_ai_generated: false,
      is_confirmed: true,
      created_at: '2026-01-05T00:00:00Z',
      updated_at: '2026-01-05T00:00:00Z',
    },
    {
      id: 'tx-2',
      user_id: 'user-1',
      type: 'expense',
      amount: '15000.50',
      currency: 'BDT',
      category_id: 'cat-rent',
      description: 'Apartment Rent',
      transaction_date: '2026-01-08T00:00:00Z',
      is_ai_generated: false,
      is_confirmed: true,
      created_at: '2026-01-08T00:00:00Z',
      updated_at: '2026-01-08T00:00:00Z',
    },
    {
      id: 'tx-3',
      user_id: 'user-1',
      type: 'expense',
      amount: '4500.25',
      currency: 'BDT',
      category_id: 'cat-groceries',
      description: 'Supermarket Groceries',
      transaction_date: '2026-01-15T00:00:00Z',
      is_ai_generated: false,
      is_confirmed: true,
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    },
    {
      id: 'tx-4',
      user_id: 'user-1',
      type: 'income',
      amount: '52000.00',
      currency: 'BDT',
      category_id: 'cat-salary',
      description: 'February Salary',
      transaction_date: '2026-02-05T00:00:00Z',
      is_ai_generated: false,
      is_confirmed: true,
      created_at: '2026-02-05T00:00:00Z',
      updated_at: '2026-02-05T00:00:00Z',
    },
    {
      id: 'tx-5',
      user_id: 'user-1',
      type: 'expense',
      amount: '30000.00',
      currency: 'BDT',
      category_id: 'cat-rent',
      description: 'February Rent + Maintenance',
      transaction_date: '2026-02-08T00:00:00Z',
      is_ai_generated: false,
      is_confirmed: true,
      created_at: '2026-02-08T00:00:00Z',
      updated_at: '2026-02-08T00:00:00Z',
    },
    // Distinct USD transaction
    {
      id: 'tx-6',
      user_id: 'user-1',
      type: 'income',
      amount: '1200.00',
      currency: 'USD',
      category_id: 'cat-freelance',
      description: 'US Consulting Client',
      transaction_date: '2026-02-10T00:00:00Z',
      is_ai_generated: false,
      is_confirmed: true,
      created_at: '2026-02-10T00:00:00Z',
      updated_at: '2026-02-10T00:00:00Z',
    },
  ];

  const sampleCategories: Category[] = [
    { id: 'cat-salary', name: 'Salary', type: 'income', color: '#6DD0A1' },
    { id: 'cat-rent', name: 'Housing & Rent', type: 'expense', color: '#F5C258' },
    { id: 'cat-groceries', name: 'Groceries', type: 'expense', color: '#6CB3F9' },
    { id: 'cat-freelance', name: 'Consulting', type: 'income', color: '#00D6C8' },
  ];

  describe('Currency Isolation', () => {
    it('extracts all unique currencies present without duplicates', () => {
      const currencies = getCurrenciesFromTransactions(sampleTransactions);
      expect(currencies).toContain('BDT');
      expect(currencies).toContain('USD');
      expect(currencies.length).toBe(2);
    });

    it('defaults to BDT when transaction list is empty', () => {
      const currencies = getCurrenciesFromTransactions([]);
      expect(currencies).toEqual(['BDT']);
    });

    it('never blends USD amounts into BDT aggregations', () => {
      const bdtCashFlow = aggregateMonthlyCashFlow(sampleTransactions, 'BDT');
      const usdCashFlow = aggregateMonthlyCashFlow(sampleTransactions, 'USD');

      // BDT February income should only be 52000, not 52000 + 1200
      const febBdt = bdtCashFlow.find((p) => p.monthKey === '2026-02');
      expect(febBdt?.income).toBe(52000);

      // USD February income should only be 1200
      const febUsd = usdCashFlow.find((p) => p.monthKey === '2026-02');
      expect(febUsd?.income).toBe(1200);
      expect(febUsd?.expense).toBe(0);
    });
  });

  describe('aggregateMonthlyCashFlow', () => {
    it('calculates accurate monthly income, expense and net cash flow chronologically', () => {
      const points = aggregateMonthlyCashFlow(sampleTransactions, 'BDT');
      expect(points.length).toBe(2);

      expect(points[0].monthKey).toBe('2026-01');
      expect(points[0].income).toBe(50000);
      expect(points[0].expense).toBe(19500.75); // 15000.50 + 4500.25
      expect(points[0].net).toBe(30499.25);

      expect(points[1].monthKey).toBe('2026-02');
      expect(points[1].income).toBe(52000);
      expect(points[1].expense).toBe(30000);
      expect(points[1].net).toBe(22000);
    });

    it('handles empty datasets cleanly with empty array', () => {
      const points = aggregateMonthlyCashFlow([], 'BDT');
      expect(points).toEqual([]);
    });

    it('supports deficit net values when expenses exceed income', () => {
      const deficitTx: Transaction[] = [
        {
          id: 'def-1',
          user_id: 'u1',
          type: 'income',
          amount: '1000.00',
          currency: 'EUR',
          category_id: 'cat-1',
          description: null,
          transaction_date: '2026-03-01T00:00:00Z',
          is_ai_generated: false,
          is_confirmed: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
        {
          id: 'def-2',
          user_id: 'u1',
          type: 'expense',
          amount: '3500.00',
          currency: 'EUR',
          category_id: 'cat-2',
          description: null,
          transaction_date: '2026-03-10T00:00:00Z',
          is_ai_generated: false,
          is_confirmed: true,
          created_at: '2026-03-10T00:00:00Z',
          updated_at: '2026-03-10T00:00:00Z',
        },
      ];
      const points = aggregateMonthlyCashFlow(deficitTx, 'EUR');
      expect(points[0].net).toBe(-2500);
    });
  });

  describe('aggregateSpendingTrend', () => {
    it('aggregates daily expenses in chronological order', () => {
      // Monthly aggregation for 'all'
      const monthlyTrend = aggregateSpendingTrend(sampleTransactions, 'BDT', 'all');
      expect(monthlyTrend.length).toBe(2); // 2026-01 and 2026-02
      expect(monthlyTrend[0].spending).toBe(19500.75);
      expect(monthlyTrend[1].spending).toBe(30000);

      // Daily aggregation for '30d' with a reference date
      const refDate = new Date('2026-01-20T00:00:00Z');
      const dailyTrend = aggregateSpendingTrend(sampleTransactions, 'BDT', '30d', refDate);
      expect(dailyTrend.length).toBe(2); // 2026-01-08 and 2026-01-15
      expect(dailyTrend[0].spending).toBe(15000.5);
      expect(dailyTrend[1].spending).toBe(4500.25);
    });

    it('excludes income transactions from spending trend', () => {
      const trend = aggregateSpendingTrend(sampleTransactions, 'USD', 'all');
      // Tx 6 is USD income, no USD expenses exist
      expect(trend.length).toBe(0);
    });
  });

  describe('aggregateCategoryBreakdown', () => {
    it('calculates category sums and percentages accurately', () => {
      const breakdown = aggregateCategoryBreakdown(sampleTransactions, sampleCategories, 'BDT');
      expect(breakdown.length).toBe(2);

      // Rent: 15000.50 + 30000 = 45000.50
      // Groceries: 4500.25
      // Total: 49500.75
      expect(breakdown[0].categoryName).toBe('Housing & Rent');
      expect(breakdown[0].amount).toBe(45000.5);
      expect(breakdown[0].percentage).toBe(91);

      expect(breakdown[1].categoryName).toBe('Groceries');
      expect(breakdown[1].amount).toBe(4500.25);
      expect(breakdown[1].percentage).toBe(9);
    });

    it('handles uncategorized transactions gracefully', () => {
      const uncategorizedTx: Transaction[] = [
        {
          id: 'u-1',
          user_id: 'u1',
          type: 'expense',
          amount: '2000.00',
          currency: 'BDT',
          category_id: 'unknown-cat-id',
          description: 'Misc cash',
          transaction_date: '2026-01-01T00:00:00Z',
          is_ai_generated: false,
          is_confirmed: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];
      const breakdown = aggregateCategoryBreakdown(uncategorizedTx, sampleCategories, 'BDT');
      expect(breakdown.length).toBe(1);
      expect(breakdown[0].categoryName).toBe('Uncategorized');
      expect(breakdown[0].amount).toBe(2000);
      expect(breakdown[0].percentage).toBe(100);
    });
  });

  describe('Debt & Loans Aggregation', () => {
    const sampleLoans: Loan[] = [
      {
        id: 'loan-1',
        user_id: 'u1',
        person_name: 'Alice Rahman',
        person_contact: null,
        direction: 'lent',
        principal_amount: 25000,
        currency: 'BDT',
        payment_method: 'bkash',
        loan_date: '2026-01-10T00:00:00Z',
        due_date: '2026-04-10T00:00:00Z',
        notes: null,
        total_repaid: 10000,
        outstanding_balance: 15000,
        progress_pct: 40,
        status: 'active',
        created_at: '2026-01-10T00:00:00Z',
        updated_at: '2026-01-10T00:00:00Z',
        repayments: [
          {
            id: 'rep-1',
            loan_id: 'loan-1',
            user_id: 'u1',
            amount: 5000,
            payment_date: '2026-01-25T00:00:00Z',
            payment_method: 'bkash',
            reference: 'Trx123',
            notes: null,
            created_at: '2026-01-25T00:00:00Z',
          },
          {
            id: 'rep-2',
            loan_id: 'loan-1',
            user_id: 'u1',
            amount: 5000,
            payment_date: '2026-02-25T00:00:00Z',
            payment_method: 'bkash',
            reference: 'Trx456',
            notes: null,
            created_at: '2026-02-25T00:00:00Z',
          },
        ],
      },
      {
        id: 'loan-2',
        user_id: 'u1',
        person_name: 'Bob Hossain',
        person_contact: null,
        direction: 'borrowed',
        principal_amount: 12000,
        currency: 'BDT',
        payment_method: 'bank',
        loan_date: '2026-01-12T00:00:00Z',
        due_date: '2026-03-12T00:00:00Z',
        notes: null,
        total_repaid: 4000,
        outstanding_balance: 8000,
        progress_pct: 33.3,
        status: 'active',
        created_at: '2026-01-12T00:00:00Z',
        updated_at: '2026-01-12T00:00:00Z',
        repayments: [
          {
            id: 'rep-3',
            loan_id: 'loan-2',
            user_id: 'u1',
            amount: 4000,
            payment_date: '2026-02-15T00:00:00Z',
            payment_method: 'bank',
            reference: 'IB888',
            notes: null,
            created_at: '2026-02-15T00:00:00Z',
          },
        ],
      },
    ];

    it('aggregates portfolio liabilities and receivables accurately', () => {
      const summary = aggregateLoanPortfolio(sampleLoans, 'BDT');
      expect(summary.totalLent).toBe(25000);
      expect(summary.repaidLent).toBe(10000);
      expect(summary.outstandingReceivables).toBe(15000);

      expect(summary.totalBorrowed).toBe(12000);
      expect(summary.repaidBorrowed).toBe(4000);
      expect(summary.outstandingPayables).toBe(8000);

      expect(summary.activeCount).toBe(2);
      expect(summary.settledCount).toBe(0);
    });

    it('aggregates chronological repayment velocity from actual repayment history', () => {
      const history = aggregateRepaymentHistory(sampleLoans, 'BDT');
      expect(history.length).toBe(2);

      // January 2026: 5000 lent repaid
      expect(history[0].monthKey || history[0].dateKey).toBe('2026-01');
      expect(history[0].lentRepaid).toBe(5000);
      expect(history[0].borrowedRepaid).toBe(0);
      expect(history[0].totalRepaid).toBe(5000);

      // February 2026: 5000 lent repaid + 4000 borrowed repaid = 9000 total
      expect(history[1].monthKey || history[1].dateKey).toBe('2026-02');
      expect(history[1].lentRepaid).toBe(5000);
      expect(history[1].borrowedRepaid).toBe(4000);
      expect(history[1].totalRepaid).toBe(9000);
    });
  });

  describe('Budget Progress Aggregation', () => {
    it('compares actual category spending against configured budget limits', () => {
      const budgets = [
        { id: 'b-1', name: 'Housing Budget', limit_amount: 50000, category_id: 'cat-rent', currency: 'BDT' },
        { id: 'b-2', name: 'Groceries Budget', limit_amount: 4000, category_id: 'cat-groceries', currency: 'BDT' },
      ];

      const progress = aggregateBudgetProgress(sampleTransactions, budgets, 'BDT');
      expect(progress.length).toBe(2);

      // Rent: spent 45000.50 against 50000 limit -> not over budget
      const rentProg = progress.find((p) => p.name === 'Housing Budget')!;
      expect(rentProg.spent).toBe(45000.5);
      expect(rentProg.limit).toBe(50000);
      expect(rentProg.remaining).toBe(4999.5);
      expect(rentProg.isOverBudget).toBe(false);

      // Groceries: spent 4500.25 against 4000 limit -> over budget
      const grocProg = progress.find((p) => p.name === 'Groceries Budget')!;
      expect(grocProg.spent).toBe(4500.25);
      expect(grocProg.limit).toBe(4000);
      expect(grocProg.remaining).toBe(-500.25);
      expect(grocProg.isOverBudget).toBe(true);
    });
  });

  describe('Chart Theme & Strict Financial Number Styling', () => {
    it('uses strictly neutral primary text color #111111 for light mode', () => {
      const lightPalette = getChartPalette('light');
      expect(lightPalette.textPrimary).toBe('#111111');
      expect(lightPalette.cardBg).toBe('#FFFFFF');
      expect(lightPalette.canvasBg).toBe('#F9FBFC');
      expect(lightPalette.income).toBe('#6DD0A1');
      expect(lightPalette.expense).toBe('#F5C258');
    });

    it('uses strictly neutral primary text color #F4F4F4 for dark mode', () => {
      const darkPalette = getChartPalette('dark');
      expect(darkPalette.textPrimary).toBe('#F4F4F4');
      expect(darkPalette.cardBg).toBe('#1C1C1F');
      expect(darkPalette.canvasBg).toBe('#0B0B0B');
      expect(darkPalette.income).toBe('#6DD0A1');
      expect(darkPalette.expense).toBe('#F5C258');
    });

    it('configures tooltip to render body and title in neutral text tokens', () => {
      const lightOpts = getBaseChartOptions('light', 'BDT');
      expect(lightOpts.plugins?.tooltip?.titleColor).toBe('#111111');
      expect(lightOpts.plugins?.tooltip?.bodyColor).toBe('#111111');

      const darkOpts = getBaseChartOptions('dark', 'BDT');
      expect(darkOpts.plugins?.tooltip?.titleColor).toBe('#F4F4F4');
      expect(darkOpts.plugins?.tooltip?.bodyColor).toBe('#F4F4F4');
    });
  });
});
