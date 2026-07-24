import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  // First check if table exists
  const { data: checkData, error: checkError } = await supabase
    .from('site_config')
    .select('id')
    .eq('id', 1)
    .maybeSingle();

  if (checkError && checkError.message.includes('does not exist')) {
    console.log('Table site_config does not exist. Attempting to create via Management API...');

    // Try Supabase Management API for executing SQL
    const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    console.log('Project ref:', projectRef);

    // Try the auth/v1/sql endpoint (legacy)
    const sql = `
CREATE TABLE IF NOT EXISTS public.site_config (
    id          INTEGER      PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_launched BOOLEAN    NOT NULL DEFAULT false,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by  UUID         REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO public.site_config (id, site_launched)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
CREATE POLICY "Public read site_config"
    ON public.site_config
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Service role can manage site_config" ON public.site_config;
CREATE POLICY "Service role can manage site_config"
    ON public.site_config
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

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
`;

    // Try different endpoints for raw SQL
    const endpoints = [
      `${url}/auth/v1/sql`,
      `${url}/rest/v1/rpc/`,
    ];

    for (const endpoint of endpoints) {
      console.log(`Trying endpoint: ${endpoint}`);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql }),
        });
        const text = await response.text();
        console.log(`  Status: ${response.status}, Body: ${text.slice(0, 200)}`);
        if (response.ok) {
          console.log('SQL executed successfully!');
          return true;
        }
      } catch (err) {
        console.log(`  Failed: ${err.message}`);
      }
    }

    console.log('\nCould not execute SQL via REST API. You need to:');
    console.log('1. Go to https://supabase.com/dashboard/project/emsfthlfptmysgzpectv/sql/new');
    console.log('2. Paste and run the SQL from supabase/migrations/20260724_site_config.sql');
    return false;
  } else if (checkError) {
    console.error('Error checking table:', checkError.message);
    return false;
  } else {
    console.log('Table site_config already exists with id=1:', JSON.stringify(checkData));
    return true;
  }
}

run().then(success => {
  if (success) {
    console.log('\nMigration check complete. Testing the go-live API...');
  }
  process.exit(success ? 0 : 1);
}).catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
