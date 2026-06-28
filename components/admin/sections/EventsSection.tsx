"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import FileUploadInput from "@/components/admin/FileUploadInput";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type Event = {
  id: string;
  title: string;
  event_date: string;
  event_end_date: string | null;
  description: string | null;
  image_url: string | null;
};

const emptyEvent = (): Omit<Event, "id"> => ({
  title: "",
  event_date: "",
  event_end_date: null,
  description: "",
  image_url: null,
});

export default function EventsSection() {
  const supabase = createSupabaseBrowserClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState(emptyEvent());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    setEvents((data as Event[]) || []);
  }, [supabase]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchEvents();
    }, 0);

    return () => window.clearTimeout(id);
  }, [fetchEvents]);

  async function uploadImage(file: File): Promise<string> {
    setUploadProgress(10);
    const { compressImageFile } = await import("@/lib/compress");
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
    setUploadProgress(30);
    const formData = new FormData();
    formData.append("file", toUpload);
    formData.append("type", "photo");
    formData.append("bucket", "events-media");
    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });
    const uploadText = await response.text();
    let uploadResult: unknown;
    try {
      uploadResult = uploadText ? JSON.parse(uploadText) : {};
    } catch {
      uploadResult = { error: uploadText };
    }
    const errorFromApi = (() => {
      if (typeof uploadResult !== "object" || uploadResult === null) return undefined;
      const maybe = uploadResult as Record<string, unknown>;
      const err = maybe["error"];
      return typeof err === "string" ? err : undefined;
    })();
    if (!response.ok) {
      throw new Error(errorFromApi || "Failed to upload image.");
    }
    const url = (() => {
      if (typeof uploadResult !== "object" || uploadResult === null) return undefined;
      const maybe = uploadResult as Record<string, unknown>;
      const u = maybe["url"];
      return typeof u === "string" ? u : undefined;
    })();
    if (!url) throw new Error("No URL returned from server.");
    setUploadProgress(100);
    return url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setUploadProgress(null);
    try {
      let image_url = form.image_url;
      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          throw new Error(`"${imageFile.name}" is not a valid image file.`);
        }
        if (imageFile.size > 20 * 1024 * 1024) {
          throw new Error(`"${imageFile.name}" exceeds 20MB limit. Please select a smaller image.`);
        }
        image_url = await uploadImage(imageFile);
      }
      const payload = { ...form, image_url };
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingId ? "update_event" : "create_event",
          id: editingId,
          ...payload,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save event.");
      }
      closeModal();
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(event: Event) {
    setEditingId(event.id);
    setForm({ title: event.title, event_date: event.event_date, event_end_date: event.event_end_date, description: event.description, image_url: event.image_url });
    setImageFile(null);
    setUploadProgress(null);
    setShowModal(true);
  }

  function closeModal() {
    setForm(emptyEvent());
    setEditingId(null);
    setImageFile(null);
    setUploadProgress(null);
    setError(null);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_event", id }),
      });
      if (!response.ok) {
        const text = await response.text();
        setError(text || "Failed to delete event.");
        return;
      }
      setConfirmDeleteId(null);
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => (e.event_end_date ?? e.event_date) >= today);
  const past = events.filter((e) => (e.event_end_date ?? e.event_date) < today);

  const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  const EventRow = ({ event }: { event: Event }) => (
    <div className="bg-white shadow-sm rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="font-medium text-sm">{event.title}</p>
        <p className="text-xs text-[#231F1E]/50">
          {new Date(event.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          {event.event_end_date && event.event_end_date !== event.event_date && (
            <> — {new Date(event.event_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>
          )}
        </p>
      </div>
      <div className="flex gap-3 text-sm">
        <button onClick={() => handleEdit(event)} className="text-[#6B1F2A] hover:underline">Edit</button>
        <button onClick={() => setConfirmDeleteId(event.id)} className="text-red-500 hover:underline">Delete</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditingId(null); setForm(emptyEvent()); setShowModal(true); }}
          className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors"
        >
          + New Event
        </button>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-3">Upcoming</h3>
        <div className="space-y-3">
          {upcoming.length > 0 ? upcoming.map((e) => <EventRow key={e.id} event={e} />) : (
            <p className="text-sm text-[#231F1E]/50">No upcoming events.</p>
          )}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#231F1E]/40 mb-3">Past Events</h3>
          <div className="space-y-3">
            {past.slice().reverse().map((e) => <EventRow key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {events.length === 0 && <p className="text-sm text-[#231F1E]/50">No events yet.</p>}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this event?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-[#231F1E]/40 hover:text-[#231F1E] text-xl leading-none" aria-label="Close">✕</button>
            <h2 className="font-display text-lg mb-5">{editingId ? "Edit Event" : "New Event"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputCls} />
              <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required className={inputCls} />
              <div>
                <p className="text-xs text-[#231F1E]/50 mb-1">End date (optional — for multi-day events)</p>
                <input type="date" value={form.event_end_date || ""} min={form.event_date} onChange={(e) => setForm({ ...form, event_end_date: e.target.value || null })} className={inputCls} />
              </div>
              <textarea placeholder="Description (optional)" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputCls} />
              <FileUploadInput
                accept="image/*"
                label="Upload event image (optional)"
                file={imageFile}
                currentUrl={form.image_url}
                progress={uploadProgress}
                onChange={(files) => setImageFile(files?.[0] || null)}
                onRemove={() => {
                  setImageFile(null);
                  setForm({ ...form, image_url: null });
                }}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
                  {saving ? "Saving..." : editingId ? "Update Event" : "Create Event"}
                </button>
                <button type="button" onClick={closeModal} className="text-sm text-[#231F1E]/50 hover:underline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}