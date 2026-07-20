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

/** Colour & icon for the quick-action buttons */
const QUICK_ACTIONS = [
  { tab: "Events", label: "+ Add Event", icon: "📅", color: "bg-amber-600 hover:bg-amber-700" },
  { tab: "Gallery", label: "+ Upload Photos", icon: "🖼️", color: "bg-emerald-600 hover:bg-emerald-700" },
  { tab: "Posts", label: "+ New Post", icon: "📝", color: "bg-blue-600 hover:bg-blue-700" },
] as const;

/** Renders a GitHub Actions workflow status card */
function WorkflowStatusCard({
  icon,
  label,
  subtitle,
  status,
}: {
  icon: string;
  label: string;
  subtitle: string;
  status: { lastRunAt: string | null; hoursSinceLastRun: number | null; healthy: boolean };
}) {
  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-medium text-[#231F1E]/50 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      {status.lastRunAt ? (
        <>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${status.healthy ? "bg-emerald-500" : "bg-red-500"}`} />
            <p className="text-lg font-bold dark:text-[#e5e5e5]">
              {status.hoursSinceLastRun !== null
                ? status.hoursSinceLastRun < 1
                  ? "<1h ago"
                  : status.hoursSinceLastRun < 24
                    ? `${status.hoursSinceLastRun}h ago`
                    : `${Math.floor(status.hoursSinceLastRun / 24)}d ago`
                : "Unknown"}
            </p>
          </div>
          <p className="text-[10px] text-[#231F1E]/40 dark:text-gray-500 mt-0.5">
            {subtitle}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            <p className="text-lg font-bold dark:text-[#e5e5e5] text-gray-400">—</p>
          </div>
          <p className="text-[10px] text-[#231F1E]/40 dark:text-gray-500 mt-0.5">
            No recent run data
          </p>
        </>
      )}
    </div>
  );
}

/** A simple horizontal bar chart for visitors over 8 days */
function VisitorsBarChart({ data }: { data: DashboardOverview['analyticsVisitors'] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 text-center py-8">
        No analytics data available.
      </p>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.visitors), 1);
  const BAR_COLOR = "#6B1F2A";

  return (
    <div className="space-y-1.5">
      {data.map((day) => {
        const pct = Math.max((day.visitors / maxVal) * 100, day.visitors > 0 ? 4 : 0);
        const dateLabel = new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        return (
          <div key={day.date} className="flex items-center gap-3 group">
            <span className="text-[10px] text-[#231F1E]/50 dark:text-gray-400 w-20 shrink-0 text-right leading-none">
              {dateLabel}
            </span>
            <div className="flex-1 h-5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80 dark:bg-[#B84C5C]"
                style={{
                  width: `${pct}%`,
                  backgroundColor: BAR_COLOR,
                }}
              />
            </div>
            <span className="text-xs font-semibold dark:text-[#e5e5e5] w-10 text-right shrink-0 tabular-nums">
              {day.visitors}
            </span>
            <span className="text-[10px] text-[#231F1E]/40 dark:text-gray-500 w-10 text-right shrink-0 tabular-nums">
              {day.pageviews}
            </span>
          </div>
        );
      })}
    </div>
  );
}

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

  /** Renders a small delta indicator for monthly comparison */
  function DeltaBadge({ value }: { value: number }) {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none ${
          isPositive
            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40"
            : "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40"
        }`}
      >
        <span className="text-[10px]">{isPositive ? "▲" : "▼"}</span>
        {Math.abs(value)} this month
      </span>
    );
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

  const {
    counts,
    recentActivity,
    upcomingEvents,
    eventsByMonth,
    emptyTables,
    storageUsed,
    databaseSize,
    keepaliveStatus,
    monthlyDeltas,
    missingImages,
    analyticsVisitors,
    topPages,
    backupStatus,
  } = data;

  return (
    <div className="space-y-8">
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

      {/* ─── Quick-action shortcuts ─── */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.tab}
            onClick={() => goTo(action.tab)}
            className={`inline-flex items-center gap-1.5 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${action.color}`}
          >
            <span className="text-sm">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* ─── Supabase Usage & Health row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Storage used */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💾</span>
            <span className="text-xs font-medium text-[#231F1E]/50 dark:text-gray-400 uppercase tracking-wider">Storage</span>
          </div>
          {storageUsed ? (
            <>
              <p className="text-lg font-bold dark:text-[#e5e5e5]">{storageUsed.humanReadable}</p>
              <p className="text-[10px] text-[#231F1E]/40 dark:text-gray-500 mb-2">of 1 GB free tier</p>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storageUsed.percentageOfQuota > 80
                      ? "bg-red-500"
                      : storageUsed.percentageOfQuota > 50
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(storageUsed.percentageOfQuota, 100)}%` }}
                />
              </div>
              <p className="text-[10px] mt-1 text-[#231F1E]/40 dark:text-gray-500">
                {storageUsed.percentageOfQuota}% used
              </p>
            </>
          ) : (
            <p className="text-sm text-[#231F1E]/40 dark:text-gray-500">Unavailable</p>
          )}
        </div>

        {/* Database size */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🗄️</span>
            <span className="text-xs font-medium text-[#231F1E]/50 dark:text-gray-400 uppercase tracking-wider">Database</span>
          </div>
          {databaseSize ? (
            <>
              <p className="text-lg font-bold dark:text-[#e5e5e5]">{databaseSize.humanReadable}</p>
              <p className="text-[10px] text-[#231F1E]/40 dark:text-gray-500">Current DB size</p>
            </>
          ) : (
            <p className="text-sm text-[#231F1E]/40 dark:text-gray-500">Unavailable</p>
          )}
        </div>

        {/* Keepalive health */}
        <WorkflowStatusCard
          icon="❤️"
          label="Keepalive"
          subtitle="GitHub Actions ping"
          status={keepaliveStatus}
        />

        {/* Backup workflow */}
        <WorkflowStatusCard
          icon="💾"
          label="DB Backup"
          subtitle="Weekly database backup"
          status={backupStatus}
        />
      </div>

      {/* ─── Missing image warnings ─── */}
      {(missingImages.gallery > 0 || missingImages.office_bearers > 0) && (
        <div className="flex flex-wrap gap-2">
          {missingImages.gallery > 0 && (
            <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              <span className="text-sm">🖼️</span>
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  {missingImages.gallery} gallery photo{missingImages.gallery > 1 ? "s" : ""} missing image{missingImages.gallery > 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => goTo("Gallery")}
                  className="text-[10px] text-red-600 dark:text-red-400 underline hover:no-underline"
                >
                  View in Gallery
                </button>
              </div>
            </div>
          )}
          {missingImages.office_bearers > 0 && (
            <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              <span className="text-sm">👤</span>
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  {missingImages.office_bearers} office bearer{missingImages.office_bearers > 1 ? "s" : ""} missing photo{missingImages.office_bearers > 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => goTo("Office Bearers")}
                  className="text-[10px] text-red-600 dark:text-red-400 underline hover:no-underline"
                >
                  View in Office Bearers
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Content counts grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(counts) as (keyof typeof counts)[]).map((key) => (
          <button
            key={key}
            onClick={() => goTo(TABLE_SCHEMA_NAMES[key])}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-md dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 ${TABLE_COLORS[key]}`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xl">{TABLE_ICONS[key]}</span>
              {/* Monthly delta badge — only for posts, events, gallery */}
              {("posts" === key || "events" === key || "gallery" === key) && (
                <DeltaBadge value={monthlyDeltas[key]} />
              )}
            </div>
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

      {/* ─── Site Traffic (Vercel Analytics) ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base dark:text-[#e5e5e5]">Site Traffic</h3>
          <span className="text-xs text-[#231F1E]/40 dark:text-gray-500">
            Last 8 days · visitors / pageviews
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 14-day visitors bar chart */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-[#231F1E]/50 dark:text-gray-400 uppercase tracking-wider">
                Daily Visitors
              </h4>
              {analyticsVisitors.length > 0 && (
                <span className="text-xs text-[#231F1E]/40 dark:text-gray-500 tabular-nums">
                  Total: {analyticsVisitors.reduce((s, d) => s + d.visitors, 0).toLocaleString()}
                </span>
              )}
            </div>
            <VisitorsBarChart data={analyticsVisitors} />
          </div>

          {/* Top pages */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-[#231F1E]/50 dark:text-gray-400 uppercase tracking-wider mb-3">
              Most Visited Pages
            </h4>
            {topPages.length > 0 ? (
              <div className="space-y-1">
                {topPages.map((page, i) => (
                  <div
                    key={page.path}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    <span className="text-[10px] font-bold text-[#231F1E]/30 dark:text-gray-500 w-4 text-right shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs flex-1 truncate dark:text-[#e5e5e5] font-medium">
                      {page.path === "/" ? "Home" : page.path}
                    </span>
                    <span className="text-[10px] text-[#231F1E]/50 dark:text-gray-400 tabular-nums shrink-0">
                      {page.pageviews.toLocaleString()} views
                    </span>
                    <span className="text-[10px] text-[#231F1E]/40 dark:text-gray-500 tabular-nums shrink-0 w-14 text-right">
                      {page.visitors.toLocaleString()} visits
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 text-center py-8">
                Analytics data unavailable. Add VERCEL_ACCESS_TOKEN and VERCEL_PROJECT_ID to load site traffic.
              </p>
            )}
          </div>
        </div>
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
