-- 0006_loans.sql
-- Debt & Loan Management: loans table, loan_repayments table, atomic repayment procedure, view, RLS, and grants.

-- 1. Loans Table
CREATE TABLE IF NOT EXISTS public.loans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  person_name      TEXT NOT NULL CHECK (length(trim(person_name)) > 0 AND length(person_name) <= 255),
  person_contact   TEXT CHECK (person_contact IS NULL OR length(person_contact) <= 255),
  direction        TEXT NOT NULL CHECK (direction IN ('lent', 'borrowed')),
  principal_amount NUMERIC(15, 2) NOT NULL CHECK (
                     principal_amount > 0 AND
                     scale(principal_amount) <= 2 AND
                     principal_amount <= 9999999999999.99
                   ),
  currency         public.currency_code NOT NULL DEFAULT 'BDT',
  payment_method   TEXT NOT NULL CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'bank', 'other')),
  loan_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  notes            TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_loan_due_date_valid CHECK (
    due_date IS NULL OR due_date >= loan_date
  )
);

CREATE INDEX IF NOT EXISTS idx_loans_user_direction ON public.loans (user_id, direction);
CREATE INDEX IF NOT EXISTS idx_loans_user_due_date ON public.loans (user_id, due_date);

-- 2. Loan Repayments Table
CREATE TABLE IF NOT EXISTS public.loan_repayments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id        UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount         NUMERIC(15, 2) NOT NULL CHECK (
                   amount > 0 AND
                   scale(amount) <= 2 AND
                   amount <= 9999999999999.99
                 ),
  payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'bank', 'other')),
  reference      TEXT CHECK (reference IS NULL OR length(reference) <= 255),
  notes          TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan ON public.loan_repayments (loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_user ON public.loan_repayments (user_id);

-- 3. Row Level Security
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

-- Loans Policies
CREATE POLICY "loans_select_own"
  ON public.loans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "loans_insert_own"
  ON public.loans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "loans_update_own"
  ON public.loans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "loans_delete_own"
  ON public.loans FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Loan Repayments Policies
CREATE POLICY "loan_repayments_select_own"
  ON public.loan_repayments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "loan_repayments_insert_own"
  ON public.loan_repayments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "loan_repayments_delete_own"
  ON public.loan_repayments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Ledgerly App Internal Policies
CREATE POLICY "loans_ledgerly_app"
  ON public.loans FOR ALL
  TO ledgerly_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "loan_repayments_ledgerly_app"
  ON public.loan_repayments FOR ALL
  TO ledgerly_app
  USING (true)
  WITH CHECK (true);

-- 4. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.loan_repayments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans, public.loan_repayments TO ledgerly_app;

-- 5. Helper View with Derived Balances and Status
CREATE OR REPLACE VIEW public.loans_with_details
WITH (security_invoker = true) AS
SELECT 
  l.id,
  l.user_id,
  l.person_name,
  l.person_contact,
  l.direction,
  l.principal_amount,
  l.currency,
  l.payment_method,
  l.loan_date,
  l.due_date,
  l.notes,
  l.created_at,
  l.updated_at,
  COALESCE(r.total_repaid, 0)::NUMERIC(15, 2) AS total_repaid,
  (l.principal_amount - COALESCE(r.total_repaid, 0))::NUMERIC(15, 2) AS outstanding_balance,
  ROUND((COALESCE(r.total_repaid, 0) / l.principal_amount * 100), 1) AS progress_pct,
  CASE 
    WHEN (l.principal_amount - COALESCE(r.total_repaid, 0)) <= 0 THEN 'settled'
    WHEN l.due_date IS NOT NULL AND l.due_date < (CURRENT_DATE AT TIME ZONE 'UTC') THEN 'overdue'
    ELSE 'active'
  END AS status
FROM public.loans l
LEFT JOIN (
  SELECT loan_id, SUM(amount) AS total_repaid
  FROM public.loan_repayments
  GROUP BY loan_id
) r ON r.loan_id = l.id;

GRANT SELECT ON public.loans_with_details TO authenticated;
GRANT SELECT ON public.loans_with_details TO ledgerly_app;

-- 6. Atomic Repayment RPC Procedure
CREATE OR REPLACE FUNCTION public.record_loan_repayment(
  p_loan_id        UUID,
  p_amount         NUMERIC,
  p_payment_date   DATE,
  p_payment_method TEXT,
  p_reference      TEXT DEFAULT NULL,
  p_notes          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET timezone    = 'UTC'
AS $$
DECLARE
  v_loan            RECORD;
  v_total_repaid    NUMERIC(15, 2);
  v_remaining       NUMERIC(15, 2);
  v_new_remaining   NUMERIC(15, 2);
  v_repayment_id    UUID;
  v_status          TEXT;
  v_progress_pct    NUMERIC;
BEGIN
  -- 1. Input Validation
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_repayment_amount'
      USING ERRCODE = 'P0009',
            DETAIL  = 'Repayment amount must be strictly greater than zero';
  END IF;

  IF scale(p_amount) > 2 THEN
    RAISE EXCEPTION 'invalid_amount_precision'
      USING ERRCODE = 'P0013',
            DETAIL  = 'Repayment amount must have at most 2 decimal places';
  END IF;

  IF p_amount > 9999999999999.99::NUMERIC THEN
    RAISE EXCEPTION 'repayment_amount_exceeds_max'
      USING ERRCODE = 'P0009',
            DETAIL  = 'Repayment amount exceeds maximum permitted value';
  END IF;

  IF p_payment_method NOT IN ('cash', 'bkash', 'nagad', 'bank', 'other') THEN
    RAISE EXCEPTION 'invalid_payment_method'
      USING ERRCODE = 'P0008',
            DETAIL  = 'Payment method must be cash, bkash, nagad, bank, or other';
  END IF;

  IF p_payment_date IS NULL THEN
    RAISE EXCEPTION 'missing_payment_date'
      USING ERRCODE = 'P0010',
            DETAIL  = 'Payment date is required';
  END IF;

  -- 2. Concurrency-safe lock on parent loan (verifies ownership and identity)
  SELECT *
  INTO   v_loan
  FROM   public.loans
  WHERE  id      = p_loan_id
    AND  user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'loan_not_found'
      USING ERRCODE = 'P0002',
            DETAIL  = 'Loan not found or unauthorized';
  END IF;

  -- 3. Calculate current total repayments
  SELECT COALESCE(SUM(amount), 0)
  INTO   v_total_repaid
  FROM   public.loan_repayments
  WHERE  loan_id = p_loan_id;

  v_remaining := v_loan.principal_amount - v_total_repaid;

  -- 4. Check if already settled
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'loan_already_settled'
      USING ERRCODE = 'P0015',
            DETAIL  = 'Loan has already been fully settled';
  END IF;

  -- 5. Prevent overpayment
  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'repayment_exceeds_balance'
      USING ERRCODE = 'P0016',
            DETAIL  = format('Repayment amount (%s) exceeds outstanding balance (%s)', p_amount, v_remaining);
  END IF;

  -- 6. Insert repayment
  INSERT INTO public.loan_repayments (
    loan_id,
    user_id,
    amount,
    payment_date,
    payment_method,
    reference,
    notes
  )
  VALUES (
    p_loan_id,
    v_loan.user_id,
    p_amount,
    p_payment_date,
    p_payment_method,
    p_reference,
    p_notes
  )
  RETURNING id INTO v_repayment_id;

  -- 7. Calculate new balances and status
  v_new_remaining := v_remaining - p_amount;
  v_total_repaid  := v_total_repaid + p_amount;
  v_progress_pct  := ROUND((v_total_repaid / v_loan.principal_amount * 100), 1);

  IF v_new_remaining <= 0 THEN
    v_status := 'settled';
  ELSIF v_loan.due_date IS NOT NULL AND v_loan.due_date < (CURRENT_DATE AT TIME ZONE 'UTC') THEN
    v_status := 'overdue';
  ELSE
    v_status := 'active';
  END IF;

  -- 8. Return JSON outcome
  RETURN jsonb_build_object(
    'repayment_id',         v_repayment_id,
    'loan_id',              p_loan_id,
    'amount',               p_amount,
    'total_repaid',         v_total_repaid,
    'outstanding_balance',  v_new_remaining,
    'progress_pct',         v_progress_pct,
    'status',               v_status
  );
END;
$$;

ALTER FUNCTION public.record_loan_repayment(UUID, NUMERIC, DATE, TEXT, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.record_loan_repayment(UUID, NUMERIC, DATE, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_loan_repayment(UUID, NUMERIC, DATE, TEXT, TEXT, TEXT) TO authenticated;
