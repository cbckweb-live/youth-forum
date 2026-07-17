"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import GenericCrudSection from "@/lib/crud/GenericCrudSection";
import { officeBearersSchema, type OfficeBearer } from "@/lib/crud/schemas";
import type { CrudSchema } from "@/lib/crud/types";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type Team = {
  id: string;
  name: string;
  display_order: number;
};

export default function OfficeBearersSection() {
  const supabase = createSupabaseBrowserClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [confirmDeleteTeamId, setConfirmDeleteTeamId] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const { data } = await supabase.from("teams").select("*").order("display_order", { ascending: true });
        setTeams((data as Team[]) || []);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [supabase]);

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeamError(null);
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
      setTeamError(err instanceof Error ? err.message : "Failed to add team.");
    }
  }

  async function handleDeleteTeam(id: string) {
    setTeamError(null);
    try {
      const response = await fetch("/api/admin/office-bearers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_team", id }),
      });
      if (!response.ok) {
        const text = await response.text();
        setTeamError(text || "Failed to delete team.");
        return;
      }
      setConfirmDeleteTeamId(null);
      const { data } = await supabase.from("teams").select("*").order("display_order", { ascending: true });
      setTeams((data as Team[]) || []);
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : "Failed to delete team.");
    }
  }

  // Merge base schema with OfficeBearers-specific team_id field (dynamic from DB)
  const schema: CrudSchema<OfficeBearer> = {
    ...officeBearersSchema,
    renderCustomFields: ({ form, setForm, editingId }) => (
      <div>
        <label className="block text-sm font-medium text-[#231F1E] dark:text-[#e5e5e5] mb-1">
          Team
        </label>
        <select
          value={String(form.team_id ?? "")}
          onChange={(e) => setForm({ team_id: e.target.value || null })}
          className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5]"
        >
          <option value="">No team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
    ),
  };

  return (
    <>
      {/* Toolbar extension: Manage Teams button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowTeamsModal(true)}
          className="border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors dark:text-[#e5e5e5]"
        >
          Manage Teams
        </button>
      </div>

      <GenericCrudSection schema={schema} />

      {/* Teams Management Modal */}
      {showTeamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg dark:text-[#e5e5e5]">Manage Teams</h2>
              <button onClick={() => setShowTeamsModal(false)} className="text-sm text-[#231F1E]/50 dark:text-gray-400 hover:underline">Close</button>
            </div>
            <form onSubmit={handleAddTeam} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5] flex-1"
              />
              <button type="submit" className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors shrink-0">Add</button>
            </form>
            {teamError && <p className="text-sm text-red-600 mb-3">{teamError}</p>}
            <div className="space-y-2">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50 dark:bg-[#2a2a2a]">
                  <p className="text-sm dark:text-[#e5e5e5]">{team.name}</p>
                  <button onClick={() => setConfirmDeleteTeamId(team.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                </div>
              ))}
              {teams.length === 0 && <p className="text-sm text-[#231F1E]/50 dark:text-gray-400">No teams yet.</p>}
            </div>
          </div>
        </div>
      )}

      {confirmDeleteTeamId && (
        <ConfirmDialog
          message="Delete this team? Members will become unassigned."
          onConfirm={() => handleDeleteTeam(confirmDeleteTeamId)}
          onCancel={() => setConfirmDeleteTeamId(null)}
        />
      )}
    </>
  );
}
