"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAdminCrudSection } from "@/lib/hooks/useAdminCrudSection";
import { useAdminImageUpload } from "@/lib/hooks/useAdminImageUpload";
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

  const {
    records: events,
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
  } = useAdminCrudSection<Event>({
    apiPath: "/api/admin/events",
    actionNames: { create: "create_event", update: "update_event", delete: "delete_event" },
    fetchRecords: async () => {
      const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      return (data as Event[]) || [];
    },
  });

  const { uploadImage, uploadProgress, setUploadProgress } = useAdminImageUpload({
    bucket: "events-media",
    compress: { maxDimension: 1600, quality: 0.78, preferWebp: true },
  });

  const [form, setForm] = useState(emptyEvent());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);

  function handleEdit(event: Event) {
    openEdit(event);
    setPreviousImageUrl(event.image_url);
    setForm({
      title: event.title,
      event_date: event.event_date,
      event_end_date: event.event_end_date,
      description: event.description,
      image_url: event.image_url,
    });
    setImageFile(null);
    setUploadProgress(null);
  }

  function handleCloseModal() {
    resetModal();
    setForm(emptyEvent());
    setPreviousImageUrl(null);
    setImageFile(null);
    setUploadProgress(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadProgress(null);
    await executeSubmit(async () => {
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
          previous_image_url: editingId ? previousImageUrl : null,
          ...payload,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save event.");
      }
    });
    setForm(emptyEvent());
    setImageFile(null);
    setUploadProgress(null);
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
          onClick={() => { openNew(); setForm(emptyEvent()); setImageFile(null); setUploadProgress(null); }}
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
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-[#231F1E]/40 hover:text-[#231F1E] text-xl leading-none" aria-label="Close">✕</button>
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
                <button type="button" onClick={handleCloseModal} className="text-sm text-[#231F1E]/50 hover:underline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
