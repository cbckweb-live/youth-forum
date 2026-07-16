import { NextRequest, NextResponse } from "next/server";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  getServiceSupabase,
  extractStorageLocationFromPublicUrl,
} from "@/lib/admin-api-utils";

type GalleryInsertRow = {
  photo_url: string;
  caption: string | null;
  event_tag: string | null;
};

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

  const filePath = extractStorageLocationFromPublicUrl(photo.photo_url);
  if (!filePath) {
    return errorResponse("Unable to extract gallery storage path from photo_url.", 500);
  }

  const { error: deleteError } = await serviceSupabase.storage
    .from(filePath.bucket)
    .remove([filePath.filePath]);

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
    previous_photo_url?: string;
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

  // Clean up old photo if it was replaced
  if (
    payload.previous_photo_url &&
    payload.photo_url &&
    payload.previous_photo_url !== payload.photo_url
  ) {
    const oldLocation = extractStorageLocationFromPublicUrl(payload.previous_photo_url);
    if (oldLocation) {
      const { error: storageError } = await serviceSupabase.storage
        .from(oldLocation.bucket)
        .remove([oldLocation.filePath]);
      if (storageError) {
        console.error("Failed to delete old gallery photo from storage:", storageError);
      }
    }
  }

  return jsonResponse({ updatedRows: data });
}
