import { NextResponse } from "next/server";
import { createGenericRoute } from "@/lib/crud/generic-api-handler";
import { deleteStorageObject, safeErrorResponse } from "@/lib/admin-api-utils";

export const POST = createGenericRoute({
  table: "office_bearers",
  actionCreate: "create_person",
  actionUpdate: "update_person",
  actionDelete: "delete_person",
  sanitizePayload: (payload) => ({
    name: payload.name,
    role: payload.role || null,
    photo_url: payload.photo_url || null,
    phone: payload.phone || null,
    email: payload.email || null,
    bio: payload.bio || null,
    team_id: payload.team_id || null,
    display_order: payload.display_order ?? 0,
  }),
  validate: (payload, action) => {
    if (action === "create_person" || action === "update_person") {
      if (!payload.name) return "Name is required.";
    }
    return null;
  },
  customActions: {
    create_team: async (payload, serviceSupabase) => {
      const { name, display_order } = payload;
      if (!name) {
        return NextResponse.json({ error: "Team name is required." }, { status: 400 });
      }

      const { data, error } = await serviceSupabase
        .from("teams")
        .insert({ name, display_order: display_order ?? 0 })
        .select();

      if (error) {
        return safeErrorResponse("[office-bearers/create_team]", error, "Failed to create team.", 500);
      }
      return NextResponse.json({ data });
    },
    delete_team: async (payload, serviceSupabase) => {
      const { id } = payload;
      if (!id) {
        return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
      }

      const { error } = await serviceSupabase
        .from("teams")
        .delete()
        .eq("id", id);

      if (error) {
        return safeErrorResponse("[office-bearers/delete_team]", error, "Failed to delete team.", 500);
      }
      return new NextResponse(null, { status: 204 });
    },
  },
  afterUpdate: async (serviceSupabase, payload) => {
    const { previous_photo_url, photo_url } = payload;
    if (
      typeof previous_photo_url === "string" &&
      previous_photo_url &&
      typeof photo_url === "string" &&
      photo_url &&
      previous_photo_url !== photo_url
    ) {
      try {
        await deleteStorageObject(serviceSupabase, previous_photo_url);
      } catch (err) {
        console.error("Failed to delete previous office bearer photo:", err);
      }
    }
  },
  afterDelete: async (serviceSupabase, payload) => {
    const { id } = payload;
    const { data: person } = await serviceSupabase
      .from("office_bearers")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();

    if (person?.photo_url) {
      try {
        await deleteStorageObject(serviceSupabase, person.photo_url);
      } catch (err) {
        console.error("Failed to delete office bearer photo after deletion:", err);
      }
    }
  },
});
