import { NextRequest, NextResponse } from "next/server";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  getServiceSupabase,
  deleteStorageObject,
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
