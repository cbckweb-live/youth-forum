"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import FileUploadInput from "@/components/admin/FileUploadInput";

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

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
    setPhotos((data as Photo[]) || []);
  }, [supabase]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

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
        const { error: uploadError } = await supabase.storage.from("gallery-media").upload(path, file);
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from("gallery-media").getPublicUrl(path);
        done++;
        setUploadProgress(Math.round((done / total) * 100));
        return { photo_url: data.publicUrl, caption: caption || null, event_tag: eventTag || null };
      });
      const rows = await Promise.all(uploads);
      await supabase.from("gallery").insert(rows);
      setFiles(null);
      setCaption("");
      setEventTag("");
      setUploadProgress(null);
      fetchPhotos();
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : "Please try again."}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this photo?")) return;
    await supabase.from("gallery").delete().eq("id", id);
    fetchPhotos();
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

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
          onChange={(f) => setFiles(f)}
        />
        <input type="text" placeholder="Caption (optional — applies to all)" value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} />
        <input type="text" placeholder="Event tag (e.g. Annual Camp 2024)" value={eventTag} onChange={(e) => setEventTag(e.target.value)} className={inputCls} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
          {saving ? "Uploading..." : "Upload"}
        </button>
      </form>

      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-gray-100">
            <img src={photo.photo_url} alt={photo.caption || ""} className="w-full h-32 object-cover" />
            <div className="p-2">
              {photo.event_tag && <p className="text-xs text-[#6B1F2A] truncate">{photo.event_tag}</p>}
              {photo.caption && <p className="text-xs text-[#231F1E]/60 truncate">{photo.caption}</p>}
            </div>
            <button
              onClick={() => handleDelete(photo.id)}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
