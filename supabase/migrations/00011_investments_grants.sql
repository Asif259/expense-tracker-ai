-- Migration: Grant table privileges for public.investments
-- 0007_investments.sql created the table and RLS policies but never granted
-- table-level privileges, so PostgREST requests made with the `authenticated`
-- role (user JWT) fail with SQLSTATE 42501 "permission denied for table
-- investments". RLS policies only filter rows after privileges are granted.
-- Idempotent: GRANT can be re-run safely.

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO ledgerly_app;

COMMIT;
