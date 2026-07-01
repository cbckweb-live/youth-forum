"use client";

import { useState } from "react";
import OfficeBearerCard from "@/components/OfficeBearerCard";
import LeadershipCard from "@/components/LeadershipCard";

type Person = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  team_id: string | null;
};

type Team = {
  id: string;
  name: string;
  display_order: number;
};

type Props = {
  featured: Person[];
  standalone: Person[];
  rest: Person[];
  teams: Team[];
};

export default function OfficeBearersClient({ featured, standalone, rest, teams }: Props) {
  const [query, setQuery] = useState("");

  const q = query.toLowerCase().trim();

  const match = (p: Person) =>
    p.name.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q);

  const filteredFeatured = q ? featured.filter(match) : featured;
  const filteredStandalone = q ? standalone.filter(match) : standalone;
  const filteredRest = q ? rest.filter(match) : rest;
  const isSearching = q.length > 0;

  return (
    <>
      {/* Search bar */}
      <div className="mb-10 max-w-sm mx-auto">
        <input
          type="text"
          placeholder="Search by name or role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-200 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white shadow-sm"
        />
      </div>

      {/* Featured */}
      {filteredFeatured.length > 0 && (
        <section className="mb-12">
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {filteredFeatured.map((person) => (
              <LeadershipCard key={person.id} {...person} />
            ))}
          </div>
        </section>
      )}

      <h1 className="font-display text-center text-3xl mb-10">Office Bearers</h1>

      {/* Standalone */}
      {filteredStandalone.length > 0 && (
        <section className="mb-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredStandalone.map((person) => (
              <OfficeBearerCard key={person.id} {...person} />
            ))}
          </div>
        </section>
      )}

      {/* Teams */}
      {!isSearching &&
        teams.map((team) => {
          const members = rest.filter((p) => p.team_id === team.id);
          if (members.length === 0) return null;
          return (
            <section key={team.id} className="mb-12">
              <h2 className="font-display text-xl mb-4">{team.name}</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {members.map((person) => (
                  <OfficeBearerCard key={person.id} {...person} />
                ))}
              </div>
            </section>
          );
        })}

      {/* When searching, show all team members flat */}
      {isSearching && filteredRest.length > 0 && (
        <section className="mb-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredRest.map((person) => (
              <OfficeBearerCard key={person.id} {...person} />
            ))}
          </div>
        </section>
      )}

      {isSearching && filteredFeatured.length === 0 && filteredStandalone.length === 0 && filteredRest.length === 0 && (
        <p className="text-center text-[#231F1E]/50 text-sm">No results for &quot;{query}&quot;</p>
      )}
    </>
  );
}
