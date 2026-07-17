import { createGenericRoute } from "@/lib/crud/generic-api-handler";
import { deleteStorageObject } from "@/lib/admin-api-utils";

export const POST = createGenericRoute({
  table: "mathetes",
  actionCreate: "create_mathetes",
  actionUpdate: "update_mathetes",
  actionDelete: "delete_mathetes",
  sanitizePayload: (payload) => ({
    title: payload.title,
    description: payload.description || null,
    photo_url: payload.photo_url || null,
  }),
  validate: (payload, action) => {
    if (action === "create_mathetes" || action === "update_mathetes") {
      if (!payload.title) return "Title is required.";
    }
    return null;
  },
  afterUpdate: async (serviceSupabase, payload) => {
    const { previous_photo_url, photo_url } = payload;
    if (
      typeof previous_photo_url === "string" &&
      previous_photo_url &&
      previous_photo_url !== photo_url
    ) {
      try {
        await deleteStorageObject(serviceSupabase, previous_photo_url);
      } catch (err) {
        console.error("Failed to delete previous Mathetes photo:", err);
      }
    }
  },
  afterDelete: async (serviceSupabase, payload) => {
    const { id } = payload;
    const { data: entry } = await serviceSupabase
      .from("mathetes")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();

    if (entry?.photo_url) {
      try {
        await deleteStorageObject(serviceSupabase, entry.photo_url);
      } catch (err) {
        console.error("Failed to delete Mathetes photo after deletion:", err);
      }
    }
  },
});
