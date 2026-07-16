"use client";

import { useState } from "react";

type CompressionOptions = {
  maxDimension?: number;
  quality?: number;
  preferWebp?: boolean;
};

type UseAdminImageUploadOptions = {
  bucket: string;
  folder?: string;
  compress?: CompressionOptions;
};

/**
 * Logic-only hook that handles the image upload flow:
 * compress → build FormData → POST /api/admin/media/upload → parse JSON → extract URL.
 *
 * No JSX, no UI. Pass the returned `uploadProgress` to a progress bar if desired.
 */
export function useAdminImageUpload(options: UseAdminImageUploadOptions) {
  const { bucket, folder, compress } = options;
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  async function uploadImage(file: File): Promise<string> {
    setUploadProgress(10);

    let toUpload: File = file;
    if (compress) {
      try {
        const { compressImageFile } = await import("@/lib/compress");
        toUpload = await compressImageFile(file, compress);
      } catch {
        // fallback to original file
      }
    }

    setUploadProgress(30);
    const formData = new FormData();
    formData.append("file", toUpload);
    formData.append("type", "photo");
    formData.append("bucket", bucket);
    if (folder) formData.append("folder", folder);

    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    const result = parseJsonSafely(responseText);

    const errorFromApi = extractError(result);
    if (!response.ok) {
      throw new Error(errorFromApi || responseText || "Failed to upload image.");
    }

    const url = extractUrl(result);
    if (!url) throw new Error("No URL returned from server.");

    setUploadProgress(100);
    return url;
  }

  return { uploadImage, uploadProgress, setUploadProgress };
}

function parseJsonSafely(text: string): unknown {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text };
  }
}

function extractError(result: unknown): string | undefined {
  if (typeof result !== "object" || result === null) return undefined;
  const err = (result as Record<string, unknown>).error;
  return typeof err === "string" ? err : undefined;
}

function extractUrl(result: unknown): string | undefined {
  if (typeof result !== "object" || result === null) return undefined;
  const u = (result as Record<string, unknown>).url;
  return typeof u === "string" ? u : undefined;
}
