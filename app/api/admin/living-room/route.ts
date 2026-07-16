import { NextRequest, NextResponse } from "next/server";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  getServiceSupabase,
} from "@/lib/admin-api-utils";

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
