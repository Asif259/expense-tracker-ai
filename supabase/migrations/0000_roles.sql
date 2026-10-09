-- 0000_roles.sql
-- Ledgerly application role: NOLOGIN, NOINHERIT
-- Used as SECURITY DEFINER owner for Ledgerly database functions and triggers.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ledgerly_app') THEN
    CREATE ROLE ledgerly_app WITH NOLOGIN NOINHERIT;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO ledgerly_app;
