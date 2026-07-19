import { NextResponse } from "next/server";
import { createGenericRoute } from "@/lib/crud/generic-api-handler";
import { deleteStorageObject } from "@/lib/admin-api-utils";

// Reusable sanitize function so bulk_create uses the same logic as create/update
function sanitizeGalleryRow(payload: Record<string, unknown>) {
  return {
    photo_url: payload.photo_url || null,
    caption: payload.caption || null,
    event_tag: payload.event_tag || null,
  };
}

export const POST = createGenericRoute({
  table: "gallery",
  actionCreate: "create",
  actionUpdate: "update",
  actionDelete: "delete",
  sanitizePayload: sanitizeGalleryRow,
  validate: (payload, action) => {
    if (action === "update" && !payload.photo_url) {
      return null; // Allow caption/event_tag-only updates
    }
    if (action === "create" && !payload.photo_url) {
      return "Photo URL is required.";
    }
    return null;
  },
  customActions: {
    bulk_create: async (payload, serviceSupabase) => {
      const rawRows = (payload as Record<string, unknown>).rows;
      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        return NextResponse.json({ error: "Missing gallery rows." }, { status: 400 });
      }

      // Sanitize every row using the same function as single create/update
      const sanitizedRows = rawRows.map((row: Record<string, unknown>) =>
        sanitizeGalleryRow(row),
      );

      const { data, error } = await serviceSupabase
        .from("gallery")
        .insert(sanitizedRows)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ insertedRows: data });
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
        console.error("Failed to delete old gallery photo:", err);
      }
    }
  },
  afterDelete: async (serviceSupabase, payload) => {
    const { id } = payload;
    const { data: photo } = await serviceSupabase
      .from("gallery")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();

    if (photo?.photo_url) {
      try {
        await deleteStorageObject(serviceSupabase, photo.photo_url);
      } catch (err) {
        console.error("Failed to delete gallery photo from storage:", err);
      }
    }
  },
});
