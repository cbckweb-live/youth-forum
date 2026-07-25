-- Teams table for office bearers grouping
--
-- Previously created manually in the Supabase dashboard but missing from
-- the migration history. This migration ensures the table exists with
-- proper RLS policies and permissions.

CREATE TABLE IF NOT EXISTS public.teams (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT          NOT NULL,
    display_order INTEGER       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can read teams.
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
CREATE POLICY "Public read teams"
    ON public.teams
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- Authenticated admin users can insert/update/delete teams.
DROP POLICY IF EXISTS "Admin manage teams" ON public.teams;
CREATE POLICY "Admin manage teams"
    ON public.teams
    FOR ALL
    TO authenticated
    USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
    WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Service role can manage teams (used by the generic CRUD API handler).
DROP POLICY IF EXISTS "Service role manage teams" ON public.teams;
CREATE POLICY "Service role manage teams"
    ON public.teams
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
