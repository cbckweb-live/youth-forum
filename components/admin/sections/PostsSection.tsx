"use client";

import { useState } from "react";
import GenericCrudSection from "@/lib/crud/GenericCrudSection";
import { postsSchema, type Post } from "@/lib/crud/schemas";
import FileUploadInput from "@/components/admin/FileUploadInput";
import type { CrudSchema } from "@/lib/crud/types";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function validatePdf(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Invalid file type. Please upload a PDF.";
  if (file.size > MAX_PDF_BYTES) return "File too large. Please upload a PDF smaller than 10 MB.";
  return null;
}

/** Separate component so React hooks work correctly inside .map() */
function PublishToggleButton({ record, refresh }: { record: Post; refresh: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          const response = await fetch("/api/admin/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "toggle_publish",
              id: record.id,
              published: !record.published,
            }),
          });
          if (response.ok) refresh();
        } catch {
          // silent
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className={`${record.published ? "text-green-600" : "text-gray-400"} hover:underline text-sm`}
    >
      {record.published ? "Published" : "Draft"}
    </button>
  );
}

export default function PostsSection() {
  const [mediaType, setMediaType] = useState<"none" | "photo" | "pdf">("none");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);
  const [localMediaType, setLocalMediaType] = useState<"none" | "photo" | "pdf">("none");
  const [localFile, setLocalFile] = useState<File | null>(null);

  async function uploadMedia(file: File, type: "photo" | "pdf"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("bucket", type === "photo" ? "posts-media" : "posts-pdf");
    setPdfUploadProgress(50);

    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    let result: unknown;
    try { result = responseText ? JSON.parse(responseText) : {}; } catch { result = { error: responseText }; }

    const err = (() => {
      if (typeof result !== "object" || result === null) return undefined;
      return typeof (result as Record<string, unknown>).error === "string"
        ? (result as Record<string, unknown>).error as string
        : undefined;
    })();

    if (!response.ok) throw new Error(err || responseText || "Failed to upload media.");

    const url = (() => {
      if (typeof result !== "object" || result === null) return undefined;
      const u = (result as Record<string, unknown>).url;
      return typeof u === "string" ? u : undefined;
    })();

    if (!url) throw new Error("No URL returned from server.");
    setPdfUploadProgress(100);
    return url;
  }

  // Merge the base schema with Posts-specific render functions
  const schema: CrudSchema<Post> = {
    ...postsSchema,
    renderRowActions: (record, refresh) => (
      <PublishToggleButton record={record} refresh={refresh} />
    ),
    renderCustomFields: ({ form, setForm, editingId }) => {
      const currentPhotoUrl = form.photo_url as string | null;
      const currentPdfUrl = form.pdf_url as string | null;

      // Sync local media type when editing modal opens
      const effectiveMediaType = editingId
        ? (currentPhotoUrl ? "photo" : currentPdfUrl ? "pdf" : "none")
        : localMediaType;

      function handleTypeChange(type: "none" | "photo" | "pdf") {
        setLocalMediaType(type);
        setLocalFile(null);
        if (type !== "photo") {
          setForm({ ...form, photo_url: null });
        }
        if (type !== "pdf") {
          setForm({ ...form, pdf_url: null });
        }
      }

      async function handleFileChange(files: FileList | null) {
        const f = files?.[0] || null;
        if (!f) { setLocalFile(null); return; }

        if (effectiveMediaType === "pdf") {
          const validationError = validatePdf(f);
          if (validationError) { alert(validationError); return; }
        }
        if (effectiveMediaType === "photo" && !f.type.startsWith("image/")) {
          alert("Invalid file type. Please upload an image.");
          return;
        }

        setLocalFile(f);

        try {
          const url = await uploadMedia(f, effectiveMediaType === "photo" ? "photo" : "pdf");
          if (effectiveMediaType === "photo") {
            setForm({ ...form, photo_url: url });
          } else {
            setForm({ ...form, pdf_url: url });
          }
        } catch (err) {
          alert(err instanceof Error ? err.message : "Upload failed.");
        } finally {
          setLocalFile(null);
        }
      }

      return (
        <div>
          <p className="text-sm text-[#231F1E]/60 dark:text-gray-400 mb-2">
            Attach media (optional — photo or PDF, not both)
          </p>
          <div className="flex gap-4 mb-3">
            {(["none", "photo", "pdf"] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm capitalize cursor-pointer dark:text-[#e5e5e5]">
                <input
                  type="radio"
                  checked={effectiveMediaType === type}
                  onChange={() => handleTypeChange(type)}
                />
                {type}
              </label>
            ))}
          </div>
          {effectiveMediaType !== "none" && (
            <FileUploadInput
              accept={effectiveMediaType === "photo" ? "image/*" : "application/pdf"}
              label={`Upload ${effectiveMediaType}`}
              file={localFile}
              currentUrl={effectiveMediaType === "photo" ? currentPhotoUrl : currentPdfUrl}
              progress={pdfUploadProgress}
              onChange={handleFileChange}
              onRemove={() => {
                setLocalFile(null);
                if (effectiveMediaType === "photo") setForm({ ...form, photo_url: null });
                else setForm({ ...form, pdf_url: null });
              }}
            />
          )}
        </div>
      );
    },
  };

  return <GenericCrudSection schema={schema} />;
}
