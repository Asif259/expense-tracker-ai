-- 0002_categories.sql
-- Categories table, immutability trigger, RLS policies, and grants.

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon       TEXT,
  color      TEXT,
  is_system  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_system_category_consistency CHECK (
    (is_system = true  AND user_id IS NULL) OR
    (is_system = false AND user_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_system_name
  ON public.categories (name, type)
  WHERE is_system = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name
  ON public.categories (user_id, name, type)
  WHERE is_system = false;

CREATE OR REPLACE FUNCTION public.prevent_category_immutable_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type THEN
    RAISE EXCEPTION 'category_type_immutable'
      USING ERRCODE = 'P0005',
            DETAIL  = 'category.type cannot be changed after creation';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'category_owner_immutable'
      USING ERRCODE = 'P0006',
            DETAIL  = 'category.user_id cannot be changed after creation';
  END IF;

  IF NEW.is_system IS DISTINCT FROM OLD.is_system THEN
    RAISE EXCEPTION 'category_system_flag_immutable'
      USING ERRCODE = 'P0007',
            DETAIL  = 'category.is_system cannot be changed after creation';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.prevent_category_immutable_fields() OWNER TO ledgerly_app;
REVOKE ALL ON FUNCTION public.prevent_category_immutable_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_category_immutable_fields ON public.categories;
CREATE TRIGGER trg_prevent_category_immutable_fields
  BEFORE UPDATE OF type, user_id, is_system
  ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.prevent_category_immutable_fields();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_authenticated"
  ON public.categories FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "categories_insert_authenticated"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (is_system = false AND user_id = auth.uid());

CREATE POLICY "categories_update_authenticated"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (is_system = false AND user_id = auth.uid())
  WITH CHECK (is_system = false AND user_id = auth.uid());

CREATE POLICY "categories_delete_authenticated"
  ON public.categories FOR DELETE
  TO authenticated
  USING (is_system = false AND user_id = auth.uid());

CREATE POLICY "categories_select_ledgerly_app"
  ON public.categories FOR SELECT
  TO ledgerly_app
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO ledgerly_app;
