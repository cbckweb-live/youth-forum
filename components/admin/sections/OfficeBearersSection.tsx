"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAdminCrudSection } from "@/lib/hooks/useAdminCrudSection";
import { useAdminImageUpload } from "@/lib/hooks/useAdminImageUpload";
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

  const {
    records: people,
    editingId,
    saving,
    error,
    confirmDeleteId,
    openEdit,
    closeModal: resetModal,
    executeSubmit,
    handleDelete: deletePerson,
    setConfirmDeleteId,
    setEditingId,
    setError,
    fetchData,
    setSaving,
  } = useAdminCrudSection<Person>({
    apiPath: "/api/admin/office-bearers",
    actionNames: { create: "create_person", update: "update_person", delete: "delete_person" },
    fetchRecords: async () => {
      const { data } = await supabase.from("office_bearers").select("*").order("display_order", { ascending: true });
      return (data as Person[]) || [];
    },
  });

  const { uploadImage: uploadPhoto, uploadProgress, setUploadProgress } = useAdminImageUpload({
    bucket: "office-bearers-media",
  });

  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState(emptyPerson());
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDeleteTeamId, setConfirmDeleteTeamId] = useState<string | null>(null);

  // Fetch teams alongside office bearers
  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const { data } = await supabase.from("teams").select("*").order("display_order", { ascending: true });
        setTeams((data as Team[]) || []);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [supabase]);

  async function deletePhotoByUrl(photoUrl: string): Promise<void> {
    const response = await fetch("/api/admin/media/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: photoUrl }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to delete photo.");
    }
  }

  function handleEdit(person: Person) {
    openEdit(person);
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
    resetModal();
    setForm(emptyPerson());
    setOriginalPhotoUrl(null);
    setPhotoFile(null);
    setUploadProgress(null);
    setShowEditModal(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadProgress(null);
    const previousPhotoUrl = originalPhotoUrl;
    await executeSubmit(async () => {
      let uploadedPhotoUrl: string | null = null;
      try {
        let photo_url = form.photo_url;
        if (photoFile) {
          if (!photoFile.type.startsWith("image/")) {
            throw new Error(`"${photoFile.name}" is not a valid image file.`);
          }
          if (photoFile.size > 20 * 1024 * 1024) {
            throw new Error(`"${photoFile.name}" exceeds 20MB limit.`);
          }
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
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to save person.");
        }
      } catch (err) {
        if (uploadedPhotoUrl) {
          deletePhotoByUrl(uploadedPhotoUrl).catch(console.error);
        }
        throw err;
      }
    });
    setForm(emptyPerson());
    setPhotoFile(null);
    setUploadProgress(null);
    setShowEditModal(false);
  }

  async function handleRemovePhoto() {
    const photoUrl = form.photo_url;
    if (!photoUrl) return;
    try {
      await deletePhotoByUrl(photoUrl);
      setForm((current) => ({ ...current, photo_url: null }));
      setPhotoFile(null);
      if (originalPhotoUrl === photoUrl) setOriginalPhotoUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo.");
    }
  }

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const response = await fetch("/api/admin/office-bearers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_team", name: newTeamName.trim(), display_order: teams.length }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to add team.");
      }
      setNewTeamName("");
      const { data } = await supabase.from("teams").select("*").order("display_order", { ascending: true });
      setTeams((data as Team[]) || []);
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
      const { data } = await supabase.from("teams").select("*").order("display_order", { ascending: true });
      setTeams((data as Team[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete team.");
    }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  const filtered = people.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.role?.toLowerCase().includes(search.toLowerCase()),
  );

  const PersonForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
      <input type="text" placeholder="Role / Title" value={form.role || ""} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} />
      <input type="text" placeholder="Phone (optional)" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
      <input type="email" placeholder="Email (optional)" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
      <select value={form.team_id || ""} onChange={(e) => setForm({ ...form, team_id: e.target.value || null })} className={inputCls}>
        <option value="">No team</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <div>              <label className="block text-sm font-medium text-[#231F1E] dark:text-[#e5e5e5] mb-2">Bio (optional)</label>
        <RichTextEditor key={editingId || 'new'} value={form.bio || ""} onChange={(val) => setForm({ ...form, bio: val })} />
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
        <button type="submit" disabled={saving} className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
          {saving ? "Saving..." : editingId ? "Update" : "Add Person"}
        </button>
        <button type="button" onClick={handleCloseModal} className="text-sm text-[#231F1E]/50 dark:text-gray-400 hover:underline">Cancel</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <input type="text" placeholder="Search by name or role..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 dark:border-[#2a2a2a] rounded-full px-5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] flex-1 min-w-50" />
        <div className="flex gap-2">
          <button onClick={() => { setEditingId(null); setForm(emptyPerson()); setShowEditModal(true); }}
            className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors">
            + Add Person
          </button>
          <button onClick={() => setShowTeamsModal(true)}
            className="border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors dark:text-[#e5e5e5]">
            Manage Teams
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((person) => (
          <div key={person.id} className="bg-white dark:bg-[#1e1e1e] shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] rounded-xl px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {person.photo_url ? (
                <Image src={person.photo_url} alt={person.name} width={36} height={36} unoptimized
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.jpg"; }}
                  className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#2a2a2a] shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">{person.name}</p>
                <p className="text-xs text-[#231F1E]/50 dark:text-gray-400">{person.role || "—"}{person.team_id && ` · ${teams.find((t) => t.id === person.team_id)?.name}`}</p>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => handleEdit(person)} className="text-[#6B1F2A] dark:text-[#B84C5C] hover:underline">Edit</button>
              <button onClick={() => setConfirmDeleteId(person.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-[#231F1E]/50 dark:text-gray-400">No results.</p>}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog message="Are you sure you want to delete this person?" onConfirm={() => deletePerson(confirmDeleteId)} onCancel={() => setConfirmDeleteId(null)} />
      )}
      {confirmDeleteTeamId && (
        <ConfirmDialog message="Delete this team? Members will become unassigned." onConfirm={() => handleDeleteTeam(confirmDeleteTeamId)} onCancel={() => setConfirmDeleteTeamId(null)} />
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="font-display text-lg dark:text-[#e5e5e5]">{editingId ? "Edit Person" : "Add Person"}</h2>
              <button type="button" onClick={handleCloseModal} aria-label="Close"
                className="w-9 h-9 rounded-full grid place-items-center text-[#231F1E]/60 dark:text-gray-400 hover:text-[#231F1E] dark:hover:text-[#e5e5e5] hover:bg-black/5 transition-colors shrink-0">✕</button>
            </div>
            {PersonForm}
          </div>
        </div>
      )}

      {showTeamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg dark:text-[#e5e5e5]">Manage Teams</h2>
              <button onClick={() => setShowTeamsModal(false)} className="text-sm text-[#231F1E]/50 dark:text-gray-400 hover:underline">Close</button>
            </div>
            <form onSubmit={handleAddTeam} className="flex gap-2 mb-4">
              <input type="text" placeholder="New team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className={`${inputCls} flex-1`} />
              <button type="submit" className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors">Add</button>
            </form>
            <div className="space-y-2">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50 dark:bg-[#2a2a2a]">
                  <p className="text-sm">{team.name}</p>
                  <button onClick={() => setConfirmDeleteTeamId(team.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                </div>
              ))}
              {teams.length === 0 && <p className="text-sm text-[#231F1E]/50 dark:text-gray-400">No teams yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
