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

  const payload = (await request.json()) as { rows?: GalleryInsertRow[] };
  if (
    !payload?.rows ||
    !Array.isArray(payload.rows) ||
    payload.rows.length === 0
  ) {
    return errorResponse("Missing gallery rows.", 400);
  }

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await serviceSupabase
    .from("gallery")
    .insert(payload.rows)
    .select();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ insertedRows: data });
}

export async function DELETE(request: NextRequest) {
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

  const payload = (await request.json()) as { id?: string };
  if (!payload?.id) {
    return errorResponse("Missing gallery photo id.", 400);
  }

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await serviceSupabase
    .from("gallery")
    .delete()
    .eq("id", payload.id);
  if (error) {
    return errorResponse(error.message, 500);
  }

  return new NextResponse(null, { status: 204 });
}

export async function PUT(request: NextRequest) {
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

  const payload = (await request.json()) as {
    id?: string;
    caption?: string | null;
    event_tag?: string | null;
  };

  if (!payload?.id) {
    return errorResponse("Missing gallery photo id.", 400);
  }

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const updatePayload = {
    caption: payload.caption ?? null,
    event_tag: payload.event_tag ?? null,
  };

  const { data, error } = await serviceSupabase
    .from("gallery")
    .update(updatePayload)
    .eq("id", payload.id)
    .select();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ updatedRows: data });
}
