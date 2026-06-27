import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

type GalleryInsertRow = {
  photo_url: string;
  caption: string | null;
  event_tag: string | null;
};

function getServerSupabase(request: NextRequest, response: NextResponse) {
  // FIX: Use non-NEXT_PUBLIC_ env vars for server-side Supabase client.
  // NEXT_PUBLIC_ vars are embedded in the client bundle; using them on the
  // server is harmless but inconsistent and risks accidental exposure patterns.
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            if (options) {
              response.cookies.set(name, value, options);
            } else {
              response.cookies.set(name, value);
            }
          });
        },
      },
    },
  );
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, { status });
}

/**
 * FIX: Centralised auth + role guard used by every handler in this route.
 *
 * Previously the routes only checked that a session existed, meaning ANY
 * logged-in Supabase user could trigger service-role DB writes (privilege
 * escalation). Now we additionally verify app_metadata.role === "admin",
 * which is set server-side only and cannot be spoofed by the client.
 *
 * Returns the session on success, or a 401/403 NextResponse on failure.
 */
async function requireAdmin(
  request: NextRequest,
  response: NextResponse,
): Promise<{ error: NextResponse } | { session: NonNullable<Awaited<ReturnType<ReturnType<typeof getServerSupabase>["auth"]["getSession"]>>["data"]["session"]> }> {
  const serverSupabase = getServerSupabase(request, response);
  const {
    data: { session },
    error: sessionError,
  } = await serverSupabase.auth.getSession();

  if (sessionError || !session) {
    return { error: errorResponse("Unauthorized", 401) };
  }

  // app_metadata is populated server-side only — safe to trust from the JWT.
  const role = (session.user.app_metadata as Record<string, unknown>)?.role;
  if (role !== "admin") {
    return { error: errorResponse("Forbidden", 403) };
  }

  return { session };
}

function getServiceSupabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role key is not configured.");
  }
  // FIX: Use non-NEXT_PUBLIC_ SUPABASE_URL for the service client too.
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const auth = await requireAdmin(request, response);
  if ("error" in auth) return auth.error;

  let serviceSupabase;
  try {
    serviceSupabase = getServiceSupabase();
  } catch {
    return errorResponse("Supabase service role key is not configured.", 500);
  }

  const payload = (await request.json()) as { rows?: GalleryInsertRow[] };
  if (
    !payload?.rows ||
    !Array.isArray(payload.rows) ||
    payload.rows.length === 0
  ) {
    return errorResponse("Missing gallery rows.", 400);
  }

  const { data, error } = await serviceSupabase
    .from("gallery")
    .insert(payload.rows)
    .select();

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ insertedRows: data });
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.next();
  const auth = await requireAdmin(request, response);
  if ("error" in auth) return auth.error;

  let serviceSupabase;
  try {
    serviceSupabase = getServiceSupabase();
  } catch {
    return errorResponse("Supabase service role key is not configured.", 500);
  }

  const payload = (await request.json()) as { id?: string };
  if (!payload?.id) {
    return errorResponse("Missing gallery photo id.", 400);
  }

  const { error } = await serviceSupabase
    .from("gallery")
    .delete()
    .eq("id", payload.id);

  if (error) return errorResponse(error.message, 500);
  return new NextResponse(null, { status: 204 });
}

export async function PUT(request: NextRequest) {
  const response = NextResponse.next();
  const auth = await requireAdmin(request, response);
  if ("error" in auth) return auth.error;

  let serviceSupabase;
  try {
    serviceSupabase = getServiceSupabase();
  } catch {
    return errorResponse("Supabase service role key is not configured.", 500);
  }

  const payload = (await request.json()) as {
    id?: string;
    caption?: string | null;
    event_tag?: string | null;
  };

  if (!payload?.id) {
    return errorResponse("Missing gallery photo id.", 400);
  }

  const { data, error } = await serviceSupabase
    .from("gallery")
    .update({
      caption: payload.caption ?? null,
      event_tag: payload.event_tag ?? null,
    })
    .eq("id", payload.id)
    .select();

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ updatedRows: data });
}