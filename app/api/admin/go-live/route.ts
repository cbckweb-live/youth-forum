import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { requireAdmin, safeErrorResponse, getServiceSupabase } from "@/lib/admin-api-utils";
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

  // 2. Fall back to Supabase database
  try {
    const db = getServiceSupabase();
    const { data } = await db
      .from("site_config")
      .select("site_launched")
      .eq("id", 1)
      .single();
    return data?.site_launched === true;
  } catch (err) {
    console.error("[go-live/readLaunched] DB fallback also failed:", err);
  }

  // 3. Default
  return false;
}

export async function GET(request: NextRequest) {
  const response = new NextResponse();
  const auth = await requireAdmin(request, response);
  if ("error" in auth) return auth.error;

  try {
    const launched = await readLaunched();
    return NextResponse.json({ launched });
  } catch (err) {
    return safeErrorResponse("[go-live/GET]", err, "Failed to read launch status.", 500);
  }
}

export async function POST(request: NextRequest) {
  const response = new NextResponse();
  const auth = await requireAdmin(request, response);
  if ("error" in auth) return auth.error;

  const errors: string[] = [];

  // 1. Always write to the database (reliable fallback)
  try {
    const db = getServiceSupabase();
    const { error: dbErr } = await db
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
    // If the database write itself failed, return an error
    return NextResponse.json(
      { error: "Failed to update launch status in the database. Edge Config may also be out of sync." },
      { status: 500 },
    );
  }

  if (errors.length > 0) {
    // DB succeeded but Edge Config failed — still a partial success
    return NextResponse.json({
      success: true,
      warning: "Launch status updated in database, but Edge Config could not be updated. The site may take longer to reflect publicly.",
    });
  }

  return NextResponse.json({ success: true });
}
