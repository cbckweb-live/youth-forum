import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

function getServerSupabase(request: NextRequest, response: NextResponse) {
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

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, { status });
}

async function requireAdmin(request: NextRequest, response: NextResponse) {
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

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(", ");
    console.error(`[getServiceSupabase] Missing env vars: ${missing}`);
    throw new Error(`Missing env vars: ${missing}`);
  }
  return createClient(url, key);
}

function extractStorageLocationFromPublicUrl(publicUrl: string) {
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
    filePath: pathParts.join("/"),
  };
}

async function deleteStorageObject(serviceSupabase: ReturnType<typeof getServiceSupabase>, publicUrl: string) {
  const storageLocation = extractStorageLocationFromPublicUrl(publicUrl);
  if (!storageLocation) {
    return;
  }

  const { error } = await serviceSupabase.storage
    .from(storageLocation.bucket)
    .remove([storageLocation.filePath]);

  if (error) {
    throw error;
  }
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

  const payload = await request.json();
  const { action } = payload as { action?: string };

  if (action === "create_mathetes") {
    const { title, description, photo_url } = payload;
    if (!title) return errorResponse("Title is required.", 400);

    const { data, error } = await serviceSupabase
      .from("mathetes")
      .insert({
        title,
        description: description || null,
        photo_url: photo_url || null,
      })
      .select();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ data });
  }

  if (action === "update_mathetes") {
    const { id, title, description, photo_url, previous_photo_url } = payload;
    if (!id) return errorResponse("Mathetes entry ID is required.", 400);
    if (!title) return errorResponse("Title is required.", 400);

    const { error } = await serviceSupabase
      .from("mathetes")
      .update({
        title,
        description: description || null,
        photo_url: photo_url || null,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);

    if (
      typeof previous_photo_url === "string" &&
      previous_photo_url &&
      previous_photo_url !== photo_url
    ) {
      try {
        await deleteStorageObject(serviceSupabase, previous_photo_url);
      } catch (deleteError) {
        console.error("Failed to delete previous Mathetes photo:", deleteError);
      }
    }

    return new NextResponse(null, { status: 204 });
  }

  if (action === "delete_mathetes") {
    const { id } = payload;
    if (!id) return errorResponse("Mathetes entry ID is required.", 400);

    const { data: entry, error: fetchError } = await serviceSupabase
      .from("mathetes")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return errorResponse(fetchError.message, 500);

    if (entry?.photo_url) {
      try {
        await deleteStorageObject(serviceSupabase, entry.photo_url);
      } catch (deleteError) {
        return errorResponse(
          deleteError instanceof Error ? deleteError.message : "Failed to delete Mathetes photo.",
          500,
        );
      }
    }

    const { error } = await serviceSupabase
      .from("mathetes")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  return errorResponse("Invalid action.", 400);
}