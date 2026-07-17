import { createGenericRoute } from "@/lib/crud/generic-api-handler";
import { deleteStorageObject } from "@/lib/admin-api-utils";

export const POST = createGenericRoute({
  table: "events",
  actionCreate: "create_event",
  actionUpdate: "update_event",
  actionDelete: "delete_event",
  sanitizePayload: (payload) => ({
    title: payload.title,
    event_date: payload.event_date,
    event_end_date: payload.event_end_date || null,
    description: payload.description || null,
    image_url: payload.image_url || null,
  }),
  validate: (payload, action) => {
    if (action === "create_event" || action === "update_event") {
      if (!payload.title) return "Title is required.";
      if (!payload.event_date) return "Event date is required.";
    }
    return null;
  },
  afterUpdate: async (serviceSupabase, payload) => {
    const { previous_image_url, image_url } = payload;
    if (
      typeof previous_image_url === "string" &&
      previous_image_url &&
      previous_image_url !== image_url
    ) {
      try {
        await deleteStorageObject(serviceSupabase, previous_image_url);
      } catch (err) {
        console.error("Failed to delete previous event image:", err);
      }
    }
  },
  afterDelete: async (serviceSupabase, payload) => {
    const { id } = payload;
    const { data: event } = await serviceSupabase
      .from("events")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    if (event?.image_url) {
      try {
        await deleteStorageObject(serviceSupabase, event.image_url);
      } catch (err) {
        console.error("Failed to delete event image after deletion:", err);
      }
    }
  },
});
