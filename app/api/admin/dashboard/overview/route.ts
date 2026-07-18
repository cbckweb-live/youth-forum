import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireAdmin } from "@/lib/admin-api-utils";

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
  emptyTables: string[];
  latestPostTitle: string | null;
};

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
    // Run all queries in parallel
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
    ]);

    const counts = {
      posts: postsCount.count ?? 0,
      events: eventsCount.count ?? 0,
      gallery: galleryCount.count ?? 0,
      mathetes: mathetesCount.count ?? 0,
      office_bearers: officeBearersCount.count ?? 0,
      living_room: livingRoomCount.count ?? 0,
    };

    // Build recent activity feed (interleave and sort by date)
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
    // Living Room episodes don't have timestamps, so they're excluded
    // from the recent activity feed (their count still shows in the grid).

    // Sort by date descending, take top 8
    activity.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    const recentActivity = activity.slice(0, 8);

    // Upcoming events
    const upcomingEvents = !upcomingEventsRaw.error
      ? (upcomingEventsRaw.data ?? [])
      : [];

    // Empty tables
    const emptyTables: string[] = [];
    if (counts.posts === 0) emptyTables.push("posts");
    if (counts.events === 0) emptyTables.push("events");
    if (counts.gallery === 0) emptyTables.push("gallery");
    if (counts.mathetes === 0) emptyTables.push("mathetes");
    if (counts.office_bearers === 0) emptyTables.push("office_bearers");
    if (counts.living_room === 0) emptyTables.push("living_room");

    // Latest post title for quick context
    const latestPostTitle =
      !postsRecent.error && postsRecent.data && postsRecent.data.length > 0
        ? postsRecent.data[0].title
        : null;

    return NextResponse.json({
      counts,
      recentActivity,
      upcomingEvents,
      emptyTables,
      latestPostTitle,
    } satisfies DashboardOverview);
  } catch (err) {
    console.error("[dashboard/overview]", err);
    return NextResponse.json({ error: "Failed to fetch dashboard overview." }, { status: 500 });
  }
}
