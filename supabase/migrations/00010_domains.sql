-- 0001b_domains.sql
-- Currency code domain type restricting values to the 15 supported ISO codes.

CREATE DOMAIN public.currency_code AS CHAR(3)
  CONSTRAINT chk_currency_supported CHECK (VALUE IN (
    'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
    'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB'
  ));

ALTER TABLE public.profiles
  ALTER COLUMN default_currency TYPE public.currency_code;
