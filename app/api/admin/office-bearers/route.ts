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

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const serverSupabase = getServerSupabase(request, response);
  const {
    data: { session },
    error: sessionError,
  } = await serverSupabase.auth.getSession();

  if (sessionError || !session) {
    return errorResponse("Unauthorized", 401);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse("Supabase service role key is not configured.", 500);
  }

  const payload = await request.json();
  const { action } = payload as { action?: string };

  if (action === "create_person") {
    const { name, role, photo_url, phone, email, team_id, display_order } =
      payload;
    if (!name) return errorResponse("Name is required.", 400);

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await serviceSupabase
      .from("office_bearers")
      .insert({
        name,
        role: role || null,
        photo_url: photo_url || null,
        phone: phone || null,
        email: email || null,
        team_id: team_id || null,
        display_order: display_order ?? 0,
      })
      .select();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ data });
  }

  if (action === "update_person") {
    const { id, name, role, photo_url, phone, email, team_id } = payload;
    if (!id) return errorResponse("Person ID is required.", 400);
    if (!name) return errorResponse("Name is required.", 400);

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await serviceSupabase
      .from("office_bearers")
      .update({
        name,
        role: role || null,
        photo_url: photo_url || null,
        phone: phone || null,
        email: email || null,
        team_id: team_id || null,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  if (action === "delete_person") {
    const { id } = payload;
    if (!id) return errorResponse("Person ID is required.", 400);

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await serviceSupabase
      .from("office_bearers")
      .delete()
      .eq("id", id);
    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  if (action === "create_team") {
    const { name, display_order } = payload;
    if (!name) return errorResponse("Team name is required.", 400);

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

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

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await serviceSupabase.from("teams").delete().eq("id", id);
    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  return errorResponse("Invalid action.", 400);
}
