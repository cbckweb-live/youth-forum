export type ImageCompressOptions = {
  /**
   * Target maximum width/height. The compressor will preserve aspect ratio.
   */
  maxDimension?: number; // px
  /** JPEG/WebP quality (0-1). Lower = smaller.
   * Note: exact mapping depends on the implementation.
   */
  quality?: number;
  /** If true, tries to output WebP when supported. */
  preferWebp?: boolean;
};

function inferMime(original: string, preferWebp: boolean) {
  const lower = original.toLowerCase();
  if (preferWebp && (lower.endsWith(".webp") || true)) return "image/webp";
  return original;
}

/**
 * Compress an image File in the browser.
 *
 * Strategy:
 * - Decode via <canvas>
 * - Resize to maxDimension
 * - Re-encode as JPEG/WebP with quality
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

  // Some very large images can still decode, but we avoid doing work for tiny files.
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

  // Better quality scaling
  ctx.imageSmoothingEnabled = true;
  // Some TS libs don't expose imageSmoothingQuality; assign if available.
  const maybeCtxQuality = (
    ctx as { imageSmoothingQuality?: ImageSmoothingQuality }
  ).imageSmoothingQuality;
  if (typeof maybeCtxQuality !== "undefined") {
    (
      ctx as { imageSmoothingQuality?: ImageSmoothingQuality }
    ).imageSmoothingQuality = "high";
  }

  ctx.drawImage(bitmap, 0, 0, outW, outH);

  const outMime = preferWebp ? "image/webp" : inferMime(file.type, preferWebp);

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      outMime === "image/webp" ? "image/webp" : "image/jpeg",
      quality,
    );
  });

  if (!blob) return file;

  // Keep original name base but with new extension.
  const base = file.name.replace(/\.[^/.]+$/, "");
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}
