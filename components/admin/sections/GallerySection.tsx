"use client";

import { useState, useMemo, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAdminCrudSection } from "@/lib/hooks/useAdminCrudSection";
import FileUploadInput from "@/components/admin/FileUploadInput";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ImageCropper from "@/components/admin/ImageCropper";
import Image from "next/image";

type Photo = {
  id: string;
  photo_url: string;
  caption: string | null;
  event_tag: string | null;
  created_at: string;
};

export default function GallerySection() {
  const supabase = createSupabaseBrowserClient();

  const {
    records: photos,
    editingId,
    saving,
    error,
    confirmDeleteId,
    openEdit,
    closeModal: resetModal,
    executeSubmit,
    setConfirmDeleteId,
    setError,
    setSaving,
    setEditingId,
    fetchData,
  } = useAdminCrudSection<Photo>({
    apiPath: "/api/admin/gallery",
    actionNames: { create: "create", update: "update", delete: "delete" },
    fetchRecords: async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Photo[]) || [];
    },
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [caption, setCaption] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editEventTag, setEditEventTag] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editCropFile, setEditCropFile] = useState<File | null>(null);
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(null);

  const editPhotoPreviewUrl = useMemo(() =>
    editPhotoFile ? URL.createObjectURL(editPhotoFile) : null,
    [editPhotoFile],
  );

  useEffect(() => {
    return () => {
      if (editPhotoPreviewUrl) URL.revokeObjectURL(editPhotoPreviewUrl);
    };
  }, [editPhotoPreviewUrl]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    setSaving(true);
    setError(null);
    setUploadProgress(0);

    try {
      const total = files.length;
      let done = 0;
      const { compressImageFile } = await import("@/lib/compress");

      const uploads = Array.from(files).map(async (file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error(`"${file.name}" is not a valid image file.`);
        }
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds 20MB limit. Please select a smaller image.`);
        }

        let toUpload: File = file;
        try {
          toUpload = await compressImageFile(file, {
            maxDimension: 1600,
            quality: 0.78,
            preferWebp: true,
          });
        } catch {
          toUpload = file;
        }

        const formData = new FormData();
        formData.append("file", toUpload);
        formData.append("type", "photo");
        formData.append("bucket", "gallery-media");

        const uploadResp = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });

        const uploadText = await uploadResp.text();
        let uploadResult: unknown;
        try {
          uploadResult = uploadText ? JSON.parse(uploadText) : {};
        } catch {
          uploadResult = { error: uploadText };
        }

        const uploadErr = (() => {
          if (typeof uploadResult !== "object" || uploadResult === null) return undefined;
          const maybe = uploadResult as Record<string, unknown>;
          const err = maybe["error"];
          return typeof err === "string" ? err : undefined;
        })();

        if (!uploadResp.ok) {
          throw new Error(uploadErr || "Failed to upload gallery photo.");
        }

        const photoUrl = (() => {
          if (typeof uploadResult !== "object" || uploadResult === null) return undefined;
          const maybe = uploadResult as Record<string, unknown>;
          const u = maybe["url"];
          return typeof u === "string" ? u : undefined;
        })();

        if (!photoUrl) throw new Error("No URL returned from server.");

        done++;
        setUploadProgress(Math.round((done / total) * 100));

        return {
          photo_url: photoUrl,
          caption: caption || null,
          event_tag: eventTag || null,
        };
      });

      const rows = await Promise.all(uploads);

      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const r = maybe["insertedRows"];
        return Array.isArray(r) ? r : undefined;
      })();

      if (!response.ok) {
        throw new Error(errorFromApi || responseText || "Failed to save gallery rows.");
      }

      const latestId = (() => {
        if (!insertedRows?.length) return "none";
        const first = insertedRows[0] as Record<string, unknown>;
        const id = first?.["id"];
        return typeof id === "string" || typeof id === "number" ? String(id) : "none";
      })();

      setDebugInfo(`Inserted ${insertedRows?.length ?? 0} rows. Latest id: ${latestId}`);
      setFiles(null);
      setCaption("");
      setEventTag("");
      setUploadProgress(null);
      fetchData();
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : "Please try again."}`);
      setDebugInfo(null);
    } finally {
      setSaving(false);
    }
  }

  async function updatePhoto(id: string, photoUrl: string, nextCaption: string, nextEventTag: string, prevPhotoUrl?: string | null) {
    const response = await fetch("/api/admin/gallery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        photo_url: photoUrl,
        previous_photo_url: prevPhotoUrl || undefined,
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const responseText = await response.text();
      let result: unknown;
      try { result = responseText ? JSON.parse(responseText) : {}; } catch { result = { error: responseText }; }
      const errorFromApi = (() => {
        if (typeof result !== "object" || result === null) return undefined;
        const maybe = result as Record<string, unknown>;
        const err = maybe["error"];
        return typeof err === "string" ? err : undefined;
      })();
      setError(`Delete failed: ${errorFromApi || responseText || "Please try again."}`);
      return;
    }
    setError(null);
    setConfirmDeleteId(null);
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  return (
    <div>
      <form onSubmit={handleUpload} className="space-y-5 mb-10 bg-white shadow-md rounded-2xl p-6">
        <h2 className="font-display text-lg">Upload Photos</h2>
        <FileUploadInput
          accept="image/*"
          label="Select one or more photos"
          file={files?.[0] || null}
          files={files}
          progress={uploadProgress}
          multiple
          onChange={(f) => {
            if (!f) return setFiles(null);
            const invalid = Array.from(f).find((file) => !file.type.startsWith("image/"));
            if (invalid) {
              alert(`"${invalid.name}" is not a valid image. Please select image files only.`);
              return;
            }
            setFiles(f);
          }}
        />
        <input type="text" placeholder="Caption (optional — applies to all)" value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} />
        <input type="text" placeholder="Event tag (e.g. Annual Camp 2024)" value={eventTag} onChange={(e) => setEventTag(e.target.value)} className={inputCls} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
          {saving ? "Uploading..." : "Upload"}
        </button>
      </form>

      {process.env.NODE_ENV !== "production" && debugInfo && (
        <p className="text-sm text-[#231F1E]/60">{debugInfo}</p>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this photo?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg mb-5">Edit Gallery Photo</h2>
            <div className="relative rounded-xl overflow-hidden border bg-gray-50 mb-4 h-40">
              <Image
                src={editPhotoPreviewUrl || editingPhoto!.photo_url}
                alt={String(editingPhoto?.caption || "")}
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                style={{ objectFit: "cover" }}
                quality={75}
                unoptimized={!!editPhotoFile}
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.jpg"; }}
              />
              {editPhotoFile && (
                <button type="button" onClick={() => setEditCropFile(editPhotoFile)} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-md transition-colors">
                  Crop
                </button>
              )}
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    let photoUrl = editingPhoto!.photo_url;
                    if (editPhotoFile) {
                      const formData = new FormData();
                      formData.append("file", editPhotoFile);
                      formData.append("type", "photo");
                      formData.append("bucket", "gallery-media");
                      const uploadResp = await fetch("/api/admin/media/upload", {
                        method: "POST",
                        body: formData,
                      });
                      if (!uploadResp.ok) {
                        const errorText = await uploadResp.text();
                        throw new Error(errorText || "Failed to upload photo.");
                      }
                      const uploadResult = await uploadResp.json();
                      photoUrl = (uploadResult as Record<string, unknown>).url as string;
                      if (!photoUrl) throw new Error("No URL returned from server.");
                    }
                    await updatePhoto(editingId!, photoUrl, editCaption, editEventTag, previousPhotoUrl);
                    setEditingId(null);
                    setPreviousPhotoUrl(null);
                    setEditCaption("");
                    setEditEventTag("");
                    setEditPhotoFile(null);
                  } catch (err) {
                    setError(`Update failed: ${err instanceof Error ? err.message : "Please try again."}`);
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
            >
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setEditPhotoFile(file); }} className="hidden" id="edit-photo-upload" />
              <label htmlFor="edit-photo-upload" className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#231F1E]/70 hover:bg-gray-50 cursor-pointer">
                Change Photo
              </label>
              <input type="text" placeholder="Caption" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Event tag (optional)" value={editEventTag} onChange={(e) => setEditEventTag(e.target.value)} className={inputCls} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => { setEditingId(null); setPreviousPhotoUrl(null); setEditCaption(""); setEditEventTag(""); setEditPhotoFile(null); setError(null); }} className="text-sm text-[#231F1E]/50 hover:underline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editCropFile && (
        <ImageCropper
          imageFile={editCropFile}
          onCropped={(cropped) => { setEditCropFile(null); if (cropped) setEditPhotoFile(cropped); }}
          onCancel={() => setEditCropFile(null)}
        />
      )}

      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-gray-100 h-32">
            <Image
              src={photo.photo_url}
              alt={String(photo.caption || "")}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: "cover" }}
              quality={75}
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.jpg"; }}
            />
            <div className="p-2">
              {photo.event_tag && <p className="text-xs text-[#6B1F2A] truncate">{photo.event_tag}</p>}
              {photo.caption && <p className="text-xs text-[#231F1E]/60 truncate">{photo.caption}</p>}
            </div>
            <div className="absolute top-2 left-2 flex gap-2 opacity-100 transition-opacity">
              <button
                onClick={() => {
                  openEdit(photo);
                  setEditingPhoto(photo);
                  setPreviousPhotoUrl(photo.photo_url);
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
        {photos.length === 0 && <p className="text-sm text-[#231F1E]/50 col-span-full">No photos yet.</p>}
      </div>
    </div>
  );
}
