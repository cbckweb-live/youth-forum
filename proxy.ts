import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
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

  if (url.pathname.startsWith("/login") || url.pathname === "/admin") {
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
      },
    );

    if (url.pathname.startsWith("/admin/dashboard")) {
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

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};