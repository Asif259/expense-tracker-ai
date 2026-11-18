import type { Transaction } from './api';

export type KpiRange = '7d' | '30d' | '6m';

export interface Window {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

const DAY = 24 * 60 * 60 * 1000;

/** Current window plus a previous window of the same elapsed length, ending where this one starts. */
export function rangeWindow(range: KpiRange, now: Date): Window {
  const end = now;
  const start =
    range === '6m'
      ? new Date(now.getFullYear(), now.getMonth() - 5, 1)
      : new Date(now.getTime() - (range === '7d' ? 7 : 30) * DAY);
  const span = end.getTime() - start.getTime();
  return { start, end, prevStart: new Date(start.getTime() - span), prevEnd: start };
}

/** Earliest date the dashboard needs: the start of the previous 6-month window, rounded to a month. */
export function fetchStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() - 11, 1);
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
  count: number;
  expenseCount: number;
}

/** Sums one currency's transactions with start <= date < end. */
export function sumWindow(txs: Transaction[], currency: string, start: Date, end: Date): Totals {
  const t: Totals = { income: 0, expense: 0, net: 0, count: 0, expenseCount: 0 };
  for (const tx of txs) {
    if ((tx.currency || 'BDT') !== currency) continue;
    const d = parseTxDate(tx.transaction_date);
    if (!d || d < start || d >= end) continue;
    const amt = parseFloat(tx.amount) || 0;
    if (tx.type === 'income') t.income += amt;
    else {
      t.expense += amt;
      t.expenseCount += 1;
    }
    t.count += 1;
  }
  // Round to cents so float noise never shows as a red −0.00.
  t.income = Math.round(t.income * 100) / 100;
  t.expense = Math.round(t.expense * 100) / 100;
  t.net = Math.round((t.income - t.expense) * 100) / 100;
  return t;
}

/** `YYYY-MM-DD` reads as local midnight, not UTC, so a day never slips across a window edge. */
export function parseTxDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export type Delta =
  | { kind: 'pct'; pct: number; tone: 'good' | 'bad' | 'flat' }
  | { kind: 'was'; prev: number }
  | { kind: 'none' };

/**
 * Change vs the previous window. `better` says which direction is good:
 * 'higher' (income, net), 'lower' (spending), or 'neutral' (counts).
 * A previous value of 0 has no meaningful percent, so it reads "was 0".
 */
export function delta(cur: number, prev: number, better: 'higher' | 'lower' | 'neutral'): Delta {
  if (prev === 0 || (cur !== 0 && Math.sign(prev) !== Math.sign(cur))) return { kind: 'was', prev };
  const pct = Math.round(((cur - prev) / Math.abs(prev)) * 100);
  if (pct === 0 || better === 'neutral') return { kind: 'pct', pct, tone: 'flat' };
  const good = better === 'higher' ? pct > 0 : pct < 0;
  return { kind: 'pct', pct, tone: good ? 'good' : 'bad' };
}
