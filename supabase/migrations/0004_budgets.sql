-- 0004_budgets.sql
-- Budgets table, indexes, RLS policies, and grants.

CREATE TABLE IF NOT EXISTS public.budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  period_year  SMALLINT NOT NULL,
  period_month SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  limit_amount NUMERIC NOT NULL,
  currency     public.currency_code NOT NULL DEFAULT 'BDT',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_budget_limit_valid CHECK (
    limit_amount > 0
    AND limit_amount <= 9999999999999.99::NUMERIC
    AND limit_amount = ROUND(limit_amount, 2)
    AND scale(limit_amount) <= 2
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_overall
  ON public.budgets (user_id, period_year, period_month)
  WHERE category_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_category
  ON public.budgets (user_id, category_id, period_year, period_month)
  WHERE category_id IS NOT NULL;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own"
  ON public.budgets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "budgets_insert_own"
  ON public.budgets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_update_own"
  ON public.budgets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_delete_own"
  ON public.budgets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
