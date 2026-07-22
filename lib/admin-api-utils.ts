import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

/** Creates a Supabase server client from the request/response pair for auth. */
export function getServerSupabase(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

/** Returns a JSON NextResponse. */
export function jsonResponse(body: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

/** Returns a JSON error NextResponse. */
export function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, { status });
}

/**
 * Returns a generic JSON error response after logging the full error server-side.
 * Use this instead of `errorResponse(err.message, 500)` to avoid leaking internal
 * details (stack traces, file paths, DB error messages) to the client.
 *
 * @param logPrefix  A label for the console.error log (e.g. "[events/create]")
 * @param err        The actual error object (logged server-side only)
 * @param message    The generic message returned to the client
 * @param status     HTTP status code (default 500)
 */
export function safeErrorResponse(logPrefix: string, err: unknown, message: string, status = 500) {
  console.error(`${logPrefix}:`, err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) {
    console.error(`${logPrefix} stack:`, err.stack);
  }
  return errorResponse(message, status);
}

/**
 * Requires a valid admin session. Returns `{ ok: true }` on success,
 * or `{ error: NextResponse }` with 401/403 on failure.
 */
export async function requireAdmin(
  request: NextRequest,
  response: NextResponse,
): Promise<{ error: NextResponse } | { ok: true }> {
  let serverSupabase;
  try {
    serverSupabase = getServerSupabase(request, response);
  } catch (e) {
    console.error("[requireAdmin]", e);
    return { error: errorResponse("Supabase client misconfigured.", 500) };
  }
  const {
    data: { session },
    error: sessionError,
  } = await serverSupabase.auth.getSession();

  if (sessionError || !session) {
    return { error: errorResponse("Unauthorized", 401) };
  }

  const role = (session.user.app_metadata as Record<string, unknown>)?.role;
  if (role !== "admin") {
    return { error: errorResponse("Forbidden", 403) };
  }

  return { ok: true };
}

/** Creates a Supabase client with the service role key for admin writes. */
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(", ");
    console.error(`[getServiceSupabase] Missing env vars: ${missing}`);
    throw new Error(`Missing env vars: ${missing}`);
  }
  return createClient(url, key);
}

type SupabaseClient = ReturnType<typeof getServiceSupabase>;

/**
 * Extracts the bucket and file path from a Supabase Storage public URL.
 * Returns null if the URL cannot be parsed.
 */
export function extractStorageLocationFromPublicUrl(publicUrl: string) {
  try {
    const url = new URL(publicUrl);
    const marker = "/object/public/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const storagePath = url.pathname.slice(markerIndex + marker.length);
    const [bucket, ...pathParts] = storagePath.split("/").filter(Boolean);

    if (!bucket || pathParts.length === 0) {
      return null;
    }

    return {
      bucket,
      filePath: decodeURIComponent(pathParts.join("/")),
    };
  } catch {
    return null;
  }
}

/**
 * Extracts just the file path portion from a public URL (for compatibility
 * with routes that use the older `extractStorageFilePathFromPublicUrl` pattern).
 */
export function extractStorageFilePathFromPublicUrl(publicUrl: string) {
  const location = extractStorageLocationFromPublicUrl(publicUrl);
  if (!location) return null;
  return location.filePath;
}

/**
 * Deletes a file from Supabase Storage given its public URL.
 * Silently returns if the URL cannot be parsed.
 */
export async function deleteStorageObject(serviceSupabase: SupabaseClient, publicUrl: string) {
  const storageLocation = extractStorageLocationFromPublicUrl(publicUrl);
  if (!storageLocation) {
    return;
  }

  const { error } = await serviceSupabase.storage
    .from(storageLocation.bucket)
    .remove([storageLocation.filePath]);

  if (error) {
    console.error("Failed to delete file:", error);
    throw error;
  }
}
