"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
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
  const [entries, setEntries] = useState<MathetesEntry[]>([]);
  const [form, setForm] = useState<MathetesForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mathetes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setEntries([]);
      setLoading(false);
      return;
    }

    setError(null);
    setEntries((data as MathetesEntry[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchEntries();
    }, 0);

    return () => window.clearTimeout(id);
  }, [fetchEntries]);

  async function uploadPhoto(file: File): Promise<string> {
    setUploadProgress(10);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "photo");
    formData.append("bucket", "media");
    formData.append("folder", "Mathetes");

    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
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

    if (!response.ok) {
      throw new Error(errorFromApi || responseText || "Failed to upload photo.");
    }

    const url = (() => {
      if (typeof result !== "object" || result === null) return undefined;
      const maybe = result as Record<string, unknown>;
      const u = maybe["url"];
      return typeof u === "string" ? u : undefined;
    })();

    if (!url) throw new Error("No URL returned from server.");
    setUploadProgress(100);
    return url;
  }

  async function deleteUploadedPhoto(url: string) {
    await fetch("/api/admin/media/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setUploadProgress(null);

    let uploadedPhotoUrl: string | null = null;

    try {
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

      if (!response.ok) {
        throw new Error(errorFromApi || responseText || "Failed to save Mathetes entry.");
      }

      closeModal();
      await fetchEntries();
    } catch (err) {
      if (uploadedPhotoUrl) {
        void deleteUploadedPhoto(uploadedPhotoUrl);
      }
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(entry: MathetesEntry) {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      description: entry.description || "",
      photo_url: entry.photo_url,
    });
    setOriginalPhotoUrl(entry.photo_url);
    setPhotoFile(null);
    setUploadProgress(null);
    setShowModal(true);
  }

  function closeModal() {
    setForm(emptyForm());
    setEditingId(null);
    setOriginalPhotoUrl(null);
    setPhotoFile(null);
    setUploadProgress(null);
    setError(null);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch("/api/admin/mathetes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_mathetes", id }),
      });

      if (!response.ok) {
        const text = await response.text();
        setError(text || "Failed to delete Mathetes entry.");
        return;
      }

      setConfirmDeleteId(null);
      void fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete Mathetes entry.");
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingId(null);
            setOriginalPhotoUrl(null);
            setForm(emptyForm());
            setPhotoFile(null);
            setShowModal(true);
          }}
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
            <div
              key={entry.id}
              className="bg-white shadow-sm rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#6B1F2A]/10 border border-gray-100">
                  {entry.photo_url ? (
                    <Image
                      src={entry.photo_url}
                      alt={entry.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-[#6B1F2A]">
                      M
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[#231F1E] truncate">{entry.title}</p>
                  <p className="text-xs text-[#231F1E]/50 mt-1">
                    {new Date(entry.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-[#231F1E]/70 mt-2 max-w-2xl">
                    {entry.description ? truncateText(entry.description, 140) : "No description provided."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 text-sm shrink-0">
                <button onClick={() => handleEdit(entry)} className="text-[#6B1F2A] hover:underline">
                  Edit
                </button>
                <button onClick={() => setConfirmDeleteId(entry.id)} className="text-red-500 hover:underline">
                  Delete
                </button>
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
            <button onClick={closeModal} className="absolute top-4 right-4 text-[#231F1E]/40 hover:text-[#231F1E] text-xl leading-none" aria-label="Close">
              ✕
            </button>
            <h2 className="font-display text-lg mb-5">{editingId ? "Edit Mathetes Entry" : "New Mathetes Entry"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className={inputCls}
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                className={inputCls}
              />
              <FileUploadInput
                accept="image/*"
                label="Upload photo (optional)"
                file={photoFile}
                currentUrl={form.photo_url}
                progress={uploadProgress}
                onChange={(files) => setPhotoFile(files?.[0] || null)}
                onRemove={() => {
                  setPhotoFile(null);
                  setForm({ ...form, photo_url: null });
                }}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Entry" : "Create Entry"}
                </button>
                <button type="button" onClick={closeModal} className="text-sm text-[#231F1E]/50 hover:underline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}