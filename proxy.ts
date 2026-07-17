import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
 
  
  // ==========================================
  // 1. "COMING SOON" LAUNCH GATEKEEPER LOGIC
  // ==========================================
  const BYPASS_COOKIE_NAME = 'cbck_launch_bypass';
  const BYPASS_SECRET_VALUE = 'cbck_office_bearers_2026';

  // Secret Team Backdoor Link Handler: https://cbckyouthforum.live/?preview=true
  if (url.searchParams.get('preview') === 'true') {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    redirectResponse.cookies.set(BYPASS_COOKIE_NAME, BYPASS_SECRET_VALUE, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, 
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    return redirectResponse;
  }

  // System Core / Framework Layout Assets Exclusions
  // System Core / Framework Layout Assets Exclusions
  const isAssetOrSystem = 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname === '/coming-soon' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg');

    
  // Check if visitor possesses the team bypass credentials cookie
  const bypassCookie = request.cookies.get(BYPASS_COOKIE_NAME);
  const isTeamMember = bypassCookie?.value === BYPASS_SECRET_VALUE;

  // Admin login routes exclusion check
  const isAdminPath = url.pathname.startsWith('/developers/admin') || url.pathname.startsWith('/admin');

  // CRUCIAL FORCE CHECK: If hitting homepage directly and they aren't a team member -> Block instantly!
  if (url.pathname === '/' && !isTeamMember) {
    return NextResponse.rewrite(new URL('/coming-soon', request.url));
  }

  // Block unauthorized traffic across other inner pages
  if (!isAssetOrSystem && !isTeamMember && !isAdminPath) {
    return NextResponse.rewrite(new URL('/coming-soon', request.url));
  }

  
  // ==========================================
  // 2. YOUR EXISTING SUPABASE AUTH LAYER
  // ==========================================
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
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

  return response;
}

// ⚠️ THE STRICT EXCLUSION MATCHER ["/admin/dashboard/:path*"],
export const config = {
  matcher: [ 
    // "/admin/dashboard/:path*"
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