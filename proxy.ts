import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/edge-config";
import { getRateLimiter, getClientIp } from "@/lib/rate-limiter";

export async function proxy(request: NextRequest) {
  try {
    return await proxyHandler(request);
  } catch (err) {
    console.error("[proxy] Unexpected error, falling back to default response:", err);
    return NextResponse.next();
  }
}

async function proxyHandler(request: NextRequest) {
  const url = request.nextUrl;

  // ==========================================
  // 0. RATE LIMITING — protect auth-adjacent pages
  // ==========================================
  if (url.pathname.startsWith('/login') || url.pathname === '/admin') {
    const limiter = getRateLimiter();
    const ip = getClientIp(request);
    const result = limiter.check({
      ip,
      endpoint: `page:${url.pathname}`,
      tier: "public",
    });
    if (!result.allowed) {
      const retryAfter = Math.ceil(result.retryAfter / 1000);
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        },
      );
    }
  }

  // ==========================================
  // 1. "COMING SOON" LAUNCH GATEKEEPER LOGIC
  // ==========================================
  const isLaunched = await readLaunchedState();

  const BYPASS_COOKIE_NAME = "cbck_launch_bypass";
  const BYPASS_SECRET_VALUE = process.env.LAUNCH_BYPASS_SECRET;
  if (!BYPASS_SECRET_VALUE) {
    console.error("LAUNCH_BYPASS_SECRET environment variable is not set!");
  }

  // Secret Team Backdoor Link Handler: https://cbckyouthforum.live/?preview=true
  if (url.searchParams.get("preview") === "true") {
    if (!BYPASS_SECRET_VALUE) {
      console.error("Cannot set bypass cookie: LAUNCH_BYPASS_SECRET is not configured");
      return NextResponse.redirect(new URL("/", request.url));
    }
    const redirectResponse = NextResponse.redirect(new URL("/", request.url));
    redirectResponse.cookies.set(BYPASS_COOKIE_NAME, BYPASS_SECRET_VALUE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return redirectResponse;
  }

  // System Core / Framework Layout Assets Exclusions
  const isAssetOrSystem =
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname === "/coming-soon" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/sitemap.xml" ||
    url.pathname === "/robots.txt" ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg");

  // Check if visitor possesses the team bypass credentials cookie
  const bypassCookie = request.cookies.get(BYPASS_COOKIE_NAME);
  const isTeamMember = bypassCookie?.value === BYPASS_SECRET_VALUE;

  // Admin login routes exclusion check
  const isAdminPath = url.pathname.startsWith("/developers/admin") || url.pathname.startsWith("/admin");

  // CRUCIAL FORCE CHECK: If hitting homepage directly and they aren't a team member -> Block instantly!
  if (url.pathname === "/" && !isTeamMember && !isLaunched) {
    return NextResponse.rewrite(new URL("/coming-soon", request.url));
  }

  // Block unauthorized traffic across other inner pages
  if (!isAssetOrSystem && !isTeamMember && !isAdminPath && !isLaunched) {
    return NextResponse.rewrite(new URL("/coming-soon", request.url));
  }

  
  // ==========================================
  // 2. SUPABASE AUTH LAYER
  // ==========================================
  const response = NextResponse.next();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Run the standard Supabase session layer logic over protected pages
    if (url.pathname.startsWith('/admin/dashboard')) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      const role = (session.user.app_metadata as Record<string, unknown>)?.role;
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/admin?denied=1", request.url));
      }
    }
  }

  return response;
}

/**
 * Reads the "siteLaunched" flag with a hybrid strategy:
 *   1. Edge Config fast-path: if it says `true`, trust it immediately (no DB call)
 *   2. Supabase DB (source of truth for `false` — always updated by go-live API)
 *   3. Edge Config fallback: if DB is unavailable, use Edge Config as cache
 *   4. Default: false (not launched)
 *
 * This balances performance (Edge Config is fast at the edge) with correctness
 * (the database is always authoritative — the go-live button always writes there).
 */
async function readLaunchedState(): Promise<boolean> {
  // 1. Fast path: Edge Config says true → trust it immediately
  try {
    const val = await get<boolean>("siteLaunched");
    if (val === true) return true;
  } catch {
    // fall through — Edge Config unavailable, check DB
  }

  // 2. Check the database (source of truth)
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && anonKey) {
      const sb = createClient(supabaseUrl, anonKey);
      const { data } = await sb
        .from("site_config")
        .select("site_launched")
        .eq("id", 1)
        .maybeSingle();
      if (data?.site_launched === true) return true;
    }
  } catch (err) {
    console.error("[proxy] DB read for site_launched failed:", err);
  }

  // 3. Edge Config fallback: DB unavailable, use cached value
  try {
    const val = await get<boolean>("siteLaunched");
    if (val !== undefined) return val === true;
  } catch {
    // fall through
  }

  // 4. Default
  return false;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
     '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};