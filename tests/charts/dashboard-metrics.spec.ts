import { describe, it, expect } from 'vitest';
import { rangeWindow, sumWindow, delta } from '../../apps/web/src/lib/dashboard-metrics';
import type { Transaction } from '../../apps/web/src/lib/api';

const tx = (id: string, date: string, type: 'income' | 'expense', amount: string, currency = 'BDT') =>
  ({ id, transaction_date: date, type, amount, currency }) as Transaction;

// Fixed fixture; expected totals worked out by hand.
const now = new Date(2026, 10, 18, 12); // 18 Nov 2026, noon
const fixture = [
  tx('a', '2026-11-17', 'expense', '300'),
  tx('b', '2026-11-12', 'income', '1000'),
  tx('c', '2026-11-10', 'expense', '200'), // 8 days ago: previous 7d window
  tx('d', '2026-11-05', 'expense', '100'),
  tx('e', '2026-11-15', 'expense', '999', 'USD'), // other currency, never summed
];

describe('dashboard metrics', () => {
  it('splits current and previous 7-day windows', () => {
    const w = rangeWindow('7d', now);
    expect(sumWindow(fixture, 'BDT', w.start, w.end)).toEqual({
      income: 1000, expense: 300, net: 700, count: 2, expenseCount: 1,
    });
    expect(sumWindow(fixture, 'BDT', w.prevStart, w.prevEnd)).toEqual({
      income: 0, expense: 300, net: -300, count: 2, expenseCount: 2,
    });
  });

  it('colours deltas by meaning', () => {
    expect(delta(300, 200, 'lower')).toEqual({ kind: 'pct', pct: 50, tone: 'bad' });
    expect(delta(150, 200, 'lower')).toEqual({ kind: 'pct', pct: -25, tone: 'good' });
    expect(delta(5, 4, 'neutral')).toEqual({ kind: 'pct', pct: 25, tone: 'flat' });
    expect(delta(1000, 0, 'higher')).toEqual({ kind: 'was', prev: 0 });
    expect(delta(700, -300, 'higher')).toEqual({ kind: 'was', prev: -300 });
  });

  it('6m window starts on the first of the month five months back', () => {
    const w = rangeWindow('6m', now);
    expect(w.start).toEqual(new Date(2026, 5, 1));
    expect(w.prevEnd).toEqual(w.start);
  });
});
