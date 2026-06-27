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
) {
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

  return { session };
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

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string | null) || "posts-media";
  const mediaType = (formData.get("type") as string | null) || "photo";

  if (!file) {
    return errorResponse("No file provided.", 400);
  }

  if (mediaType === "pdf") {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return errorResponse("Invalid file type. PDF only.", 400);
    }
    if (file.size > MAX_PDF_BYTES) {
      return errorResponse("File exceeds 10MB limit.", 400);
    }
  } else {
    if (!file.type.startsWith("image/")) {
      return errorResponse("Invalid file type. Image required.", 400);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return errorResponse("Image exceeds 20MB limit.", 400);
    }
  }

  const path = `${Date.now()}-${file.name}`;
  const { error } = await serviceSupabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) return errorResponse(error.message, 500);

  const url = serviceSupabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return jsonResponse({ url });
}
