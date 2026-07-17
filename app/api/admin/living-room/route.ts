import { createGenericRoute } from "@/lib/crud/generic-api-handler";

export const POST = createGenericRoute({
  table: "living_room_seasons",
  actionCreate: "create_episode",
  actionUpdate: "update_episode",
  actionDelete: "delete_episode",
  sanitizePayload: (payload) => ({
    title: payload.title,
    description: payload.description || null,
    youtube_url: payload.youtube_url || null,
    display_order: payload.display_order ?? 1,
  }),
  validate: (payload, action) => {
    if (action === "create_episode" || action === "update_episode") {
      if (!payload.title) return "Title is required.";
    }
    return null;
  },
});
