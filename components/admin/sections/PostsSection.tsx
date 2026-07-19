"use client";

import { useState } from "react";
import GenericCrudSection from "@/lib/crud/GenericCrudSection";
import { showToast } from "@/components/admin/Toast";
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
  const isPublished = record.published;

  return (
    <button
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        try {
          const response = await fetch("/api/admin/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "toggle_publish",
              id: record.id,
              published: !isPublished,
            }),
          });

          if (response.ok) {
            refresh();
            const action = isPublished ? "unpublished" : "published";
            showToast(`Post ${action} successfully`);
          } else {
            const text = await response.text().catch(() => "");
            showToast(`Publish failed: ${text || response.status}`, "error");
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Publish failed.";
          showToast(msg, "error");
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      aria-label={isPublished ? "Click to unpublish this post" : "Click to publish this post"}
      aria-pressed={isPublished}
      title={isPublished ? "Published — click to unpublish" : "Draft — click to publish"}
      className={
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 " +
        (isPublished
          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 focus-visible:ring-green-500 "
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 focus-visible:ring-amber-500 ") +
        (loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer")
      }
    >
      {loading ? (
        <>
          {/* Spinner icon */}
          <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="sr-only">Toggling…</span>
        </>
      ) : isPublished ? (
        <>
          {/* Checkmark icon */}
          <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          Published
        </>
      ) : (
        <>
          {/* Draft/eye icon */}
          <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Draft
        </>
      )}
    </button>
  );
}

export default function PostsSection() {
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
          if (validationError) { showToast(validationError, "error"); return; }
        }
        if (effectiveMediaType === "photo" && !f.type.startsWith("image/")) {
          showToast("Invalid file type. Please upload an image.", "error");
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
          showToast(err instanceof Error ? err.message : "Upload failed.", "error");
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
