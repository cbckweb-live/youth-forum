export type ImageCompressOptions = {
  /**
   * Target maximum width/height. The compressor will preserve aspect ratio.
   */
  maxDimension?: number; // px
  /**
   * JPEG/WebP quality (0-1). Lower = smaller.
   */
  quality?: number;
  /** If true, tries to output WebP when supported. */
  preferWebp?: boolean;
};

/**
 * Infer the output MIME type based on the original file type and preferWebp flag.
 *
 * FIX: Removed `|| true` which caused the condition to always return "image/webp"
 * whenever preferWebp was true, regardless of the original file extension.
 * Now correctly falls back to the original MIME type when not a WebP source.
 */
function inferMime(original: string, preferWebp: boolean): string {
  const lower = original.toLowerCase();
  if (preferWebp && lower.endsWith(".webp")) return "image/webp";
  // Normalise to a safe raster MIME; canvas.toBlob supports jpeg and webp reliably.
  if (lower.endsWith(".png")) return "image/png";
  return "image/jpeg";
}

/**
 * Compress an image File in the browser.
 *
 * Strategy:
 * - Decode via createImageBitmap
 * - Resize to maxDimension (preserving aspect ratio)
 * - Re-encode as WebP (with JPEG fallback) at given quality
 *
 * Returns the original file unchanged if:
 * - It is not a raster image type
 * - It is already small (< 250 KB)
 * - Decoding or encoding fails
 */
export async function compressImageFile(
  file: File,
  opts: ImageCompressOptions = {},
): Promise<File> {
  const maxDimension = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.78;
  const preferWebp = opts.preferWebp ?? true;

  // Only handle common raster formats.
  if (!file.type.startsWith("image/")) return file;

  // Avoid unnecessary work for already-small files.
  if (file.size < 250 * 1024) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const { width, height } = bitmap;
  const maxSide = Math.max(width, height);
  const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.imageSmoothingEnabled = true;
  (ctx as CanvasRenderingContext2D & { imageSmoothingQuality?: ImageSmoothingQuality })
    .imageSmoothingQuality = "high";

  ctx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close(); // release memory

  // FIX: preferWebp now drives a direct MIME choice; inferMime is only used as a
  // fallback for non-preferWebp paths. This avoids the previous bug where
  // inferMime always returned "image/webp" due to `|| true`.
  const preferredMime = preferWebp ? "image/webp" : inferMime(file.type, false);

  // FIX: Attempt WebP encoding first. If the browser returns null (unsupported),
  // fall back to JPEG rather than silently returning the original file.
  let blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), preferredMime, quality);
  });

  if (!blob && preferredMime === "image/webp") {
    // Browser does not support WebP encoding — fall back to JPEG.
    blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
  }

  if (!blob) return file;

  // Preserve original file name base with the correct new extension.
  const base = file.name.replace(/\.[^/.]+$/, "");
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}