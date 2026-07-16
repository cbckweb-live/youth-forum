import { NextRequest, NextResponse } from "next/server";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  getServiceSupabase,
  extractStorageLocationFromPublicUrl,
} from "@/lib/admin-api-utils";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string | null) || "posts-media";
  const mediaType = (formData.get("type") as string | null) || "photo";
  const folder = (formData.get("folder") as string | null) || "";

  if (!file) {
    return errorResponse("No file provided.", 400);
  }

  if (mediaType === "pdf") {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return errorResponse("Invalid file type. PDF only.", 400);
    }
    if (file.size > MAX_PDF_BYTES) {
      return errorResponse("File exceeds 10MB limit.", 400);
    }
  } else {
    if (!file.type.startsWith("image/")) {
      return errorResponse("Invalid file type. Image required.", 400);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return errorResponse("Image exceeds 20MB limit.", 400);
    }
  }

  const normalizedFolder = folder
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

  const path = `${normalizedFolder ? `${normalizedFolder}/` : ""}${Date.now()}-${file.name}`;
  const { error } = await serviceSupabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) return errorResponse(error.message, 500);

  const url = serviceSupabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return jsonResponse({ url });
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.next();
  const auth = await requireAdmin(request, response);
  if ("error" in auth) return auth.error;

  let serviceSupabase;
  try {
    serviceSupabase = getServiceSupabase();
  } catch {
    return errorResponse("Supabase service role key is not configured.", 500);
  }

  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return errorResponse("URL is required.", 400);
  }

  try {
    const storageLocation = extractStorageLocationFromPublicUrl(url);

    if (!storageLocation) {
      return errorResponse("Invalid URL format.", 400);
    }

    const { error } = await serviceSupabase.storage
      .from(storageLocation.bucket)
      .remove([storageLocation.filePath]);

    if (error) {
      // Log but don't fail if file doesn't exist
      console.error("Failed to delete file:", error);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Error deleting file:", err);
    return errorResponse("Failed to delete file.", 500);
  }
}
