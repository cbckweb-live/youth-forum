/**
 * POST /api/auth/login
 *
 * Server-side login proxy that applies rate limiting before proxying to Supabase.
 * Replaces the client-side `supabase.auth.signInWithPassword()` call.
 *
 * Returns 429 with Retry-After header when rate-limited.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getRateLimiter, getClientIp } from "@/lib/rate-limiter";
import { jsonResponse, errorResponse } from "@/lib/admin-api-utils";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const endpoint = "auth:login";
  const limiter = getRateLimiter();

  // Parse body
  let email = "";
  let password = "";
  let captchaToken: string | undefined;

  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();
    password = body.password ?? "";
    captchaToken = body.captchaToken;
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  if (!email || !password) {
    return errorResponse("Email and password are required.", 400);
  }

  // ── 1. Per-IP rate check (also counts this attempt) ──
  const ipResult = limiter.check({ ip, endpoint, tier: "auth" });
  if (!ipResult.allowed) {
    return rateLimitedResponse(ipResult.retryAfter);
  }

  // ── 2. Per-account rate check (also counts this attempt) ──
  const acctResult = limiter.check({
    ip,
    endpoint,
    tier: "auth",
    accountId: email,
  });
  if (!acctResult.allowed) {
    return rateLimitedResponse(acctResult.retryAfter);
  }

  // ── 3. Attempt Supabase login via server client (cookies forwarded to response) ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return errorResponse("Authentication service is misconfigured.", 500);
  }

  // Use a NextResponse that will carry Supabase auth cookies back to the client
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });

  if (error) {
    // Failed login — do NOT call limiter.check() again (the earlier checks already
    // counted the attempt). Backoff will apply naturally on the next request.
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  // ── 4. Success — reset rate limits for this IP + account ──
  limiter.reset({ ip, endpoint, accountId: email });

  // Force cookie sync by reading the session (triggers setAll callback)
  await supabase.auth.getSession();

  return response;
}

function rateLimitedResponse(retryAfterMs: number) {
  const retryAfter = Math.ceil(retryAfterMs / 1000);
  return new NextResponse(
    JSON.stringify({
      error: "Too many login attempts. Please try again later.",
      retryAfterSeconds: retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}
