import { z } from 'zod';
export const SUPPORTED_CURRENCIES = [
    'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
    'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB',
];
export const currencySchema = z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: 'Currency is not supported' }),
});
export function isSupportedCurrency(currency) {
    return SUPPORTED_CURRENCIES.includes(currency);
}
