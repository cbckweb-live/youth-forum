-- site_config table for Go Live launch state (DB fallback for Vercel Edge Config)
--
-- Purpose:
--   Edge Config is the primary source for the site-launched flag (faster reads at
--   the edge). This table serves as a durable fallback so the site can be launched
--   even when Edge Config is unavailable (e.g. local dev, temporary outage).
--
--   The go-live API route and proxy.ts both use this two-tier strategy:
--     1. Try Vercel Edge Config first
--     2. Fall back to this table
--     3. Default to not-launched if both fail

CREATE TABLE IF NOT EXISTS public.site_config (
    id          INTEGER      PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- single-row guard
    site_launched BOOLEAN    NOT NULL DEFAULT false,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by  UUID         REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Seed the mandatory single row
INSERT INTO public.site_config (id, site_launched)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- Row-Level Security
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors at the edge) can read the launch flag.
-- This is safe — the flag only controls whether /coming-soon is shown or not.
DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
CREATE POLICY "Public read site_config"
    ON public.site_config
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- Only the service role (server-side admin code) may write.
DROP POLICY IF EXISTS "Service role can manage site_config" ON public.site_config;
CREATE POLICY "Service role can manage site_config"
    ON public.site_config
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Helper: read the current launch state (returns false if row missing)
CREATE OR REPLACE FUNCTION public.get_site_launched()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT site_launched FROM public.site_config WHERE id = 1),
        false
    );
$$;

-- Helper: set the launch state (idempotent)
CREATE OR REPLACE FUNCTION public.set_site_launched(launched boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.site_config (id, site_launched, updated_at, updated_by)
    VALUES (1, launched, now(), auth.uid())
    ON CONFLICT (id) DO UPDATE SET
        site_launched = launched,
        updated_at    = now(),
        updated_by    = auth.uid();
END;
$$;
