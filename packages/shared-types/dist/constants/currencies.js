export const SUPPORTED_CURRENCIES = [
    'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
    'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB',
];
export function isSupportedCurrency(currency) {
    return SUPPORTED_CURRENCIES.includes(currency);
}
