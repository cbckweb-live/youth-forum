import { supabase } from "@/lib/supabase";
import EventCard from "@/components/EventCard";
import Link from "next/link";

export const revalidate = 0;

export default async function EventsPage() {
  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", yearStart)
    .lte("event_date", yearEnd)
    .order("event_date", { ascending: true });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events?.filter((e) => (e.event_end_date ?? e.event_date) >= today) || [];
  const past = events?.filter((e) => (e.event_end_date ?? e.event_date) < today).reverse() || [];

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <h1 className="font-display text-2xl sm:text-3xl">{currentYear} Events Calendar</h1>
        <Link href="/events/archive" className="text-sm text-[#6B1F2A] hover:underline">
          View Past Years →
        </Link>
      </div>

      {error && <p className="text-red-600">Something went wrong loading events.</p>}
      {events && events.length === 0 && (
        <p className="text-[#231F1E]/60">No events added for {currentYear} yet.</p>
      )}

      {upcoming.length > 0 && (
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-4">Upcoming</p>
          <div className="space-y-4">
            {upcoming.map((event) => (
              <EventCard key={event.id} title={event.title} event_date={event.event_date} event_end_date={event.event_end_date} description={event.description} image_url={event.image_url} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-[#231F1E]/40 mb-4">Past Events</p>
          <div className="space-y-4">
            {past.map((event) => (
              <EventCard key={event.id} title={event.title} event_date={event.event_date} event_end_date={event.event_end_date} description={event.description} image_url={event.image_url} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
