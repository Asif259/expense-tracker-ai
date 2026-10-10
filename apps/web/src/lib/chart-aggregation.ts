import { Transaction, Loan } from './api';
import { Category } from './categories';

export type DateRangePreset =
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | '6m'
  | '12m'
  | 'all';

export interface MonthlyCashFlowPoint {
  monthKey: string; // YYYY-MM
  label: string; // e.g. "Jan 2026"
  income: number;
  expense: number;
  net: number;
}

export interface SpendingTrendPoint {
  dateKey: string; // YYYY-MM-DD or YYYY-MM
  label: string;
  spending: number;
  count: number;
}

export interface CategoryBreakdownPoint {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  count: number;
  color?: string | null;
}

export interface LoanPortfolioSummary {
  currency: string;
  totalLent: number;
  totalBorrowed: number;
  repaidLent: number;
  repaidBorrowed: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  activeCount: number;
  settledCount: number;
  overdueCount: number;
}

export interface RepaymentHistoryPoint {
  dateKey: string;
  label: string;
  lentRepaid: number;
  borrowedRepaid: number;
  totalRepaid: number;
  count: number;
}

export interface BudgetItemProgress {
  id: string;
  name: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
  isOverBudget: boolean;
}

/**
 * Filter transactions by currency and date range
 */
export function filterTransactions(
  transactions: Transaction[],
  currency: string,
  range: DateRangePreset,
  customStart?: string,
  customEnd?: string,
  referenceDate?: Date | null
): Transaction[] {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  if (range !== 'all' && referenceDate) {
    const now = referenceDate;
    if (range === '7d') {
      minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      maxDate = new Date(now.getTime());
    } else if (range === '30d') {
      minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      maxDate = new Date(now.getTime());
    } else if (range === 'this_month') {
      minDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'last_month') {
      minDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      maxDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (range === '6m') {
      minDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else if (range === '12m') {
      minDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }
  }

  if (customStart) {
    minDate = new Date(customStart);
  }
  if (customEnd) {
    maxDate = new Date(customEnd);
    maxDate.setHours(23, 59, 59, 999);
  }

  return transactions.filter((tx) => {
    if ((tx.currency || 'BDT') !== currency) return false;
    const txDate = new Date(tx.transaction_date);
    if (isNaN(txDate.getTime())) return false;
    if (minDate && txDate < minDate) return false;
    if (maxDate && txDate > maxDate) return false;
    return true;
  });
}

/**
 * Extract list of distinct currencies from transactions
 */
export function getCurrenciesFromTransactions(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  for (const tx of transactions) {
    if (tx.currency) set.add(tx.currency);
  }
  if (set.size === 0) set.add('BDT');
  return Array.from(set);
}

/**
 * Month formatter: "Jan 2026"
 */
function formatMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Aggregate monthly cash flow (income vs expenses)
 */
export function aggregateMonthlyCashFlow(
  transactions: Transaction[],
  currency: string
): MonthlyCashFlowPoint[] {
  const map = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    if ((tx.currency || 'BDT') !== currency) continue;
    const d = new Date(tx.transaction_date);
    if (isNaN(d.getTime())) continue;

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = map.get(monthKey) || { income: 0, expense: 0 };
    const amt = parseFloat(tx.amount) || 0;

    if (tx.type === 'income') {
      existing.income = Math.round((existing.income + amt) * 100) / 100;
    } else {
      existing.expense = Math.round((existing.expense + amt) * 100) / 100;
    }
    map.set(monthKey, existing);
  }

  const sortedKeys = Array.from(map.keys()).sort();
  return sortedKeys.map((key) => {
    const [year, month] = key.split('-').map(Number);
    const data = map.get(key)!;
    return {
      monthKey: key,
      label: formatMonthLabel(year, month),
      income: data.income,
      expense: data.expense,
      net: Math.round((data.income - data.expense) * 100) / 100,
    };
  });
}

/**
 * Aggregate spending trends over time
 */
export function aggregateSpendingTrend(
  transactions: Transaction[],
  currency: string,
  range: DateRangePreset = '30d',
  referenceDate?: Date | null
): SpendingTrendPoint[] {
  const filtered = filterTransactions(transactions, currency, range, undefined, undefined, referenceDate).filter(
    (tx) => tx.type === 'expense'
  );

  const isDaily = range === '7d' || range === '30d' || range === 'this_month' || range === 'last_month';
  const map = new Map<string, { spending: number; count: number }>();

  for (const tx of filtered) {
    const d = new Date(tx.transaction_date);
    if (isNaN(d.getTime())) continue;

    const key = isDaily
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const existing = map.get(key) || { spending: 0, count: 0 };
    const amt = parseFloat(tx.amount) || 0;
    existing.spending = Math.round((existing.spending + amt) * 100) / 100;
    existing.count += 1;
    map.set(key, existing);
  }

  const sortedKeys = Array.from(map.keys()).sort();
  return sortedKeys.map((key) => {
    let label = key;
    if (isDaily) {
      const parts = key.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      const parts = key.split('-').map(Number);
      label = formatMonthLabel(parts[0], parts[1]);
    }

    const item = map.get(key)!;
    return {
      dateKey: key,
      label,
      spending: item.spending,
      count: item.count,
    };
  });
}

/**
 * Aggregate expense category breakdown
 */
export function aggregateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  currency: string
): CategoryBreakdownPoint[] {
  const catMap = new Map<string, Category>();
  for (const c of categories) {
    catMap.set(c.id, c);
  }

  const expenseTx = transactions.filter(
    (tx) => tx.type === 'expense' && (tx.currency || 'BDT') === currency
  );

  let totalExpense = 0;
  const groups = new Map<string, { amount: number; count: number; name: string; color?: string | null }>();

  for (const tx of expenseTx) {
    const amt = parseFloat(tx.amount) || 0;
    totalExpense += amt;
    const cat = catMap.get(tx.category_id);
    const catId = cat ? cat.id : 'uncategorized';
    const catName = cat ? cat.name : 'Uncategorized';
    const existing = groups.get(catId) || {
      amount: 0,
      count: 0,
      name: catName,
      color: cat?.color,
    };
    existing.amount = Math.round((existing.amount + amt) * 100) / 100;
    existing.count += 1;
    groups.set(catId, existing);
  }

  if (totalExpense === 0) return [];

  const points: CategoryBreakdownPoint[] = [];
  for (const [id, data] of groups.entries()) {
    const pct = totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0;
    points.push({
      categoryId: id,
      categoryName: data.name,
      amount: data.amount,
      percentage: pct,
      count: data.count,
      color: data.color,
    });
  }

  // Sort descending by amount
  return points.sort((a, b) => b.amount - a.amount);
}

