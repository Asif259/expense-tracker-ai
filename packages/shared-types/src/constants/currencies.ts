import { z } from 'zod';

export const SUPPORTED_CURRENCIES = [
  'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
  'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const currencySchema = z.enum(SUPPORTED_CURRENCIES, {
  errorMap: () => ({ message: 'Currency is not supported' }),
});

export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(currency);
}

