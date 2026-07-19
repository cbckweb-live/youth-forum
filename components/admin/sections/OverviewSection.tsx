"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardOverview } from "@/app/api/admin/dashboard/overview/route";
import EventsLineChart from "@/components/admin/EventsLineChart";

const TABLE_LABELS: Record<string, string> = {
  posts: "Posts",
  events: "Events",
  gallery: "Gallery",
  mathetes: "Mathetes",
  office_bearers: "Office Bearers",
  living_room: "Living Room",
};

const TABLE_ICONS: Record<string, string> = {
  posts: "📝",
  events: "📅",
  gallery: "🖼️",
  mathetes: "📖",
  office_bearers: "👥",
  living_room: "🎙️",
};

const TABLE_COLORS: Record<string, string> = {
  posts: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  events: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  gallery: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  mathetes: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
  office_bearers: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
  living_room: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800",
};

const TABLE_SCHEMA_NAMES: Record<string, string> = {
  posts: "Posts",
  events: "Events",
  gallery: "Gallery",
  mathetes: "Mathetes",
  office_bearers: "Office Bearers",
  living_room: "Living Room",
};

export default function OverviewSection({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard/overview");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load overview.");
      }
      const json = await res.json();
      setData(json as DashboardOverview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function goTo(tabName: string) {
    onNavigate?.(tabName);
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function timeAgo(iso: string) {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return formatDate(iso);
    } catch {
      return iso;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#6B1F2A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
        <button onClick={load} className="text-[#6B1F2A] dark:text-[#B84C5C] underline text-sm">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { counts, recentActivity, upcomingEvents, eventsByMonth, emptyTables } = data;

  return (
    <div className="space-y-10">
      {/* ─── Welcome header ─── */}
      <div>
        <h2 className="font-display text-xl dark:text-[#e5e5e5]">Dashboard Overview</h2>
        <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ─── Content counts grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(counts) as (keyof typeof counts)[]).map((key) => (
          <button
            key={key}
            onClick={() => goTo(TABLE_SCHEMA_NAMES[key])}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-md dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 ${TABLE_COLORS[key]}`}
          >
            <span className="text-xl">{TABLE_ICONS[key]}</span>
            <p className="text-2xl font-bold mt-2 dark:text-[#e5e5e5]">
              {counts[key]}
            </p>
            <p className="text-xs text-[#231F1E]/60 dark:text-gray-400 mt-0.5">
              {TABLE_LABELS[key]}
            </p>
          </button>
        ))}
      </div>

      {/* ─── Quick flags ─── */}
      {(upcomingEvents.length > 0 || emptyTables.length > 0) && (
        <div className="space-y-2">
          {upcomingEvents.length > 0 && (
            <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <span className="text-lg shrink-0 mt-0.5">📌</span>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {upcomingEvents.length} upcoming event{upcomingEvents.length > 1 ? "s" : ""} this month
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {upcomingEvents.slice(0, 4).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => goTo("Events")}
                      className="text-xs bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-full px-2.5 py-0.5 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
                    >
                      {formatDate(ev.event_date)} — {ev.title.length > 30 ? ev.title.slice(0, 30) + "…" : ev.title}
                    </button>
                  ))}
                  {upcomingEvents.length > 4 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 self-center">
                      +{upcomingEvents.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {emptyTables.length > 0 && (
            <div className="flex items-start gap-2.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-xl px-4 py-3">
              <span className="text-lg shrink-0 mt-0.5">💡</span>
              <div>
                <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
                  Empty sections — get started!
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {emptyTables.map((t) => (
                    <button
                      key={t}
                      onClick={() => goTo(TABLE_SCHEMA_NAMES[t])}
                      className="text-xs bg-white dark:bg-sky-950/40 border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300 rounded-full px-2.5 py-0.5 hover:bg-sky-100 dark:hover:bg-sky-950/60 transition-colors"
                    >
                      {TABLE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Events by Month line chart ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base dark:text-[#e5e5e5]">Events per Month</h3>
          <span className="text-xs text-[#231F1E]/40 dark:text-gray-500">
            {new Date().getFullYear()}
          </span>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-3 sm:p-4 max-w-md">
          {eventsByMonth.some((m) => m.count > 0) ? (
            <EventsLineChart data={eventsByMonth} />
          ) : (
            <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 text-center py-8">
              No events added for this year yet.
            </p>
          )}
        </div>
      </div>

      {/* ─── Quick-add buttons ─── */}
      <div className="flex flex-wrap gap-2">
        {(["Posts", "Events", "Gallery"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => goTo(tab)}
            className="bg-[#6B1F2A] text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors shadow-sm"
          >
            + New {tab === "Gallery" ? "Photos" : tab === "Events" ? "Event" : "Post"}
          </button>
        ))}
      </div>

      {/* ─── Recent Activity ─── */}
      <div>
        <h3 className="font-display text-base dark:text-[#e5e5e5] mb-4">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-1.5">
            {recentActivity.map((item) => (
              <button
                key={`${item.table}-${item.id}`}
                onClick={() => goTo(TABLE_SCHEMA_NAMES[item.table] || item.table)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors text-left"
              >
                <span className="text-base shrink-0">{TABLE_ICONS[item.table] || "📄"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate dark:text-[#e5e5e5]">
                    {item.label}
                  </p>
                  <p className="text-xs text-[#231F1E]/50 dark:text-gray-400">
                    {item.subtitle}
                  </p>
                </div>
                <span className="text-xs text-[#231F1E]/40 dark:text-gray-500 shrink-0">
                  {timeAgo(item.updated_at)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 text-center py-8">
            No activity yet. Create your first piece of content!
          </p>
        )}
      </div>
    </div>
  );
}