/**
 * Aggregate Loan portfolio by currency
 */
export function aggregateLoanPortfolio(
  loans: Loan[],
  currency: string
): LoanPortfolioSummary {
  const curLoans = loans.filter((l) => (l.currency || 'BDT') === currency);

  let totalLent = 0;
  let totalBorrowed = 0;
  let repaidLent = 0;
  let repaidBorrowed = 0;
  let outstandingReceivables = 0;
  let outstandingPayables = 0;
  let activeCount = 0;
  let settledCount = 0;
  let overdueCount = 0;

  for (const l of curLoans) {
    const principal = Number(l.principal_amount) || 0;
    const repaid = Number(l.total_repaid) || 0;
    const outstanding = Number(l.outstanding_balance) || 0;

    if (l.status === 'active') activeCount++;
    else if (l.status === 'settled') settledCount++;
    else if (l.status === 'overdue') overdueCount++;

    if (l.direction === 'lent') {
      totalLent += principal;
      repaidLent += repaid;
      outstandingReceivables += outstanding;
    } else {
      totalBorrowed += principal;
      repaidBorrowed += repaid;
      outstandingPayables += outstanding;
    }
  }

  return {
    currency,
    totalLent: Math.round(totalLent * 100) / 100,
    totalBorrowed: Math.round(totalBorrowed * 100) / 100,
    repaidLent: Math.round(repaidLent * 100) / 100,
    repaidBorrowed: Math.round(repaidBorrowed * 100) / 100,
    outstandingReceivables: Math.round(outstandingReceivables * 100) / 100,
    outstandingPayables: Math.round(outstandingPayables * 100) / 100,
    activeCount,
    settledCount,
    overdueCount,
  };
}

/**
 * Aggregate repayment records chronologically
 */
export function aggregateRepaymentHistory(
  loans: Loan[],
  currency: string
): RepaymentHistoryPoint[] {
  const curLoans = loans.filter((l) => (l.currency || 'BDT') === currency);
  const map = new Map<string, { lent: number; borrowed: number; count: number }>();

  for (const loan of curLoans) {
    if (!loan.repayments || loan.repayments.length === 0) continue;
    for (const r of loan.repayments) {
      const d = new Date(r.payment_date);
      if (isNaN(d.getTime())) continue;

      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const amt = Number(r.amount) || 0;
      const existing = map.get(dateKey) || { lent: 0, borrowed: 0, count: 0 };

      if (loan.direction === 'lent') {
        existing.lent += amt;
      } else {
        existing.borrowed += amt;
      }
      existing.count += 1;
      map.set(dateKey, existing);
    }
  }

  const sortedKeys = Array.from(map.keys()).sort();
  return sortedKeys.map((key) => {
    const parts = key.split('-').map(Number);
    const data = map.get(key)!;
    return {
      dateKey: key,
      label: formatMonthLabel(parts[0], parts[1]),
      lentRepaid: Math.round(data.lent * 100) / 100,
      borrowedRepaid: Math.round(data.borrowed * 100) / 100,
      totalRepaid: Math.round((data.lent + data.borrowed) * 100) / 100,
      count: data.count,
    };
  });
}

/**
 * Aggregate budget progress (spent vs limit)
 */
export function aggregateBudgetProgress(
  transactions: Transaction[],
  budgets: Array<{ id: string; name: string; limit_amount: number; category_id?: string | null; currency?: string }>,
  currency: string
): BudgetItemProgress[] {
  const expenseTx = transactions.filter(
    (tx) => tx.type === 'expense' && (tx.currency || 'BDT') === currency
  );

  return budgets
    .filter((b) => (b.currency || 'BDT') === currency)
    .map((b) => {
      let spent = 0;
      if (b.category_id) {
        spent = expenseTx
          .filter((tx) => tx.category_id === b.category_id)
          .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      } else {
        // Overall budget
        spent = expenseTx.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      }

      const limit = Number(b.limit_amount) || 0;
      const roundedSpent = Math.round(spent * 100) / 100;
      const remaining = Math.round((limit - roundedSpent) * 100) / 100;
      const percent = limit > 0 ? Math.round((roundedSpent / limit) * 100) : 0;

      return {
        id: b.id,
        name: b.name,
        limit,
        spent: roundedSpent,
        remaining,
        percent,
        isOverBudget: roundedSpent > limit,
      };
    });
}
