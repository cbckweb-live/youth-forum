import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireAdmin, getServiceSupabase } from "@/lib/admin-api-utils";

export type DashboardOverview = {
  counts: {
    posts: number;
    events: number;
    gallery: number;
    mathetes: number;
    office_bearers: number;
    living_room: number;
  };
  recentActivity: {
    id: string;
    table: string;
    label: string;
    subtitle: string;
    updated_at: string;
  }[];
  upcomingEvents: {
    id: string;
    title: string;
    event_date: string;
    event_end_date: string | null;
  }[];
  eventsByMonth: {
    month: string;
    count: number;
  }[];
  emptyTables: string[];
  latestPostTitle: string | null;
  // ─── New additions ───
  storageUsed: {
    totalBytes: number;
    humanReadable: string;
    percentageOfQuota: number;
  } | null;
  databaseSize: {
    sizeBytes: number;
    humanReadable: string;
  } | null;
  keepaliveStatus: {
    lastRunAt: string | null;
    hoursSinceLastRun: number | null;
    healthy: boolean;
  };
  monthlyDeltas: {
    posts: number;
    events: number;
    gallery: number;
  };
  missingImages: {
    gallery: number;
    office_bearers: number;
  };
};

/** GitHub repo info for keepalive workflow */
const GITHUB_OWNER = "cbckweb-live";
const GITHUB_REPO = "youth-forum";
const WORKFLOW_FILENAME = "supabase-keepalive.yml";

