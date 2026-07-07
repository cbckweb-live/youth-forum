import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

type GalleryInsertRow = {
  photo_url: string;
  caption: string | null;
  event_tag: string | null;
};

function getServerSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

function extractStorageFilePathFromPublicUrl(publicUrl: string) {
  try {
    const url = new URL(publicUrl);
    const marker = "/object/public/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const storagePath = url.pathname.slice(markerIndex + marker.length);
    const pathParts = storagePath
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));

    if (pathParts.length < 2) {
      return null;
    }

    return pathParts.slice(1).join("/");
  } catch {
    return null;
  }
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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

  const { data: photo, error: fetchError } = await serviceSupabase
    .from("gallery")
    .select("photo_url")
    .eq("id", payload.id)
    .maybeSingle();

  if (fetchError) {
    return errorResponse(fetchError.message, 500);
  }

  if (!photo) {
    return errorResponse("Gallery photo not found.", 404);
  }

  if (typeof photo.photo_url !== "string" || !photo.photo_url) {
    return errorResponse("Gallery photo is missing a storage URL.", 500);
  }

  const filePath = extractStorageFilePathFromPublicUrl(photo.photo_url);
  if (!filePath) {
    return errorResponse("Unable to extract gallery storage path from photo_url.", 500);
  }

  const { error: deleteError } = await serviceSupabase.storage
    .from("gallery-media")
    .remove([filePath]);

  if (deleteError) {
    return errorResponse(`Failed to delete gallery file from storage: ${deleteError.message}`, 500);
  }

  const { error } = await serviceSupabase
    .from("gallery")
    .delete()
    .eq("id", payload.id);

  if (error) {
    return errorResponse(`Storage file deleted, but database row could not be removed: ${error.message}`, 500);
  }
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
    photo_url?: string;
    caption?: string | null;
    event_tag?: string | null;
  };

  if (!payload?.id) {
    return errorResponse("Missing gallery photo id.", 400);
  }

  const updateData: { caption: string | null; event_tag: string | null; photo_url?: string } = {
    caption: payload.caption ?? null,
    event_tag: payload.event_tag ?? null,
  };
  
  if (payload.photo_url !== undefined) {
    updateData.photo_url = payload.photo_url;
  }

  const { data, error } = await serviceSupabase
    .from("gallery")
    .update(updateData)
    .eq("id", payload.id)
    .select();

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ updatedRows: data });
}