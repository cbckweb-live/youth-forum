"use client";

import { useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAdminCrudSection } from "@/lib/hooks/useAdminCrudSection";
import { useAdminImageUpload } from "@/lib/hooks/useAdminImageUpload";
import FileUploadInput from "@/components/admin/FileUploadInput";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type MathetesEntry = {
  id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
};

type MathetesForm = {
  title: string;
  description: string;
  photo_url: string | null;
};

const emptyForm = (): MathetesForm => ({
  title: "",
  description: "",
  photo_url: null,
});

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

export default function MathetesSection() {
  const supabase = createSupabaseBrowserClient();

  const {
    records: entries,
    editingId,
    showModal,
    saving,
    error,
    confirmDeleteId,
    openNew,
    openEdit,
    closeModal: resetModal,
    executeSubmit,
    handleDelete,
    setConfirmDeleteId,
  } = useAdminCrudSection<MathetesEntry>({
    apiPath: "/api/admin/mathetes",
    actionNames: { create: "create_mathetes", update: "update_mathetes", delete: "delete_mathetes" },
    fetchRecords: async () => {
      const { data, error } = await supabase
        .from("mathetes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as MathetesEntry[]) || [];
    },
  });

  const { uploadImage: uploadPhoto, uploadProgress, setUploadProgress } = useAdminImageUpload({
    bucket: "media",
    folder: "Mathetes",
  });

  const [form, setForm] = useState<MathetesForm>(emptyForm());
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function assertValidSession() {
    const { data } = await supabase.auth.getSession();
    const currentSession = data.session;
    if (!currentSession) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session) {
        throw new Error("Your session has expired or is invalid. Please log in again.");
      }
    }
  }

  async function deleteUploadedPhoto(url: string) {
    await fetch("/api/admin/media/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  }

  function handleEdit(entry: MathetesEntry) {
    openEdit(entry);
    setOriginalPhotoUrl(entry.photo_url);
    setForm({
      title: entry.title,
      description: entry.description || "",
      photo_url: entry.photo_url,
    });
    setPhotoFile(null);
    setUploadProgress(null);
  }

  function handleCloseModal() {
    resetModal();
    setForm(emptyForm());
    setOriginalPhotoUrl(null);
    setPhotoFile(null);
    setUploadProgress(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadProgress(null);
    let uploadedPhotoUrl: string | null = null;
    await executeSubmit(async () => {
      await assertValidSession();
      let photo_url = form.photo_url;
      if (photoFile) {
        if (!photoFile.type.startsWith("image/")) {
          throw new Error(`"${photoFile.name}" is not a valid image file.`);
        }
        if (photoFile.size > 20 * 1024 * 1024) {
          throw new Error(`"${photoFile.name}" exceeds 20MB limit. Please select a smaller image.`);
        }
        photo_url = await uploadPhoto(photoFile);
        uploadedPhotoUrl = photo_url;
      }
      const response = await fetch("/api/admin/mathetes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingId ? "update_mathetes" : "create_mathetes",
          id: editingId,
          previous_photo_url: editingId ? originalPhotoUrl : null,
          title: form.title,
          description: form.description.trim() === "" ? null : form.description,
          photo_url,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save Mathetes entry.");
      }
    });
    setForm(emptyForm());
    setPhotoFile(null);
    setUploadProgress(null);
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => { openNew(); setForm(emptyForm()); setPhotoFile(null); }}
          className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors"
        >
          + New Mathetes Entry
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#231F1E]/50">Loading Mathetes entries...</p>
      ) : entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white shadow-sm rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#6B1F2A]/10 border border-gray-100">
                  {entry.photo_url ? (
                    <Image src={entry.photo_url} alt={entry.title} fill sizes="64px" className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-[#6B1F2A]">M</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[#231F1E] truncate">{entry.title}</p>
                  <p className="text-xs text-[#231F1E]/50 mt-1">
                    {new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-sm text-[#231F1E]/70 mt-2 max-w-2xl">
                    {entry.description ? truncateText(entry.description, 140) : "No description provided."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 text-sm shrink-0">
                <button onClick={() => handleEdit(entry)} className="text-[#6B1F2A] hover:underline">Edit</button>
                <button onClick={() => setConfirmDeleteId(entry.id)} className="text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#231F1E]/50">No Mathetes entries yet.</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this Mathetes entry?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-[#231F1E]/40 hover:text-[#231F1E] text-xl leading-none" aria-label="Close">✕</button>
            <h2 className="font-display text-lg mb-5">{editingId ? "Edit Mathetes Entry" : "New Mathetes Entry"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputCls} />
              <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className={inputCls} />
              <FileUploadInput
                accept="image/*"
                label="Upload photo (optional)"
                file={photoFile}
                currentUrl={form.photo_url}
                progress={uploadProgress}
                onChange={(files) => setPhotoFile(files?.[0] || null)}
                onRemove={() => { setPhotoFile(null); setForm({ ...form, photo_url: null }); }}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
                  {saving ? "Saving..." : editingId ? "Update Entry" : "Create Entry"}
                </button>
                <button type="button" onClick={handleCloseModal} className="text-sm text-[#231F1E]/50 hover:underline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
