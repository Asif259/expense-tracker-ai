const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  SGD: 'S$',
  INR: '₹',
  CNY: '¥',
  AED: 'د.إ',
  CHF: 'CHF',
  HKD: 'HK$',
  MYR: 'RM',
  THB: '฿',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY']);

/**
 * Formats a monetary amount for display.
 * Uses string representation to avoid floating-point rounding.
 */
export function formatMoney(amount: string | number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const str = String(amount);

  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    // Strip decimals for zero-decimal currencies
    const intPart = str.split('.')[0];
    return `${symbol}${Number(intPart).toLocaleString()}`;
  }

  // Ensure two decimal places for display
  const parts = str.split('.');
  const intPart = Number(parts[0]).toLocaleString();
  const decPart = (parts[1] || '00').padEnd(2, '0').slice(0, 2);
  return `${symbol}${intPart}.${decPart}`;
}

/**
 * Format a YYYY-MM-DD date string for display.
 */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get today's date as YYYY-MM-DD in local timezone.
 */
export function todayLocal(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export const SUPPORTED_CURRENCIES = [
  'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
  'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB',
] as const;
