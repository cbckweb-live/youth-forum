"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type Episode = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  display_order: number;
};

const emptyEpisode = (): Omit<Episode, "id"> => ({
  title: "",
  description: "",
  youtube_url: "",
  display_order: 1,
});

export default function LivingRoomSection() {
  const supabase = createSupabaseBrowserClient();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [form, setForm] = useState(emptyEpisode());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    const { data } = await supabase
      .from("living_room_seasons")
      .select("*")
      .order("display_order", { ascending: false });
    setEpisodes((data as Episode[]) || []);
  }, [supabase]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchEpisodes();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchEpisodes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/living-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingId ? "update_episode" : "create_episode",
          id: editingId,
          ...form,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save episode.");
      }
      closeModal();
      await fetchEpisodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(episode: Episode) {
    setEditingId(episode.id);
    setForm({
      title: episode.title,
      description: episode.description,
      youtube_url: episode.youtube_url,
      display_order: episode.display_order,
    });
    setShowModal(true);
  }

  function closeModal() {
    setForm(emptyEpisode());
    setEditingId(null);
    setError(null);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch("/api/admin/living-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_episode", id }),
      });
      if (!response.ok) {
        const text = await response.text();
        setError(text || "Failed to delete episode.");
        return;
      }
      setConfirmDeleteId(null);
      void fetchEpisodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete episode.");
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
            setForm(emptyEpisode());
            setShowModal(true);
          }}
          className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors"
        >
          + New Episode
        </button>
      </div>

      <div className="space-y-3">
        {episodes.length > 0 ? (
          episodes.map((episode) => (
            <div
              key={episode.id}
              className="bg-white shadow-sm rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-sm">{episode.title}</p>
                <p className="text-xs text-[#231F1E]/50">
                  Order: {episode.display_order}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => handleEdit(episode)}
                  className="text-[#6B1F2A] hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDeleteId(episode.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#231F1E]/50">No episodes yet.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this episode?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[#231F1E]/40 hover:text-[#231F1E] text-xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
            <h2 className="font-display text-lg mb-5">
              {editingId ? "Edit Episode" : "New Episode"}
            </h2>
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
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                className={inputCls}
              />
              <div>
                <input
                  type="text"
                  placeholder="YouTube URL"
                  value={form.youtube_url || ""}
                  onChange={(e) =>
                    setForm({ ...form, youtube_url: e.target.value })
                  }
                  className={inputCls}
                />
                <p className="text-xs text-[#231F1E]/50 mt-1">
                  Paste any YouTube link — it will embed automatically
                </p>
              </div>
              <input
                type="number"
                placeholder="Display Order"
                value={form.display_order}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setForm({
                    ...form,
                    display_order: Math.max(1, value), // Clamp to minimum of 1
                  });
                }}
                min="1"
                className={inputCls}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Episode"
                      : "Create Episode"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-[#231F1E]/50 hover:underline"
                >
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