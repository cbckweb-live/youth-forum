import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import EventCard from "@/components/EventCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Events Archive | CBCK Youth Forum",
  description: "Browse past events from the CBCK Youth Ministry calendar.",
  openGraph: {
    title: "Events Archive | CBCK Youth Forum",
    description: "Browse past events from the CBCK Youth Ministry calendar.",
  },
};

export default async function EventsArchivePage() {
  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .lt("event_date", yearStart)
    .order("event_date", { ascending: false });

  return (
    <main className="px-8 py-16 max-w-3xl mx-auto dark:text-[#e5e5e5]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Past Years</h1>
        <Link href="/events" className="text-sm text-[#6B1F2A] dark:text-[#B84C5C] hover:underline">
          ← Back to This Year
        </Link>
      </div>

      {events && events.length === 0 && (
        <p className="text-[#231F1E]/60 dark:text-gray-400">No past events on record yet.</p>
      )}

      <div className="space-y-4">
        {events?.map((event) => (
          <EventCard
            key={event.id}
            title={event.title}
            event_date={event.event_date}
            description={event.description}
          />
        ))}
      </div>
    </main>
  );
}
