"use client";

import { useState, useMemo, useEffect } from "react";
import GenericCrudSection from "@/lib/crud/GenericCrudSection";
import { gallerySchema, type Photo } from "@/lib/crud/schemas";
import type { CrudSchema } from "@/lib/crud/types";
import FileUploadInput from "@/components/admin/FileUploadInput";
import ImageCropper from "@/components/admin/ImageCropper";
import Image from "next/image";

export default function GallerySection() {
  // ── Bulk upload state ──
  const [files, setFiles] = useState<FileList | null>(null);
  const [bulkCaption, setBulkCaption] = useState("");
  const [bulkEventTag, setBulkEventTag] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [uploadSaving, setUploadSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Edit modal state ──
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editEventTag, setEditEventTag] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editCropFile, setEditCropFile] = useState<File | null>(null);
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const editPhotoPreviewUrl = useMemo(
    () => (editPhotoFile ? URL.createObjectURL(editPhotoFile) : null),
    [editPhotoFile],
  );

  useEffect(() => {
    return () => {
      if (editPhotoPreviewUrl) URL.revokeObjectURL(editPhotoPreviewUrl);
    };
  }, [editPhotoPreviewUrl]);

  // ── Bulk upload ──
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    setUploadSaving(true);
    setUploadError(null);
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
          throw new Error(`"${file.name}" exceeds 20MB limit.`);
        }

        let toUpload: File = file;
        try {
          toUpload = await compressImageFile(file, { maxDimension: 1600, quality: 0.78, preferWebp: true });
        } catch {
          toUpload = file;
        }

        const formData = new FormData();
        formData.append("file", toUpload);
        formData.append("type", "photo");
        formData.append("bucket", "gallery-media");

        const uploadResp = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
        const uploadText = await uploadResp.text();
        let uploadResult: Record<string, unknown> = {};
        try { uploadResult = uploadText ? JSON.parse(uploadText) : {}; } catch { uploadResult = { error: uploadText }; }
        const uploadErr = typeof uploadResult.error === "string" ? uploadResult.error : undefined;
        if (!uploadResp.ok) throw new Error(uploadErr || "Failed to upload gallery photo.");
        const photoUrl = typeof uploadResult.url === "string" ? uploadResult.url : undefined;
        if (!photoUrl) throw new Error("No URL returned from server.");

        done++;
        setUploadProgress(Math.round((done / total) * 100));
        return { photo_url: photoUrl, caption: bulkCaption || null, event_tag: bulkEventTag || null };
      });

      const rows = await Promise.all(uploads);
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_create", rows }),
      });

      const responseText = await response.text();
      let result: Record<string, unknown> = {};
      try { result = responseText ? JSON.parse(responseText) : {}; } catch { result = { error: responseText }; }
      const apiErr = typeof result.error === "string" ? result.error : undefined;
      if (!response.ok) throw new Error(apiErr || responseText || "Failed to save gallery rows.");

      const inserted = Array.isArray(result.insertedRows) ? result.insertedRows : [];
      const latestId = inserted.length > 0 ? String((inserted[0] as Record<string, unknown>)?.id ?? "none") : "none";
      setDebugInfo(`Inserted ${inserted.length} rows. Latest id: ${latestId}`);
      setFiles(null);
      setBulkCaption("");
      setBulkEventTag("");
      setUploadProgress(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setDebugInfo(null);
    } finally {
      setUploadSaving(false);
    }
  }

  // ── Single photo update ──
  async function updatePhotoHandler(id: string, photoUrl: string, nextCaption: string, nextEventTag: string, prevPhotoUrl?: string | null) {
    const response = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
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
  }

  // ── Schema with custom slots ──
  const schema: CrudSchema<Photo> = {
    ...gallerySchema,
    hideToolbar: true,
    renderBeforeList: () => (
      <form onSubmit={handleUpload} className="space-y-5 mb-10 bg-white dark:bg-[#1e1e1e] shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-2xl p-6">
        <h2 className="font-display text-lg dark:text-[#e5e5e5]">Upload Photos</h2>
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
            if (invalid) { alert(`"${invalid.name}" is not a valid image.`); return; }
            setFiles(f);
          }}
        />
        <input type="text" placeholder="Caption (optional — applies to all)" value={bulkCaption}
          onChange={(e) => setBulkCaption(e.target.value)}
          className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5]" />
        <input type="text" placeholder="Event tag (e.g. Annual Camp 2024)" value={bulkEventTag}
          onChange={(e) => setBulkEventTag(e.target.value)}
          className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5]" />
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        <button type="submit" disabled={uploadSaving}
          className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
          {uploadSaving ? "Uploading..." : "Upload"}
        </button>
        {process.env.NODE_ENV !== "production" && debugInfo && (
          <p className="text-sm text-[#231F1E]/60 dark:text-gray-400">{debugInfo}</p>
        )}
      </form>
    ),
    renderList: ({ records, onEdit, onDelete }) => (
      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
        {records.length > 0 ? records.map((photo) => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-[#2a2a2a] h-32">
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
              {photo.event_tag && <p className="text-xs text-[#6B1F2A] dark:text-[#B84C5C] truncate">{photo.event_tag}</p>}
              {photo.caption && <p className="text-xs text-[#231F1E]/60 dark:text-gray-400 truncate">{photo.caption}</p>}
            </div>
            <div className="absolute top-2 left-2 flex gap-2">
              <button
                onClick={() => {
                  setEditingPhoto(photo);
                  setPreviousPhotoUrl(photo.photo_url);
                  setEditCaption(photo.caption ?? "");
                  setEditEventTag(photo.event_tag ?? "");
                  setEditPhotoFile(null);
                  setEditError(null);
                  onEdit(photo);
                }}
                className="bg-white/90 dark:bg-[#2a2a2a]/90 text-[#6B1F2A] dark:text-[#B84C5C] text-xs rounded-full px-3 py-1 border border-white/50 dark:border-white/10"
              >
                Edit
              </button>
            </div>
            <button
              onClick={() => onDelete(photo.id)}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        )) : (
          <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 col-span-full">No photos yet.</p>
        )}
      </div>
    ),
    renderEditModal: ({ onClose, saving, error }) => {
      const photo = editingPhoto;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg mb-5 dark:text-[#e5e5e5]">Edit Gallery Photo</h2>
            <div className="relative rounded-xl overflow-hidden border bg-gray-50 dark:bg-[#2a2a2a] mb-4 h-40">
              <Image
                src={editPhotoPreviewUrl || photo!.photo_url}
                alt={String(photo?.caption || "")}
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                style={{ objectFit: "cover" }}
                quality={75}
                unoptimized={!!editPhotoFile}
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.jpg"; }}
              />
              {editPhotoFile && (
                <button type="button" onClick={() => setEditCropFile(editPhotoFile!)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-md transition-colors">
                  Crop
                </button>
              )}
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              if (!photo) return;
              setEditSaving(true);
              setEditError(null);
              try {
                let photoUrl = photo.photo_url;
                if (editPhotoFile) {
                  const formData = new FormData();
                  formData.append("file", editPhotoFile);
                  formData.append("type", "photo");
                  formData.append("bucket", "gallery-media");
                  const uploadResp = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
                  if (!uploadResp.ok) throw new Error((await uploadResp.text()) || "Failed to upload photo.");
                  const uploadResult = await uploadResp.json() as Record<string, unknown>;
                  photoUrl = uploadResult.url as string;
                  if (!photoUrl) throw new Error("No URL returned from server.");
                }
                await updatePhotoHandler(photo.id, photoUrl, editCaption, editEventTag, previousPhotoUrl);
                onClose();
                setEditPhotoFile(null);
              } catch (err) {
                setEditError(err instanceof Error ? err.message : "Update failed.");
              } finally {
                setEditSaving(false);
              }
            }}>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setEditPhotoFile(f); }}
                className="hidden" id="edit-photo-upload" />
              <label htmlFor="edit-photo-upload"
                className="flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-[#231F1E]/70 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer">
                Change Photo
              </label>
              <input type="text" placeholder="Caption" value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5]" />
              <input type="text" placeholder="Event tag (optional)" value={editEventTag}
                onChange={(e) => setEditEventTag(e.target.value)}
                className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5]" />
              {(editError || error) && <p className="text-sm text-red-600">{editError || error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editSaving || saving}
                  className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
                  {editSaving ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => { onClose(); setEditPhotoFile(null); setEditError(null); }}
                  className="text-sm text-[#231F1E]/50 dark:text-gray-400 hover:underline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      );
    },
  };

  return (
    <>
      <GenericCrudSection schema={schema} />
      {editCropFile && editingPhoto && (
        <ImageCropper
          imageFile={editCropFile}
          onCropped={(cropped) => { setEditCropFile(null); if (cropped) setEditPhotoFile(cropped); }}
          onCancel={() => setEditCropFile(null)}
        />
      )}
    </>
  );
}
