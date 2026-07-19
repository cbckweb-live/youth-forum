import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  getServiceSupabase,
  extractStorageLocationFromPublicUrl,
} from "@/lib/admin-api-utils";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Buckets the upload endpoint is allowed to write to. */
const ALLOWED_BUCKETS = new Set([
  "posts-media",
  "posts-pdf",
  "events-media",
  "gallery-media",
  "office-bearers-media",
  "media",
]);

/** Allowed characters in filenames — strip everything else. */
const SAFE_FILENAME_RE = /[^a-zA-Z0-9._\-]/g;

/** Magic bytes for PDF files. */
const PDF_MAGIC = Buffer.from("%PDF");

/**
 * Sanitize a filename: strip path separators, null bytes, and any unsafe
 * characters. Keep only alphanumeric, dot, underscore, and hyphen.
 */
function sanitizeFilename(name: string): string {
  // Strip path components first (just in case)
  const base = name.replace(/^.*[/\\]/, "");
  // Remove null bytes
  const noNull = base.replace(/\x00/g, "");
  // Strip unsafe characters
  const safe = noNull.replace(SAFE_FILENAME_RE, "_");
  // Prevent empty filenames or hidden files
  const cleaned = safe.replace(/^[._-]+/, "");
  return cleaned || "upload";
}

/**
 * Validate an image file by reading its magic bytes via Sharp.
 * On success, re-encode as WebP (with JPEG fallback) to strip all
 * embedded metadata, EXIF, and potential injected payloads.
 *
 * Returns the processed image buffer and the safe output MIME type.
 */
async function validateAndReencodeImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  mime: string;
}> {
  // Sharp will throw "Input buffer contains unsupported image format"
  // if the magic bytes don't match a supported image type.
  const metadata = await sharp(buffer).metadata();

  // Refuse SVG files — they can contain embedded <script> tags.
  if (metadata.format === "svg") {
    throw new Error("SVG images are not allowed.");
  }

  // Re-encode as WebP (with JPEG fallback). This strips all metadata,
  // EXIF, color profiles, etc. from the original file.
  let reEncoded: Buffer;
  let mime: string;

  try {
    reEncoded = await sharp(buffer)
      .rotate()                    // Auto-rotate based on EXIF orientation
      .webp({ quality: 82 })
      .toBuffer();
    mime = "image/webp";
  } catch {
    // If WebP encoding fails (unlikely), fall back to JPEG
    reEncoded = await sharp(buffer)
      .rotate()
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    mime = "image/jpeg";
  }

  return { buffer: reEncoded, mime };
}

/**
 * Check that the buffer starts with the PDF magic bytes.
 */
function validatePdfMagic(buffer: Buffer): void {
  if (buffer.length < 4 || buffer.subarray(0, 4).compare(PDF_MAGIC) !== 0) {
    throw new Error("Invalid PDF file. Magic bytes do not match %PDF.");
  }
}

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

  // Reject bucket names not on the allowlist
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return errorResponse(`Bucket "${bucket}" is not allowed.`, 403);
  }

  // ── Read the full file into a buffer for server-side validation ──
  let fileBuffer: Buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } catch {
    return errorResponse("Failed to read file.", 500);
  }

  let uploadBody: Buffer;
  let uploadMime: string;
  let uploadExt: string;

  if (mediaType === "pdf") {
    // ── PDF validation via magic bytes ──
    if (file.size > MAX_PDF_BYTES) {
      return errorResponse("File exceeds 10MB limit.", 400);
    }

    try {
      validatePdfMagic(fileBuffer);
    } catch (err) {
      return errorResponse(
        err instanceof Error ? err.message : "Invalid PDF file.",
        400,
      );
    }

    uploadBody = fileBuffer;
    uploadMime = "application/pdf";
    uploadExt = "pdf";
  } else {
    // ── Image validation & re-encoding via Sharp ──
    if (file.size > MAX_IMAGE_BYTES) {
      return errorResponse("Image exceeds 20MB limit.", 400);
    }

    try {
      const result = await validateAndReencodeImage(fileBuffer);
      uploadBody = result.buffer;
      uploadMime = result.mime;
      uploadExt = result.mime === "image/webp" ? "webp" : "jpg";
    } catch (err) {
      return errorResponse(
        err instanceof Error
          ? err.message
          : "Invalid or unsupported image file.",
        400,
      );
    }
  }

  // ── Sanitize folder path ──
  const normalizedFolder = folder
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

  // ── Sanitize filename ──
  const safeName = sanitizeFilename(file.name);
  const timestamp = Date.now();
  const safePath = `${normalizedFolder ? `${normalizedFolder}/` : ""}${timestamp}-${safeName}.${uploadExt}`;

  // ── Upload to Supabase Storage ──
  const { error: uploadError } = await serviceSupabase.storage
    .from(bucket)
    .upload(safePath, uploadBody, {
      contentType: uploadMime,
    });

  if (uploadError) return errorResponse(uploadError.message, 500);

  const url = serviceSupabase.storage.from(bucket).getPublicUrl(safePath).data.publicUrl;
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

    // Only allow deleting files from known buckets
    if (!ALLOWED_BUCKETS.has(storageLocation.bucket)) {
      return errorResponse(`Bucket "${storageLocation.bucket}" is not allowed.`, 403);
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
