-- 0003_transactions.sql
-- Transactions table, category validation trigger, RLS policies, and grants.

CREATE TABLE IF NOT EXISTS public.transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount           NUMERIC NOT NULL,
  currency         public.currency_code NOT NULL DEFAULT 'BDT',
  category_id      UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  description      TEXT,
  transaction_date DATE NOT NULL,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT false,
  is_confirmed     BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Amount integrity: positive, finite, maximum limit, and strict 2 decimal places
  CONSTRAINT chk_amount_valid CHECK (
    amount > 0                              -- rejects zero, negative, -Infinity
    AND amount <= 9999999999999.99::NUMERIC -- rejects +Infinity, NaN, values >= 10^13
    AND amount = ROUND(amount, 2)           -- rejects fractional values beyond 2 decimal places
    AND scale(amount) <= 2                  -- rejects inputs with scale > 2 (e.g. '10.500')
  ),

  CONSTRAINT chk_description_length CHECK (
    description IS NULL OR length(description) <= 500
  )
);

CREATE INDEX IF NOT EXISTS idx_tx_user_date
  ON public.transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_tx_user_category
  ON public.transactions (user_id, category_id);

CREATE INDEX IF NOT EXISTS idx_tx_confirmed
  ON public.transactions (user_id, is_confirmed)
  WHERE is_confirmed = true;

CREATE OR REPLACE FUNCTION public.validate_transaction_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cat_user_id UUID;
  v_cat_type    TEXT;
BEGIN
  -- Plain SELECT. PostgreSQL foreign-key check acquires FOR KEY SHARE to handle concurrency.
  SELECT user_id, type
  INTO   v_cat_user_id, v_cat_type
  FROM   public.categories
  WHERE  id = NEW.category_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'category_not_found'
      USING ERRCODE = 'P0002',
            DETAIL  = 'category_id ' || NEW.category_id::TEXT || ' does not exist';
  END IF;

  -- System categories (user_id IS NULL) are accessible to all authenticated users.
  IF v_cat_user_id IS NOT NULL AND v_cat_user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'category_not_owned'
      USING ERRCODE = 'P0003',
            DETAIL  = 'category belongs to a different user';
  END IF;

  IF v_cat_type <> NEW.type THEN
    RAISE EXCEPTION 'category_type_mismatch'
      USING ERRCODE = 'P0004',
            DETAIL  = 'category type ' || v_cat_type || ' does not match transaction type ' || NEW.type;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.validate_transaction_category() OWNER TO ledgerly_app;
REVOKE ALL ON FUNCTION public.validate_transaction_category() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_validate_transaction_category ON public.transactions;
CREATE TRIGGER trg_validate_transaction_category
  BEFORE INSERT OR UPDATE OF category_id, type
  ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_category();

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_ledgerly_app"
  ON public.transactions FOR INSERT
  TO ledgerly_app
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT INSERT ON public.transactions TO ledgerly_app;
