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
      try {
        await deleteStorageObject(serviceSupabase, previous_photo_url);
      } catch (deleteError) {
        console.error("Failed to delete previous photo:", deleteError);
      }
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
      try {
        await deleteStorageObject(serviceSupabase, person.photo_url);
      } catch (deleteError) {
        console.error("Failed to delete photo from storage:", deleteError);
      }
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
