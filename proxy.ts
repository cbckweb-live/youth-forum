import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // IMPORTANT:
  // - In middleware, the only cookies that persist are those set on the
  //   *returned* NextResponse.
  // - Do NOT mutate request.cookies; it won’t be reflected back to the browser.
  // - Use a single response instance so any session-refresh cookies written
  //   by @supabase/ssr are included in the final response.
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
    },
  );

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

  return response;
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};


