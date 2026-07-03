"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import FileUploadInput from "@/components/admin/FileUploadInput";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Image from "next/image";

type Person = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  team_id: string | null;
  display_order: number;
};

type Team = {
  id: string;
  name: string;
  display_order: number;
};

const emptyPerson = (): Omit<Person, "id" | "display_order"> => ({
  name: "",
  role: "",
  photo_url: null,
  phone: "",
  email: "",
  bio: "",
  team_id: null,
});

export default function OfficeBearersSection() {
  const supabase = createSupabaseBrowserClient();
  const [people, setPeople] = useState<Person[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState(emptyPerson());
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTeamId, setConfirmDeleteTeamId] = useState<string | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    const [{ data: peopleData }, { data: teamsData }] = await Promise.all([
      supabase
        .from("office_bearers")
        .select("*")
        .order("display_order", { ascending: true }),
      supabase
        .from("teams")
        .select("*")
        .order("display_order", { ascending: true }),
    ]);
    setPeople((peopleData as Person[]) || []);
    setTeams((teamsData as Team[]) || []);
  }, [supabase]);

  useEffect(() => {
    // Avoid calling setState synchronously in an effect body; schedule after paint.
    const id = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(id);
  }, [fetchData]);

  async function uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "photo");
    formData.append("bucket", "office-bearers-media");

    setUploadProgress(10);
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
      throw new Error(errorFromApi || "Failed to upload photo.");
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

  async function deletePhotoByUrl(photoUrl: string): Promise<void> {
    const response = await fetch("/api/admin/media/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: photoUrl }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorMessage = responseText || "Failed to delete photo.";
      try {
        const parsed = responseText ? JSON.parse(responseText) : null;
        if (parsed && typeof parsed === "object") {
          const maybeError = (parsed as Record<string, unknown>).error;
          if (typeof maybeError === "string") {
            errorMessage = maybeError;
          }
        }
      } catch {
        // Keep the raw response text if it is not JSON.
      }
      throw new Error(errorMessage);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setUploadProgress(null);
    const previousPhotoUrl = originalPhotoUrl;
    let uploadedPhotoUrl: string | null = null;
    try {
      let photo_url = form.photo_url;
      if (photoFile) {
        photo_url = await uploadPhoto(photoFile);
        uploadedPhotoUrl = photo_url;
      }
      const payload = { ...form, photo_url };

      const response = await fetch("/api/admin/office-bearers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingId ? "update_person" : "create_person",
          id: editingId,
          previous_photo_url: editingId ? previousPhotoUrl : null,
          ...payload,
          display_order: editingId ? undefined : people.length,
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
        throw new Error(
          errorFromApi || responseText || "Failed to save person.",
        );
      }

      setForm(emptyPerson());
      setEditingId(null);
      setOriginalPhotoUrl(null);
      setPhotoFile(null);
      setUploadProgress(null);
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      if (uploadedPhotoUrl) {
        deletePhotoByUrl(uploadedPhotoUrl).catch(console.error);
      }
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(person: Person) {
    setEditingId(person.id);
    setOriginalPhotoUrl(person.photo_url);
    setForm({
      name: person.name,
      role: person.role,
      photo_url: person.photo_url,
      phone: person.phone,
      email: person.email,
      bio: person.bio,
      team_id: person.team_id,
    });
    setPhotoFile(null);
    setUploadProgress(null);
    setShowEditModal(true);
  }

  function handleCloseModal() {
    setForm(emptyPerson());
    setEditingId(null);
    setOriginalPhotoUrl(null);
    setPhotoFile(null);
    setUploadProgress(null);
    setError(null);
    setShowEditModal(false);
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch("/api/admin/office-bearers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_person", id }),
      });

      if (!response.ok) {
        const text = await response.text();
        setError(text || "Failed to delete person.");
        return;
      }

      setConfirmDeleteId(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete person.");
    }
  }

  async function handleRemovePhoto() {
    const photoUrl = form.photo_url;
    if (!photoUrl) return;

    try {
      await deletePhotoByUrl(photoUrl);
      setForm((current) => ({ ...current, photo_url: null }));
      setPhotoFile(null);
      if (originalPhotoUrl === photoUrl) {
        setOriginalPhotoUrl(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete photo.",
      );
    }
  }

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const response = await fetch("/api/admin/office-bearers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_team",
          name: newTeamName.trim(),
          display_order: teams.length,
        }),
      });

      let result: unknown;
      try {
        result = await response.json();
      } catch {
        const text = await response.text();
        throw new Error(text || "Failed to add team.");
      }

      const errorFromApi =
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        typeof (result as Record<string, unknown>).error === "string"
          ? (result as { error: string }).error
          : undefined;

      if (!response.ok) {
        throw new Error(errorFromApi || "Failed to add team.");
      }

      setNewTeamName("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add team.");
    }
  }

  async function handleDeleteTeam(id: string) {
    try {
      const response = await fetch("/api/admin/office-bearers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_team", id }),
      });

      if (!response.ok) {
        const text = await response.text();
        setError(text || "Failed to delete team.");
        return;
      }

      setConfirmDeleteTeamId(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete team.");
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  const filtered = people.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role?.toLowerCase().includes(search.toLowerCase()),
  );

  const PersonForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Full name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        className={inputCls}
      />
      <input
        type="text"
        placeholder="Role / Title"
        value={form.role || ""}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        className={inputCls}
      />
      <input
        type="text"
        placeholder="Phone (optional)"
        value={form.phone || ""}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className={inputCls}
      />
      <input
        type="email"
        placeholder="Email (optional)"
        value={form.email || ""}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={inputCls}
      />
      <select
        value={form.team_id || ""}
        onChange={(e) => setForm({ ...form, team_id: e.target.value || null })}
        className={inputCls}
      >
        <option value="">No team</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <div>
        <label className="block text-sm font-medium text-[#231F1E] mb-2">
          Bio (optional)
        </label>
        <RichTextEditor
          value={form.bio || ""}
          onChange={(val) => setForm({ ...form, bio: val })}
        />
      </div>
      <FileUploadInput
        accept="image/*"
        label="Upload photo (optional)"
        file={photoFile}
        currentUrl={form.photo_url}
        progress={uploadProgress}
        onChange={(files) => setPhotoFile(files?.[0] || null)}
        onRemove={form.photo_url ? handleRemovePhoto : undefined}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : editingId ? "Update" : "Add Person"}
        </button>
        <button
          type="button"
          onClick={handleCloseModal}
          className="text-sm text-[#231F1E]/50 hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Search by name or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-full px-5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] flex-1 min-w-50"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyPerson());
              setShowEditModal(true);
            }}
            className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors"
          >
            + Add Person
          </button>
          <button
            onClick={() => setShowTeamsModal(true)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Manage Teams
          </button>
        </div>
      </div>

      {/* People list */}
      <div className="space-y-3">
        {filtered.map((person) => (
          <div
            key={person.id}
            className="bg-white shadow-sm rounded-xl px-5 py-4 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              {person.photo_url ? (
                  <Image
                    src={person.photo_url}
                    alt={person.name}
                    width={36}
                    height={36}
                    quality={75}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
                    }}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">{person.name}</p>
                <p className="text-xs text-[#231F1E]/50">
                  {person.role || "—"}
                  {person.team_id &&
                    ` · ${teams.find((t) => t.id === person.team_id)?.name}`}
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() => handleEdit(person)}
                className="text-[#6B1F2A] hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDeleteId(person.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[#231F1E]/50">No results.</p>
        )}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this person?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {confirmDeleteTeamId && (
        <ConfirmDialog
          message="Delete this team? Members will become unassigned."
          onConfirm={() => handleDeleteTeam(confirmDeleteTeamId)}
          onCancel={() => setConfirmDeleteTeamId(null)}
        />
      )}

      {/* Edit / Add Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="font-display text-lg">
                {editingId ? "Edit Person" : "Add Person"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close"
                className="w-9 h-9 rounded-full grid place-items-center text-[#231F1E]/60 hover:text-[#231F1E] hover:bg-black/5 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
            {PersonForm}
          </div>
        </div>
      )}

      {/* Teams Modal */}
      {showTeamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg">Manage Teams</h2>
              <button
                onClick={() => setShowTeamsModal(false)}
                className="text-sm text-[#231F1E]/50 hover:underline"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddTeam} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className={`${inputCls} flex-1`}
              />
              <button
                type="submit"
                className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors"
              >
                Add
              </button>
            </form>
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50"
                >
                  <p className="text-sm">{team.name}</p>
                  <button
                    onClick={() => setConfirmDeleteTeamId(team.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {teams.length === 0 && (
                <p className="text-sm text-[#231F1E]/50">No teams yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