export async function GET(request: NextRequest) {
  const response = new NextResponse();
  const auth = await requireAdmin(request, response);
  if ("error" in auth) return auth.error;

  let serverSupabase;
  try {
    serverSupabase = getServerSupabase(request, response);
  } catch {
    return NextResponse.json({ error: "Supabase client misconfigured." }, { status: 500 });
  }

  try {
    // ── Count queries ──
    const [
      postsCount,
      eventsCount,
      galleryCount,
      mathetesCount,
      officeBearersCount,
      livingRoomCount,
      postsRecent,
      eventsRecent,
      galleryRecent,
      mathetesRecent,
      officeBearersRecent,
      livingRoomRecent,
      upcomingEventsRaw,
      allEventsThisYear,
    ] = await Promise.all([
      serverSupabase.from("posts").select("id", { count: "exact", head: true }),
      serverSupabase.from("events").select("id", { count: "exact", head: true }),
      serverSupabase.from("gallery").select("id", { count: "exact", head: true }),
      serverSupabase.from("mathetes").select("id", { count: "exact", head: true }),
      serverSupabase.from("office_bearers").select("id", { count: "exact", head: true }),
      serverSupabase.from("living_room_seasons").select("id", { count: "exact", head: true }),
      serverSupabase.from("posts").select("id,title,created_at").order("created_at", { ascending: false }).limit(5),
      serverSupabase.from("events").select("id,title,event_date,created_at").order("created_at", { ascending: false }).limit(5),
      serverSupabase.from("gallery").select("id,caption,event_tag,created_at").order("created_at", { ascending: false }).limit(5),
      serverSupabase.from("mathetes").select("id,title,created_at").order("created_at", { ascending: false }).limit(5),
      serverSupabase.from("office_bearers").select("id,name,role,updated_at").order("updated_at", { ascending: false }).limit(5),
      serverSupabase.from("living_room_seasons").select("id,title,display_order").order("id", { ascending: false }).limit(5),
      serverSupabase.from("events")
        .select("id,title,event_date,event_end_date")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .limit(10),
      serverSupabase
        .from("events")
        .select("event_date")
        .gte("event_date", `${new Date().getFullYear()}-01-01`)
        .lte("event_date", `${new Date().getFullYear()}-12-31`),
    ]);

    const counts = {
      posts: postsCount.count ?? 0,
      events: eventsCount.count ?? 0,
      gallery: galleryCount.count ?? 0,
      mathetes: mathetesCount.count ?? 0,
      office_bearers: officeBearersCount.count ?? 0,
      living_room: livingRoomCount.count ?? 0,
    };

    // ── Monthly deltas (this month vs last month) ──
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    let monthlyDeltas: DashboardOverview["monthlyDeltas"] = { posts: 0, events: 0, gallery: 0 };

    try {
      const [thisMonthPosts, lastMonthPosts, thisMonthEvents, lastMonthEvents, thisMonthGallery, lastMonthGallery] =
        await Promise.all([
          serverSupabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .gte("created_at", thisMonthStart)
            .lte("created_at", thisMonthEnd),
          serverSupabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .gte("created_at", lastMonthStart)
            .lt("created_at", thisMonthStart),
          serverSupabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .gte("event_date", thisMonthStart)
            .lte("event_date", thisMonthEnd),
          serverSupabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .gte("event_date", lastMonthStart)
            .lt("event_date", thisMonthStart),
          serverSupabase
            .from("gallery")
            .select("id", { count: "exact", head: true })
            .gte("created_at", thisMonthStart)
            .lte("created_at", thisMonthEnd),
          serverSupabase
            .from("gallery")
            .select("id", { count: "exact", head: true })
            .gte("created_at", lastMonthStart)
            .lt("created_at", thisMonthStart),
        ]);
      monthlyDeltas = {
        posts: (thisMonthPosts.count ?? 0) - (lastMonthPosts.count ?? 0),
        events: (thisMonthEvents.count ?? 0) - (lastMonthEvents.count ?? 0),
        gallery: (thisMonthGallery.count ?? 0) - (lastMonthGallery.count ?? 0),
      };
    } catch (e) {
      console.error("[monthlyDeltas] error:", e);
      // Non-fatal — keep defaults
    }

    // ── Missing image warnings ──
    let missingImages: DashboardOverview["missingImages"] = { gallery: 0, office_bearers: 0 };
    try {
      const [missingGallery, missingOfficeBearers] = await Promise.all([
        serverSupabase
          .from("gallery")
          .select("id", { count: "exact", head: true })
          .is("photo_url", null),
        serverSupabase
          .from("office_bearers")
          .select("id", { count: "exact", head: true })
          .is("photo_url", null),
      ]);
      missingImages = {
        gallery: missingGallery.count ?? 0,
        office_bearers: missingOfficeBearers.count ?? 0,
      };
    } catch (e) {
      console.error("[missingImages] error:", e);
    }

    // ── Storage usage (service role) ──
    let storageUsed: DashboardOverview["storageUsed"] = null;
    try {
      const serviceSupabase = getServiceSupabase();
      const { data: storageData, error: storageError } = await serviceSupabase.rpc("get_storage_usage");
      if (!storageError && storageData) {
        const totalBytes = (storageData as Array<{ bucket: string; total_bytes: number; total_mb: number }>).reduce(
          (sum, row) => sum + row.total_bytes,
          0
        );
        const totalMB = totalBytes / (1024 * 1024);
        const quotaBytes = 1024 * 1024 * 1024; // 1 GB free tier
        storageUsed = {
          totalBytes,
          humanReadable: totalBytes >= 1024 * 1024 * 1024
            ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
            : totalBytes >= 1024 * 1024
              ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
              : `${(totalBytes / 1024).toFixed(0)} KB`,
          percentageOfQuota: Math.round((totalBytes / quotaBytes) * 100),
        };
      }
    } catch (e) {
      console.error("[storageUsage] error:", e);
    }

    // ── Database size (service role) ──
    let databaseSize: DashboardOverview["databaseSize"] = null;
    try {
      const serviceSupabase = getServiceSupabase();
      const { data: dbSizeData, error: dbSizeError } = await serviceSupabase.rpc("get_database_size");
      if (!dbSizeError && dbSizeData && (dbSizeData as Array<{ size_bytes: number; size_pretty: string }>).length > 0) {
        const row = (dbSizeData as Array<{ size_bytes: number; size_pretty: string }>)[0];
        databaseSize = {
          sizeBytes: row.size_bytes,
          humanReadable: row.size_pretty,
        };
      }
    } catch (e) {
      console.error("[databaseSize] error:", e);
    }

    // ── Keepalive status (GitHub Actions) ──
    let keepaliveStatus: DashboardOverview["keepaliveStatus"] = { lastRunAt: null, hoursSinceLastRun: null, healthy: true };
    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILENAME}/runs?per_page=1&status=success`,
        {
          headers: { Accept: "application/vnd.github.v3+json" },
          // GitHub API has 60 req/hr for unauthenticated; this is one per page load — fine
          signal: AbortSignal.timeout(5000),
        }
      );
      if (ghRes.ok) {
        const ghData = (await ghRes.json()) as { workflow_runs: Array<{ run_started_at: string; status: string; conclusion: string | null }> };
        if (ghData.workflow_runs && ghData.workflow_runs.length > 0) {
          const lastRun = ghData.workflow_runs[0];
          keepaliveStatus = {
            lastRunAt: lastRun.run_started_at,
            hoursSinceLastRun: Math.floor(
              (Date.now() - new Date(lastRun.run_started_at).getTime()) / (1000 * 60 * 60)
            ),
            healthy: lastRun.conclusion === "success",
          };
        }
      } else {
        // Non-fatal — keep defaults (healthy: true with null times means "unknown")
        keepaliveStatus = { lastRunAt: null, hoursSinceLastRun: null, healthy: true };
      }
    } catch (e) {
      console.error("[keepalive] error:", e);
    }

    // ── Build recent activity ──
    const activity: DashboardOverview["recentActivity"] = [];

    if (!postsRecent.error && postsRecent.data) {
      for (const p of postsRecent.data) {
        activity.push({
          id: p.id,
          table: "posts",
          label: p.title,
          subtitle: "Post",
          updated_at: p.created_at,
        });
      }
    }
    if (!eventsRecent.error && eventsRecent.data) {
      for (const e of eventsRecent.data) {
        activity.push({
          id: e.id,
          table: "events",
          label: e.title,
          subtitle: "Event",
          updated_at: e.created_at,
        });
      }
    }
    if (!galleryRecent.error && galleryRecent.data) {
      for (const g of galleryRecent.data) {
        activity.push({
          id: g.id,
          table: "gallery",
          label: g.caption || g.event_tag || "(untitled)",
          subtitle: "Gallery photo",
          updated_at: g.created_at,
        });
      }
    }
    if (!mathetesRecent.error && mathetesRecent.data) {
      for (const m of mathetesRecent.data) {
        activity.push({
          id: m.id,
          table: "mathetes",
          label: m.title,
          subtitle: "Mathetes entry",
          updated_at: m.created_at,
        });
      }
    }
    if (!officeBearersRecent.error && officeBearersRecent.data) {
      for (const o of officeBearersRecent.data) {
        activity.push({
          id: o.id,
          table: "office_bearers",
          label: o.name,
          subtitle: o.role || "Office bearer",
          updated_at: o.updated_at,
        });
      }
    }

    activity.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    const recentActivity = activity.slice(0, 8);

    // ── Events by month ──
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const eventsByMonth = monthNames.map((month) => ({ month, count: 0 }));

    if (!allEventsThisYear.error && allEventsThisYear.data) {
      for (const ev of allEventsThisYear.data) {
        const monthIndex = new Date(ev.event_date).getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          eventsByMonth[monthIndex].count++;
        }
      }
    }

    // ── Upcoming events ──
    const upcomingEvents = !upcomingEventsRaw.error
      ? (upcomingEventsRaw.data ?? [])
      : [];

    // ── Empty tables ──
    const emptyTables: string[] = [];
    if (counts.posts === 0) emptyTables.push("posts");
    if (counts.events === 0) emptyTables.push("events");
    if (counts.gallery === 0) emptyTables.push("gallery");
    if (counts.mathetes === 0) emptyTables.push("mathetes");
    if (counts.office_bearers === 0) emptyTables.push("office_bearers");
    if (counts.living_room === 0) emptyTables.push("living_room");

    // ── Latest post title ──
    const latestPostTitle =
      !postsRecent.error && postsRecent.data && postsRecent.data.length > 0
        ? postsRecent.data[0].title
        : null;

    return NextResponse.json({
      counts,
      recentActivity,
      upcomingEvents,
      eventsByMonth,
      emptyTables,
      latestPostTitle,
      storageUsed,
      databaseSize,
      keepaliveStatus,
      monthlyDeltas,
      missingImages,
    } satisfies DashboardOverview);
  } catch (err) {
    console.error("[dashboard/overview]", err);
    return NextResponse.json({ error: "Failed to fetch dashboard overview." }, { status: 500 });
  }
}
