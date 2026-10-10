export declare const SUPPORTED_CURRENCIES: readonly ["BDT", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "INR", "CNY", "AED", "CHF", "HKD", "MYR", "THB"];
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export declare function isSupportedCurrency(currency: string): currency is SupportedCurrency;
