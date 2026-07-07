import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

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

  const payload = await request.json();
  const { action } = payload as { action?: string };

  if (action === "create_post") {
    const { title, slug, category, content, author_name, photo_url, pdf_url, published } = payload;
    if (!title) return errorResponse("Title is required.", 400);
    if (!slug) return errorResponse("Slug is required.", 400);
    if (!category) return errorResponse("Category is required.", 400);

    const { data, error } = await serviceSupabase
      .from("posts")
      .insert({
        title,
        slug,
        category,
        content: content || "",
        author_name: author_name || null,
        photo_url: photo_url || null,
        pdf_url: pdf_url || null,
        published: published ?? false,
      })
      .select();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ data });
  }

  if (action === "update_post") {
    const { id, title, slug, category, content, author_name, photo_url, pdf_url, published } = payload;
    if (!id) return errorResponse("Post ID is required.", 400);
    if (!title) return errorResponse("Title is required.", 400);
    if (!slug) return errorResponse("Slug is required.", 400);
    if (!category) return errorResponse("Category is required.", 400);

    const { error } = await serviceSupabase
      .from("posts")
      .update({
        title,
        slug,
        category,
        content: content || "",
        author_name: author_name || null,
        photo_url: photo_url || null,
        pdf_url: pdf_url || null,
        published: published ?? false,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  if (action === "delete_post") {
    const { id } = payload;
    if (!id) return errorResponse("Post ID is required.", 400);

    const { error } = await serviceSupabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  if (action === "toggle_publish") {
    const { id, published } = payload;
    if (!id) return errorResponse("Post ID is required.", 400);
    if (typeof published !== "boolean") return errorResponse("Published status is required.", 400);

    const { error } = await serviceSupabase
      .from("posts")
      .update({ published })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  return errorResponse("Invalid action.", 400);
}
