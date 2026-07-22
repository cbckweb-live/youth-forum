import { NextResponse } from "next/server";
import { createGenericRoute } from "@/lib/crud/generic-api-handler";
import { deleteStorageObject, safeErrorResponse } from "@/lib/admin-api-utils";

export const POST = createGenericRoute({
  table: "posts",
  actionCreate: "create_post",
  actionUpdate: "update_post",
  actionDelete: "delete_post",
  sanitizePayload: (payload) => ({
    title: payload.title,
    slug: payload.slug,
    category: payload.category,
    content: payload.content || "",
    author_name: payload.author_name || null,
    photo_url: payload.photo_url || null,
    pdf_url: payload.pdf_url || null,
    published: payload.published ?? false,
  }),
  validate: (payload, action) => {
    if (action === "create_post" || action === "update_post") {
      if (!payload.title) return "Title is required.";
      if (!payload.slug) return "Slug is required.";
      if (!payload.category) return "Category is required.";
    }
    return null;
  },
  customActions: {
    toggle_publish: async (payload, serviceSupabase) => {
      const { id, published } = payload;
      if (!id) {
        return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
      }
      if (typeof published !== "boolean") {
        return NextResponse.json({ error: "Published status is required." }, { status: 400 });
      }

      const { error } = await serviceSupabase
        .from("posts")
        .update({ published })
        .eq("id", id);

      if (error) {
        return safeErrorResponse("[posts/toggle_publish]", error, "Failed to update post.", 500);
      }
      return new NextResponse(null, { status: 204 });
    },
  },
  afterUpdate: async (serviceSupabase, payload) => {
    const { previous_photo_url, photo_url, previous_pdf_url, pdf_url } = payload;

    if (typeof previous_photo_url === "string" && previous_photo_url && previous_photo_url !== photo_url) {
      try {
        await deleteStorageObject(serviceSupabase, previous_photo_url);
      } catch (err) {
        console.error("Failed to delete previous post photo:", err);
      }
    }

    if (typeof previous_pdf_url === "string" && previous_pdf_url && previous_pdf_url !== pdf_url) {
      try {
        await deleteStorageObject(serviceSupabase, previous_pdf_url);
      } catch (err) {
        console.error("Failed to delete previous post PDF:", err);
      }
    }
  },
  afterDelete: async (serviceSupabase, payload) => {
    // Fetch the record to get storage URLs for cleanup
    const { id } = payload;
    const { data: post } = await serviceSupabase
      .from("posts")
      .select("photo_url, pdf_url")
      .eq("id", id)
      .maybeSingle();

    if (post?.photo_url) {
      try {
        await deleteStorageObject(serviceSupabase, post.photo_url);
      } catch (err) {
        console.error("Failed to delete post photo after deletion:", err);
      }
    }
    if (post?.pdf_url) {
      try {
        await deleteStorageObject(serviceSupabase, post.pdf_url);
      } catch (err) {
        console.error("Failed to delete post PDF after deletion:", err);
      }
    }
  },
});
