import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { errorResponse, getServerSupabase } from "@/lib/admin-api-utils";
import { env } from "@/lib/env";

/**
 * Returns the launched state by trying Edge Config first, then falling back
 * to the database. Returns false (not launched) if both are unavailable.
 */
async function readLaunched(): Promise<boolean> {
  // 1. Try Vercel Edge Config (primary)
  try {
    const current = await get<boolean | null>("siteLaunched");
    if (current !== undefined) return current === true;
  } catch {
    // fall through to DB fallback
  }

  // 2. Fall back to Supabase database — use the service role key if available
  //    (this endpoint is already admin-protected, so it's safe)
  try {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;

    if (supabaseUrl && serviceKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(supabaseUrl, serviceKey);
      const { data } = await db
        .from("site_config")
        .select("site_launched")
        .eq("id", 1)
        .single();
      return data?.site_launched === true;
    }

    // Fall back to anon key (RLS allows public reads on site_config)
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && anonKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(supabaseUrl, anonKey);
      const { data } = await db
        .from("site_config")
        .select("site_launched")
        .eq("id", 1)
        .maybeSingle();
      return data?.site_launched === true;
    }
  } catch (err) {
    console.error("[go-live/readLaunched] DB fallback also failed:", err);
  }

  // 3. Default
  return false;
}

export async function GET(request: NextRequest) {
  const response = new NextResponse();

  const supabase = getServerSupabase(request, response);
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return errorResponse("Unauthorized", 401);
  }

  const role = (session.user.app_metadata as Record<string, unknown>)?.role;
  if (role !== "admin") {
    return errorResponse("Forbidden", 403);
  }

  try {
    const launched = await readLaunched();
    return NextResponse.json({ launched });
  } catch (err) {
    console.error("[go-live/GET]", err);
    return errorResponse("Failed to read launch status.", 500);
  }
}

export async function POST(request: NextRequest) {
  const response = new NextResponse();

  // Create the authenticated Supabase client from the admin session
  const supabase = getServerSupabase(request, response);

  // Verify admin session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return errorResponse("Unauthorized", 401);
  }

  const role = (session.user.app_metadata as Record<string, unknown>)?.role;
  if (role !== "admin") {
    return errorResponse("Forbidden", 403);
  }

  const errors: string[] = [];

  // 1. Write to the database using the authenticated admin session
  //    (RLS policy allows authenticated users to write site_config)
  try {
    const { error: dbErr } = await supabase
      .from("site_config")
      .upsert(
        { id: 1, site_launched: true, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      );
    if (dbErr) {
      console.error("[go-live/POST] DB upsert error:", dbErr);
      errors.push("db");
    }
  } catch (err) {
    console.error("[go-live/POST] DB upsert exception:", err);
    errors.push("db");
  }

  // 2. Try to update Edge Config if configured
  if (env.EDGE_CONFIG_ID && env.VERCEL_ACCESS_TOKEN) {
    try {
      const params = new URLSearchParams({ token: env.VERCEL_ACCESS_TOKEN });

      const res = await fetch(
        `https://api.vercel.com/v1/edge-config/${env.EDGE_CONFIG_ID}/items?${params.toString()}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.VERCEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({ items: [{ key: "siteLaunched", value: true }] }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("[go-live/POST] Vercel API error:", res.status, text);
        errors.push("edge-config");
      }
    } catch (err) {
      console.error("[go-live/POST] Edge Config patch exception:", err);
      errors.push("edge-config");
    }
  }

  // 3. Return result
  if (errors.length > 0 && errors.includes("db")) {
    return NextResponse.json(
      { error: "Failed to update launch status in the database." },
      { status: 500 },
    );
  }

  if (errors.length > 0) {
    return NextResponse.json({
      success: true,
      warning: "Launch status updated in database, but Edge Config could not be updated. The site may take longer to reflect publicly.",
    });
  }

  return NextResponse.json({ success: true });
}
