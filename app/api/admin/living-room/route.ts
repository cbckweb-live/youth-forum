import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

function getServerSupabase(request: NextRequest, response: NextResponse) {
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

  if (action === "create_episode") {
    const { title, description, youtube_url, display_order } = payload as {
      title?: string;
      description?: string;
      youtube_url?: string;
      display_order?: number;
    };
    if (!title) return errorResponse("Title is required.", 400);

    const { data, error } = await serviceSupabase
      .from("living_room_seasons")
      .insert({
        title,
        description: description || null,
        youtube_url: youtube_url || null,
        display_order: display_order ?? 1,
      })
      .select();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ data });
  }

  if (action === "update_episode") {
    const { id, title, description, youtube_url, display_order } = payload as {
      id?: string;
      title?: string;
      description?: string;
      youtube_url?: string;
      display_order?: number;
    };
    if (!id) return errorResponse("Episode ID is required.", 400);
    if (!title) return errorResponse("Title is required.", 400);

    const { error } = await serviceSupabase
      .from("living_room_seasons")
      .update({
        title,
        description: description || null,
        youtube_url: youtube_url || null,
        display_order: display_order ?? 1,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  if (action === "delete_episode") {
    const { id } = payload as { id?: string };
    if (!id) return errorResponse("Season ID is required.", 400);

    const { error } = await serviceSupabase
      .from("living_room_seasons")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  return errorResponse("Invalid action.", 400);
}
