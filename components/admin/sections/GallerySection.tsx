"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import FileUploadInput from "@/components/admin/FileUploadInput";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type Photo = {
  id: string;
  photo_url: string;
  caption: string | null;
  event_tag: string | null;
  created_at: string;
};

export default function GallerySection() {
  const supabase = createSupabaseBrowserClient();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [caption, setCaption] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editEventTag, setEditEventTag] = useState("");

  const fetchPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError(`Unable to load gallery: ${error.message}`);
      setPhotos([]);
      return;
    }
    setError(null);
    setPhotos((data as Photo[]) || []);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPhotos();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchPhotos]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    setSaving(true);
    setError(null);
    setUploadProgress(0);
    try {
      const total = files.length;
      let done = 0;
      const uploads = Array.from(files).map(async (file, i) => {
        const path = `${Date.now()}-${i}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("gallery-media")
          .upload(path, file);
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage
          .from("gallery-media")
          .getPublicUrl(path);
        if (!data?.publicUrl)
          throw new Error("Unable to create public URL for uploaded file.");
        done++;
        setUploadProgress(Math.round((done / total) * 100));
        return {
          photo_url: data.publicUrl,
          caption: caption || null,
          event_tag: eventTag || null,
        };
      });
      const rows = await Promise.all(uploads);
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows }),
      });

      const responseText = await response.text();
      let result: unknown;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = { error: responseText };
      }

      const errorFromApi = (() => {
        if (typeof result !== "object" || result === null) return undefined;
        const maybe = result as Record<string, unknown>;
        const err = maybe["error"];
        return typeof err === "string" ? err : undefined;
      })();

      const insertedRows = (() => {
        if (typeof result !== "object" || result === null) return undefined;
        const maybe = result as Record<string, unknown>;
        const rows = maybe["insertedRows"];
        return Array.isArray(rows) ? rows : undefined;
      })();

      if (!response.ok) {
        throw new Error(
          errorFromApi || responseText || "Failed to save gallery rows.",
        );
      }

      const latestId = (() => {
        if (!insertedRows?.length) return "none";
        const first = insertedRows[0] as Record<string, unknown>;
        const id = first?.["id"];
        return typeof id === "string" || typeof id === "number"
          ? String(id)
          : "none";
      })();

      setDebugInfo(
        `Inserted ${insertedRows?.length ?? 0} rows. Latest id: ${latestId}`,
      );
      setFiles(null);
      setCaption("");
      setEventTag("");
      setUploadProgress(null);
      fetchPhotos();
    } catch (err) {
      setError(
        `Upload failed: ${err instanceof Error ? err.message : "Please try again."}`,
      );
      setDebugInfo(null);
    } finally {
      setSaving(false);
    }
  }

  async function updateCaptionTag(
    id: string,
    nextCaption: string,
    nextEventTag: string,
  ) {
    const response = await fetch("/api/admin/gallery", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        caption: nextCaption.trim() === "" ? null : nextCaption,
        event_tag: nextEventTag.trim() === "" ? null : nextEventTag,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to update gallery item.");
    }

    return response;
  }

  async function handleDelete(id: string) {
    const response = await fetch("/api/admin/gallery", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      setError(`Delete failed: ${errorText}`);
      return;
    }

    setConfirmDeleteId(null);
    fetchPhotos();
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  return (
    <div>
      <form
        onSubmit={handleUpload}
        className="space-y-5 mb-10 bg-white shadow-md rounded-2xl p-6"
      >
        <h2 className="font-display text-lg">Upload Photos</h2>
        <FileUploadInput
          accept="image/*"
          label="Select one or more photos"
          file={files?.[0] || null}
          files={files}
          progress={uploadProgress}
          multiple
          onChange={(f) => setFiles(f)}
        />
        <input
          type="text"
          placeholder="Caption (optional — applies to all)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={inputCls}
        />
        <input
          type="text"
          placeholder="Event tag (e.g. Annual Camp 2024)"
          value={eventTag}
          onChange={(e) => setEventTag(e.target.value)}
          className={inputCls}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
        >
          {saving ? "Uploading..." : "Upload"}
        </button>
      </form>

      {debugInfo && <p className="text-sm text-[#231F1E]/60">{debugInfo}</p>}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this photo?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Edit modal */}

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg mb-5">Edit Gallery Photo</h2>
            <div className="rounded-xl overflow-hidden border bg-gray-50 mb-4">
              <img
                src={editingPhoto?.photo_url}
                alt={editingPhoto?.caption || ""}
                className="w-full h-40 object-cover"
              />
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  try {
                    setSaving(true);
                    setError(null);
                    await updateCaptionTag(
                      editingId!,
                      editCaption,
                      editEventTag,
                    );
                    setEditingId(null);
                    setEditCaption("");
                    setEditEventTag("");
                    await fetchPhotos();
                  } catch (err) {
                    setError(
                      `Update failed: ${
                        err instanceof Error ? err.message : "Please try again."
                      }`,
                    );
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
            >
              <input
                type="text"
                placeholder="Caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className={inputCls}
              />
              <input
                type="text"
                placeholder="Event tag (optional)"
                value={editEventTag}
                onChange={(e) => setEditEventTag(e.target.value)}
                className={inputCls}
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditCaption("");
                    setEditEventTag("");
                    setError(null);
                  }}
                  className="text-sm text-[#231F1E]/50 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group rounded-xl overflow-hidden bg-gray-100"
          >
            <img
              src={photo.photo_url}
              alt={photo.caption || ""}
              className="w-full h-32 object-cover"
            />
            <div className="p-2">
              {photo.event_tag && (
                <p className="text-xs text-[#6B1F2A] truncate">
                  {photo.event_tag}
                </p>
              )}
              {photo.caption && (
                <p className="text-xs text-[#231F1E]/60 truncate">
                  {photo.caption}
                </p>
              )}
            </div>

            <div className="absolute top-2 left-2 flex gap-2 opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingId(photo.id);
                  setEditingPhoto(photo);
                  setEditCaption(photo.caption ?? "");
                  setEditEventTag(photo.event_tag ?? "");
                  setError(null);
                }}
                className="bg-white/90 text-[#6B1F2A] text-xs rounded-full px-3 py-1 border border-white/50"
              >
                Edit
              </button>
            </div>

            <button
              onClick={() => setConfirmDeleteId(photo.id)}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length === 0 && (
          <p className="text-sm text-[#231F1E]/50 col-span-full">
            No photos yet.
          </p>
        )}
      </div>
    </div>
  );
}
