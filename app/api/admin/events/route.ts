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

  if (action === "create_event") {
    const { title, event_date, event_end_date, description, image_url } = payload;
    if (!title) return errorResponse("Title is required.", 400);
    if (!event_date) return errorResponse("Event date is required.", 400);

    const { data, error } = await serviceSupabase
      .from("events")
      .insert({
        title,
        event_date,
        event_end_date: event_end_date || null,
        description: description || null,
        image_url: image_url || null,
      })
      .select();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ data });
  }

  if (action === "update_event") {
    const { id, title, event_date, event_end_date, description, image_url, previous_image_url } = payload;
    if (!id) return errorResponse("Event ID is required.", 400);
    if (!title) return errorResponse("Title is required.", 400);
    if (!event_date) return errorResponse("Event date is required.", 400);

    const { error } = await serviceSupabase
      .from("events")
      .update({
        title,
        event_date,
        event_end_date: event_end_date || null,
        description: description || null,
        image_url: image_url || null,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);

    // Clean up old image if it was replaced
    if (
      typeof previous_image_url === "string" &&
      previous_image_url &&
      previous_image_url !== image_url
    ) {
      try {
        await deleteStorageObject(serviceSupabase, previous_image_url);
      } catch (deleteError) {
        console.error("Failed to delete previous event image:", deleteError);
      }
    }

    return new NextResponse(null, { status: 204 });
  }

  if (action === "delete_event") {
    const { id } = payload;
    if (!id) return errorResponse("Event ID is required.", 400);

    // Fetch the record first to get the image_url for storage cleanup
    const { data: event, error: fetchError } = await serviceSupabase
      .from("events")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return errorResponse(fetchError.message, 500);

    const { error } = await serviceSupabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);

    // Clean up storage after successful deletion
    if (event?.image_url) {
      try {
        await deleteStorageObject(serviceSupabase, event.image_url);
      } catch (deleteError) {
        console.error("Failed to delete event image from storage:", deleteError);
      }
    }

    return new NextResponse(null, { status: 204 });
  }

  return errorResponse("Invalid action.", 400);
}
