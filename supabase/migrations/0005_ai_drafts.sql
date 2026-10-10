-- 0005_ai_drafts.sql
-- AI draft transactions table, create_ai_draft and confirm_ai_draft RPC functions, RLS, and grants.

CREATE TABLE IF NOT EXISTS public.ai_draft_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payload    JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_drafts_user
  ON public.ai_draft_transactions (user_id);

ALTER TABLE public.ai_draft_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drafts_select_own"
  ON public.ai_draft_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "drafts_delete_own"
  ON public.ai_draft_transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "drafts_select_ledgerly_app"
  ON public.ai_draft_transactions FOR SELECT
  TO ledgerly_app
  USING (true);

CREATE POLICY "drafts_lock_ledgerly_app"
  ON public.ai_draft_transactions FOR UPDATE
  TO ledgerly_app
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "drafts_delete_ledgerly_app"
  ON public.ai_draft_transactions FOR DELETE
  TO ledgerly_app
  USING (user_id = auth.uid());

CREATE POLICY "drafts_insert_ledgerly_app"
  ON public.ai_draft_transactions FOR INSERT
  TO ledgerly_app
  WITH CHECK (true);

GRANT SELECT, DELETE ON public.ai_draft_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_draft_transactions TO ledgerly_app;

-- -----------------------------------------------------------------------------
-- RPC: create_ai_draft (Service-Role Only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_ai_draft(
  p_user_id          UUID,
  p_type             TEXT,
  p_amount           NUMERIC,    -- Unconstrained NUMERIC; preserves scale
  p_currency         TEXT,
  p_category_id      UUID,
  p_description      TEXT,
  p_transaction_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET timezone    = 'UTC'
AS $$
DECLARE
  v_cat_user_id UUID;
  v_cat_type    TEXT;
  v_draft_id    UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'missing_user_id'
      USING ERRCODE = 'P0012',
            DETAIL  = 'p_user_id is required';
  END IF;

  IF p_type IS NULL OR p_type NOT IN ('income', 'expense') THEN
    RAISE EXCEPTION 'invalid_type'
      USING ERRCODE = 'P0008',
            DETAIL  = 'type must be income or expense';
  END IF;

  IF p_amount IS NULL THEN
    RAISE EXCEPTION 'invalid_amount_null'
      USING ERRCODE = 'P0009',
            DETAIL  = 'amount is required';
  END IF;

  IF p_amount = 'NaN'::NUMERIC
     OR p_amount = 'Infinity'::NUMERIC
     OR p_amount = '-Infinity'::NUMERIC
  THEN
    RAISE EXCEPTION 'invalid_amount_non_finite'
      USING ERRCODE = 'P0009',
            DETAIL  = 'amount must be a finite number';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount_not_positive'
      USING ERRCODE = 'P0009',
            DETAIL  = 'amount must be greater than zero';
  END IF;

  IF p_amount > 9999999999999.99::NUMERIC THEN
    RAISE EXCEPTION 'invalid_amount_exceeds_max'
      USING ERRCODE = 'P0009',
            DETAIL  = 'amount exceeds maximum permitted value';
  END IF;

  IF p_amount <> ROUND(p_amount, 2) OR scale(p_amount) > 2 THEN
    RAISE EXCEPTION 'invalid_amount_precision'
      USING ERRCODE = 'P0013',
            DETAIL  = 'amount must have at most 2 decimal places';
  END IF;

  IF p_transaction_date IS NULL THEN
    RAISE EXCEPTION 'invalid_date_null'
      USING ERRCODE = 'P0010',
            DETAIL  = 'transaction_date is required';
  END IF;

  IF p_transaction_date = 'infinity'::DATE
     OR p_transaction_date = '-infinity'::DATE
  THEN
    RAISE EXCEPTION 'invalid_date_special_value'
      USING ERRCODE = 'P0010',
            DETAIL  = 'transaction_date cannot be a special value';
  END IF;

  IF p_transaction_date > CURRENT_DATE + 1 THEN
    RAISE EXCEPTION 'invalid_date_future'
      USING ERRCODE = 'P0010',
            DETAIL  = 'transaction_date cannot be more than one day in the future';
  END IF;

  IF p_currency IS NULL OR p_currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'invalid_currency_format'
      USING ERRCODE = 'P0011',
            DETAIL  = 'currency must be a 3-letter ISO code';
  END IF;

  IF p_currency NOT IN (
    'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
    'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB'
  ) THEN
    RAISE EXCEPTION 'invalid_currency_not_supported'
      USING ERRCODE = 'P0011',
            DETAIL  = 'currency is not supported';
  END IF;

  IF p_description IS NOT NULL AND length(p_description) > 500 THEN
    RAISE EXCEPTION 'description_too_long'
      USING ERRCODE = 'P0014',
            DETAIL  = 'description must be at most 500 characters';
  END IF;

  SELECT user_id, type
  INTO   v_cat_user_id, v_cat_type
  FROM   public.categories
  WHERE  id = p_category_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'category_not_found'
      USING ERRCODE = 'P0002',
            DETAIL  = 'referenced category does not exist';
  END IF;

  IF v_cat_user_id IS NOT NULL AND v_cat_user_id <> p_user_id THEN
    RAISE EXCEPTION 'category_not_owned'
      USING ERRCODE = 'P0003',
            DETAIL  = 'category belongs to another user';
  END IF;

  IF v_cat_type <> p_type THEN
    RAISE EXCEPTION 'category_type_mismatch'
      USING ERRCODE = 'P0004',
            DETAIL  = 'category type does not match transaction type';
  END IF;

  INSERT INTO public.ai_draft_transactions (
    user_id,
    payload,
    expires_at
  )
  VALUES (
    p_user_id,
    jsonb_build_object(
      'type',             p_type,
      'amount',           p_amount,
      'currency',         p_currency,
      'category_id',      p_category_id,
      'description',      p_description,
      'transaction_date', p_transaction_date
    ),
    now() + INTERVAL '30 minutes'
  )
  RETURNING id INTO v_draft_id;

  RETURN v_draft_id;
END;
$$;

ALTER FUNCTION public.create_ai_draft(UUID, TEXT, NUMERIC, TEXT, UUID, TEXT, DATE) OWNER TO ledgerly_app;
REVOKE ALL ON FUNCTION public.create_ai_draft(UUID, TEXT, NUMERIC, TEXT, UUID, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_ai_draft(UUID, TEXT, NUMERIC, TEXT, UUID, TEXT, DATE) TO service_role;

-- -----------------------------------------------------------------------------
-- RPC: confirm_ai_draft (Authenticated Role)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_ai_draft(p_draft_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET timezone    = 'UTC'
AS $$
DECLARE
  v_payload          JSONB;
  v_type             TEXT;
  v_amount           NUMERIC;
  v_currency         TEXT;
  v_category_id      UUID;
  v_transaction_date DATE;
  v_description      TEXT;
  v_transaction_id   UUID;
BEGIN
  -- 1. Atomic lock: enforce draft ownership and expiry
  SELECT payload
  INTO   v_payload
  FROM   public.ai_draft_transactions
  WHERE  id        = p_draft_id
    AND  user_id   = auth.uid()
    AND  expires_at > now()
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'draft_not_available'
      USING ERRCODE = 'P0001',
            DETAIL  = 'Draft not found, expired, already confirmed, or locked';
  END IF;

  -- 2. Extract and validate type
  IF (v_payload ? 'type') IS FALSE OR v_payload->>'type' IS NULL THEN
    RAISE EXCEPTION 'missing_type_in_draft'
      USING ERRCODE = 'P0008',
            DETAIL  = 'type is required';
  END IF;
  v_type := v_payload->>'type';
  IF v_type NOT IN ('income', 'expense') THEN
    RAISE EXCEPTION 'invalid_type_in_draft'
      USING ERRCODE = 'P0008',
            DETAIL  = 'type must be income or expense';
  END IF;

  -- 3. Extract and validate amount
  IF (v_payload ? 'amount') IS FALSE OR v_payload->>'amount' IS NULL THEN
    RAISE EXCEPTION 'missing_amount_in_draft'
      USING ERRCODE = 'P0009',
            DETAIL  = 'amount is required';
  END IF;

  v_amount := (v_payload->>'amount')::NUMERIC;

  IF v_amount = 'NaN'::NUMERIC
     OR v_amount = 'Infinity'::NUMERIC
     OR v_amount = '-Infinity'::NUMERIC
  THEN
    RAISE EXCEPTION 'invalid_amount_non_finite_in_draft'
      USING ERRCODE = 'P0009',
            DETAIL  = 'amount must be a finite number';
  END IF;

  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount_not_positive_in_draft'
      USING ERRCODE = 'P0009',
            DETAIL  = 'amount must be greater than zero';
  END IF;

  IF v_amount > 9999999999999.99::NUMERIC THEN
    RAISE EXCEPTION 'invalid_amount_exceeds_max_in_draft'
      USING ERRCODE = 'P0009',
            DETAIL  = 'amount exceeds maximum permitted value';
  END IF;

  IF v_amount <> ROUND(v_amount, 2) OR scale(v_amount) > 2 THEN
    RAISE EXCEPTION 'invalid_amount_precision_in_draft'
      USING ERRCODE = 'P0013',
            DETAIL  = 'amount must have at most 2 decimal places';
  END IF;

  -- 4. Currency validation
  IF (v_payload ? 'currency') IS FALSE OR v_payload->>'currency' IS NULL THEN
    RAISE EXCEPTION 'missing_currency_in_draft'
      USING ERRCODE = 'P0011',
            DETAIL  = 'currency is required';
  END IF;
  v_currency := v_payload->>'currency';
  IF v_currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'invalid_currency_format_in_draft'
      USING ERRCODE = 'P0011',
            DETAIL  = 'currency must be a 3-letter ISO code';
  END IF;
  IF v_currency NOT IN (
    'BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY',
    'SGD', 'INR', 'CNY', 'AED', 'CHF', 'HKD', 'MYR', 'THB'
  ) THEN
    RAISE EXCEPTION 'invalid_currency_not_supported_in_draft'
      USING ERRCODE = 'P0011',
            DETAIL  = 'currency is not supported';
  END IF;

  -- 5. Category presence
  IF (v_payload ? 'category_id') IS FALSE OR v_payload->>'category_id' IS NULL THEN
    RAISE EXCEPTION 'missing_category_id_in_draft'
      USING ERRCODE = 'P0002',
            DETAIL  = 'category_id is required';
  END IF;
  v_category_id := (v_payload->>'category_id')::UUID;

  -- 6. Date validation
  IF (v_payload ? 'transaction_date') IS FALSE OR v_payload->>'transaction_date' IS NULL THEN
    RAISE EXCEPTION 'missing_date_in_draft'
      USING ERRCODE = 'P0010',
            DETAIL  = 'transaction_date is required';
  END IF;
  IF v_payload->>'transaction_date' !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'invalid_date_format_in_draft'
      USING ERRCODE = 'P0010',
            DETAIL  = 'transaction_date must be in YYYY-MM-DD format';
  END IF;
  v_transaction_date := (v_payload->>'transaction_date')::DATE;
  IF v_transaction_date = 'infinity'::DATE OR v_transaction_date = '-infinity'::DATE THEN
    RAISE EXCEPTION 'invalid_date_special_value_in_draft'
      USING ERRCODE = 'P0010',
            DETAIL  = 'transaction_date cannot be a special value';
  END IF;
  IF v_transaction_date > (now() AT TIME ZONE 'UTC')::DATE + 1 THEN
    RAISE EXCEPTION 'invalid_date_future_in_draft'
      USING ERRCODE = 'P0010',
            DETAIL  = 'transaction_date cannot be more than one day in the future';
  END IF;

  -- 7. Description length
  v_description := v_payload->>'description';
  IF v_description IS NOT NULL AND length(v_description) > 500 THEN
    RAISE EXCEPTION 'description_too_long_in_draft'
      USING ERRCODE = 'P0014',
            DETAIL  = 'description must be at most 500 characters';
  END IF;

  -- 8. Insert confirmed transaction (fires category trigger and domain constraint)
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    currency,
    category_id,
    description,
    transaction_date,
    is_ai_generated,
    is_confirmed
  )
  VALUES (
    auth.uid(),
    v_type,
    v_amount,
    v_currency::public.currency_code,
    v_category_id,
    v_description,
    v_transaction_date,
    true,
    true
  )
  RETURNING id INTO v_transaction_id;

  -- 9. Consume draft
  DELETE FROM public.ai_draft_transactions WHERE id = p_draft_id;

  RETURN v_transaction_id;
END;
$$;

ALTER FUNCTION public.confirm_ai_draft(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.confirm_ai_draft(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_ai_draft(UUID) TO authenticated;
