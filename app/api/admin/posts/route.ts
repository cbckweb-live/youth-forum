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

  if (action === "create_post") {
    const { title, slug, category, content, author_name, photo_url, pdf_url, published } = payload;
    if (!title) return errorResponse("Title is required.", 400);
    if (!slug) return errorResponse("Slug is required.", 400);
    if (!category) return errorResponse("Category is required.", 400);

    const { data, error } = await serviceSupabase
      .from("posts")
      .insert({
        title,
        slug,
        category,
        content: content || "",
        author_name: author_name || null,
        photo_url: photo_url || null,
        pdf_url: pdf_url || null,
        published: published ?? false,
      })
      .select();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ data });
  }

  if (action === "update_post") {
    const { id, title, slug, category, content, author_name, photo_url, pdf_url, published, previous_photo_url, previous_pdf_url } = payload;
    if (!id) return errorResponse("Post ID is required.", 400);
    if (!title) return errorResponse("Title is required.", 400);
    if (!slug) return errorResponse("Slug is required.", 400);
    if (!category) return errorResponse("Category is required.", 400);

    const { error } = await serviceSupabase
      .from("posts")
      .update({
        title,
        slug,
        category,
        content: content || "",
        author_name: author_name || null,
        photo_url: photo_url || null,
        pdf_url: pdf_url || null,
        published: published ?? false,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);

    // Clean up old photo if replaced
    if (
      typeof previous_photo_url === "string" &&
      previous_photo_url &&
      previous_photo_url !== photo_url
    ) {
      try {
        await deleteStorageObject(serviceSupabase, previous_photo_url);
      } catch (deleteError) {
        console.error("Failed to delete previous post photo:", deleteError);
      }
    }

    // Clean up old PDF if replaced
    if (
      typeof previous_pdf_url === "string" &&
      previous_pdf_url &&
      previous_pdf_url !== pdf_url
    ) {
      try {
        await deleteStorageObject(serviceSupabase, previous_pdf_url);
      } catch (deleteError) {
        console.error("Failed to delete previous post PDF:", deleteError);
      }
    }

    return new NextResponse(null, { status: 204 });
  }

  if (action === "delete_post") {
    const { id } = payload;
    if (!id) return errorResponse("Post ID is required.", 400);

    // Fetch the record first to get storage URLs for cleanup
    const { data: post, error: fetchError } = await serviceSupabase
      .from("posts")
      .select("photo_url, pdf_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return errorResponse(fetchError.message, 500);

    const { error } = await serviceSupabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);

    // Clean up storage after successful deletion
    if (post?.photo_url) {
      try {
        await deleteStorageObject(serviceSupabase, post.photo_url);
      } catch (deleteError) {
        console.error("Failed to delete post photo from storage:", deleteError);
      }
    }
    if (post?.pdf_url) {
      try {
        await deleteStorageObject(serviceSupabase, post.pdf_url);
      } catch (deleteError) {
        console.error("Failed to delete post PDF from storage:", deleteError);
      }
    }

    return new NextResponse(null, { status: 204 });
  }

  if (action === "toggle_publish") {
    const { id, published } = payload;
    if (!id) return errorResponse("Post ID is required.", 400);
    if (typeof published !== "boolean") return errorResponse("Published status is required.", 400);

    const { error } = await serviceSupabase
      .from("posts")
      .update({ published })
      .eq("id", id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  }

  return errorResponse("Invalid action.", 400);
}
