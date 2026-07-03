import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

function getServerSupabase(request: NextRequest, response: NextResponse) {
  // FIX: Use non-NEXT_PUBLIC_ env vars for server-side client.
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

// FIX: Same admin guard as gallery route — checks app_metadata.role === "admin"
// before allowing any service-role DB mutation.
async function requireAdmin(
  request: NextRequest,
  response: NextResponse,
): Promise<{ error: NextResponse } | { ok: true }> {
  const serverSupabase = getServerSupabase(request, response);
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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role key is not configured.");
  }
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

type StorageDeleteClient = {
  storage: {
    from: (bucket: string) => {
      remove: (paths: string[]) => Promise<{ error: unknown }>;
    };
  };
};

async function deleteStorageObject(serviceSupabase: StorageDeleteClient, publicUrl: string) {
  const storageLocation = extractStorageLocationFromPublicUrl(publicUrl);
  if (!storageLocation) {
    return;
  }

  const { error } = await serviceSupabase.storage
    .from(storageLocation.bucket)
    .remove([storageLocation.filePath]);

  if (error) {
    console.error("Failed to delete file:", error);
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

  if (action === "create_person") {
    const { name, role, photo_url, phone, email, bio, team_id, display_order } = payload;
    if (!name) return errorResponse("Name is required.", 400);

    const { data, error } = await serviceSupabase
      .from("office_bearers")
      .insert({
        name,
        role: role || null,
        photo_url: photo_url || null,
        phone: phone || null,
        email: email || null,
        bio: bio || null,
        team_id: team_id || null,
        display_order: display_order ?? 0,
      })
      .select();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ data });
  }

  if (action === "update_person") {
    const { id, name, role, photo_url, previous_photo_url, phone, email, bio, team_id } = payload;
    if (!id) return errorResponse("Person ID is required.", 400);
    if (!name) return errorResponse("Name is required.", 400);

    const { error } = await serviceSupabase
      .from("office_bearers")
      .update({
        name,
        role: role || null,
        photo_url: photo_url || null,
        phone: phone || null,
        email: email || null,
        bio: bio || null,
        team_id: team_id || null,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);

    if (
      typeof previous_photo_url === "string" &&
      previous_photo_url &&
      typeof photo_url === "string" &&
      photo_url &&
      previous_photo_url !== photo_url
    ) {
      await deleteStorageObject(serviceSupabase, previous_photo_url);
    }

    return new NextResponse(null, { status: 204 });
  }

  if (action === "delete_person") {
    const { id } = payload;
    if (!id) return errorResponse("Person ID is required.", 400);

    const { data: person, error: fetchError } = await serviceSupabase
      .from("office_bearers")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return errorResponse(fetchError.message, 500);

    const { error } = await serviceSupabase
      .from("office_bearers")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);

    if (person?.photo_url) {
      await deleteStorageObject(serviceSupabase, person.photo_url);
    }

    return new NextResponse(null, { status: 204 });
  }

  if (action === "create_team") {
    const { name, display_order } = payload;
    if (!name) return errorResponse("Team name is required.", 400);

    const { data, error } = await serviceSupabase
      .from("teams")
      .insert({ name, display_order: display_order ?? 0 })
      .select();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ data });
  }

  if (action === "delete_team") {
    const { id } = payload;
    if (!id) return errorResponse("Team ID is required.", 400);

    const { error } = await serviceSupabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  return errorResponse("Invalid action.", 400);
}