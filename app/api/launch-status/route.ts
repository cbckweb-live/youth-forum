import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

/**
 * Public, unauthenticated endpoint that returns the current site launch status.
 * Polled by the coming-soon page to detect when the site goes live.
 * Defaults to { launched: false } on any error so a misconfigured env var
 * never crashes the page.
 */
export async function GET() {
  try {
    const launched = await get<boolean>("siteLaunched");
    return NextResponse.json({ launched: launched === true });
  } catch (err) {
    console.error("[launch-status/GET] Edge Config read failed:", err);
    return NextResponse.json({ launched: false });
  }
}
