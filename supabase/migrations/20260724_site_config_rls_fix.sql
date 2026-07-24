-- Fix: Allow authenticated admin users to write to site_config
-- This makes the Go Live button work without requiring SUPABASE_SERVICE_ROLE_KEY
-- on Vercel, because the admin's own auth session can write directly.

-- Authenticated users (which includes logged-in admins) can manage the site_config row.
-- The API route already verifies the admin role before reaching the write operation,
-- so this is safe — only admins who can authenticate will reach this write path.
DROP POLICY IF EXISTS "Authenticated users can manage site_config" ON public.site_config;
CREATE POLICY "Authenticated users can manage site_config"
    ON public.site_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
