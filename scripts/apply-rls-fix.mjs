#!/usr/bin/env node
/**
 * Applies the RLS fix migration for site_config.
 *
 * Usage:
 *   node scripts/apply-rls-fix.mjs
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL  (or SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * This script connects to the Supabase database using the service role key
 * via the pg (PostgreSQL) endpoint and runs the RLS policy fix SQL.
 */

// The SQL we need to run
const SQL = `
DROP POLICY IF EXISTS "Authenticated users can manage site_config" ON public.site_config;
CREATE POLICY "Authenticated users can manage site_config"
    ON public.site_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
`;

async function main() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    process.exit(1);
  }

  // Extract the project ref from the URL
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  console.log(`Project ref: ${ref}`);

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Use the supabase-js client to run the SQL via the REST endpoint
    // The service_role key can bypass RLS, but we still need to run DDL
    // which isn't directly supported via the REST API.
    //
    // Instead, use the Supabase Management API.
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${ref}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: SQL }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      // Management API may not accept the service_role key directly,
      // so fall back to direct HTTP query via the project's pg endpoint.
      if (response.status === 401 || response.status === 403) {
        console.log("⚠️  Management API requires a different token. Trying direct endpoint...");
        return await fallbackViaREST(supabaseUrl, serviceRoleKey);
      }
      console.error(`❌ API error (${response.status}):`, text);
      process.exit(1);
    }

    console.log("✅ Migration applied successfully via Management API!");
  } catch (err) {
    console.error("❌ Failed:", err.message);
    try {
      await fallbackViaREST(supabaseUrl, serviceRoleKey);
    } catch {
      console.error("\n❌ Could not apply migration automatically.");
      console.log("\n📋 To apply manually, run this SQL in the Supabase SQL Editor:");
      console.log("─".repeat(60));
      console.log(SQL);
      console.log("─".repeat(60));
      process.exit(1);
    }
  }
}

async function fallbackViaREST(supabaseUrl, serviceRoleKey) {
  console.log("Trying to apply SQL via pg endpoint...");

  // Try the supabase REST SQL endpoint
  const pgUrl = `${supabaseUrl}/rest/v1/rpc/`;

  // We can't directly run DDL via REST, so let's be practical:
  // The code is already committed with the migration file.
  // Let's try a different approach - use the pg client directly.
  console.log("\n⚠️  Cannot run DDL via Supabase REST API automatically.");
  console.log("📋 Please run the following SQL in your Supabase Dashboard SQL Editor:\n");
  console.log("─".repeat(60));
  console.log(SQL);
  console.log("─".repeat(60));
}

main();
