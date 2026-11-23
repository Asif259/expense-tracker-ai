-- Migration: Create investments and metal rate cache tables
-- This migration adds user investment holdings and shared BAJUS metal rate cache
-- Run via Supabase Dashboard SQL Editor or Supabase CLI

BEGIN;

-- 1. Create public.metal_rate_cache for live BAJUS rates
CREATE TABLE IF NOT EXISTS public.metal_rate_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL DEFAULT 'goldr.org',
    metal_type TEXT NOT NULL CHECK (metal_type IN ('gold', 'silver')),
    karat TEXT NOT NULL CHECK (karat IN ('24k', '22k', '21k', '18k', 'traditional')),
    market_price_per_gram NUMERIC(15,2) NOT NULL CHECK (market_price_per_gram > 0),
    resale_price_per_gram NUMERIC(15,2) NOT NULL CHECK (resale_price_per_gram > 0),
    currency public.currency_code NOT NULL DEFAULT 'BDT',
    source_updated_label TEXT,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (metal_type, karat, currency)
);

-- RLS for metal_rate_cache: authenticated users can read, service_role writes
ALTER TABLE public.metal_rate_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metal_rate_cache_read_authenticated" ON public.metal_rate_cache
    FOR ALL TO authenticated
    USING (true);

CREATE POLICY "metal_rate_cache_insert_update_delete_service_role" ON public.metal_rate_cache
    FOR ALL TO service_role
    USING (true);

-- 2. Create public.investments for user holdings
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 120),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('gold', 'silver', 'fdr_dps', 'sanchaypatra', 'stocks', 'mutual_fund', 'real_estate', 'other')),
    invested_amount NUMERIC(15,2) NOT NULL CHECK (invested_amount >= 0),
    current_value NUMERIC(15,2) NOT NULL CHECK (current_value >= 0 AND scale(current_value) <= 2),
    currency public.currency_code NOT NULL DEFAULT 'BDT',
    purchase_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold')),
    sold_amount NUMERIC(15,2) CHECK (sold_amount >= 0 AND scale(sold_amount) <= 2),
    sold_date DATE CHECK (sold_date IS NULL OR sold_date >= purchase_date),
    linked_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT CHECK (notes IS NULL OR length(notes) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for investments: user can only access their own records
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investments_select_user_only" ON public.investments
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "investments_insert_user_only" ON public.investments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investments_update_user_only" ON public.investments
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investments_delete_user_only" ON public.investments
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investments_user_asset_status ON public.investments (user_id, asset_type, status);
CREATE INDEX IF NOT EXISTS idx_investments_purchase_date ON public.investments (purchase_date);

-- 4. Add updated_at trigger matching existing pattern
CREATE OR REPLACE FUNCTION public.update_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_investments_updated_at
    BEFORE UPDATE ON public.investments
    FOR EACH ROW EXECUTE FUNCTION public.update_investments_updated_at();

COMMIT;