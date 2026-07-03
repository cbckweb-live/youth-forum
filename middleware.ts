import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // 1. CHOOSE A SECRET PASS-CODE (Change this to any unique string you prefer)
  const BYPASS_COOKIE_NAME = 'cbck_launch_bypass';
  const BYPASS_SECRET_VALUE = 'cbck_office_bearers_2026';

  // 2. Secret Backdoor Endpoint Link Handler
  // If a team member goes to: https://cbckyouthforum.live/?preview=true
  if (url.searchParams.get('preview') === 'true') {
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // Plant a security cookie valid for 7 days so team doesn't get kicked out during testing
    response.cookies.set(BYPASS_COOKIE_NAME, BYPASS_SECRET_VALUE, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, 
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    return response;
  }

  // 3. System Core Bypasses (Essential for Next.js, framework compilation, and assets)
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname === '/coming-soon' ||
    url.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 4. Admin Portal Access Security Bypass
  // Ensures you can always log into Supabase at domain.com/developers/admin
  if (url.pathname.startsWith('/developers/admin')) {
    return NextResponse.next();
  }

  // 5. Team Authentication Cookie Verification Check
  const bypassCookie = request.cookies.get(BYPASS_COOKIE_NAME);
  if (bypassCookie?.value === BYPASS_SECRET_VALUE) {
    return NextResponse.next(); // Welcome! Let the team pass straight to the actual live site.
  }

  // 6. Direct all external, regular traffic to the holding page
  return NextResponse.rewrite(new URL('/coming-soon', request.url));
}

export const config = {
  // Execute code across all routes except raw static asset streams
  matcher: ['/((?!_next/assets|static|favicon.ico).*)'],
};