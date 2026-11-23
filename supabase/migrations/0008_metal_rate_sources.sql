-- Migration: Update metal_rate_cache for dual-source support (goldr.org + goldapi.io)
-- This migration:
-- 1. Adds CHECK constraint for source column
-- 2. Updates unique constraint to include source
-- 3. Adds index for source-based queries
-- Run via Supabase Dashboard SQL Editor or Supabase CLI

BEGIN;

-- 1. Add CHECK constraint for source
ALTER TABLE public.metal_rate_cache
ADD CONSTRAINT source_check CHECK (source IN ('goldr.org', 'goldapi.io'));

-- 2. Drop old unique constraint and create new one with source
DROP INDEX IF EXISTS metal_rate_cache_metal_type_karat_currency_key;
ALTER TABLE public.metal_rate_cache
DROP CONSTRAINT IF EXISTS metal_rate_cache_metal_type_karat_currency_key;

ALTER TABLE public.metal_rate_cache
ADD CONSTRAINT metal_rate_cache_source_metal_type_karat_currency_key
UNIQUE (source, metal_type, karat, currency);

-- 3. Add index for source-based queries with currency and fetched_at
CREATE INDEX IF NOT EXISTS idx_metal_rate_cache_source_currency_fetched
ON public.metal_rate_cache (source, currency, fetched_at DESC);

-- 4. Add index for fetching latest rates by source
CREATE INDEX IF NOT EXISTS idx_metal_rate_cache_source_fetched_desc
ON public.metal_rate_cache (source, fetched_at DESC);

COMMIT;
