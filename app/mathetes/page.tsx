import { supabase } from "@/lib/supabase";
import MathetesCard from "@/components/MathetesCard";
import LeadershipCard from "@/components/LeadershipCard";

export const revalidate = 0;

export default async function MathetesPage() {
  const { data: entries, error } = await supabase
    .from("mathetes")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("name", "Mathetes Fellowship")
    .single();

  const { data: incharges } = team
    ? await supabase
        .from("office_bearers")
        .select("*")
        .eq("team_id", team.id)
        .order("display_order", { ascending: true })
    : { data: [] };

  return (
    <main className="px-8 py-16 max-w-5xl mx-auto">
  <img
    src="/mathetes logo.png"
    alt="Mathetes Fellowship"
    className="mx-auto mb-8 h-16 sm:h-20 lg:h-24 xl:h-28 w-auto"
  />

  <h1 className="font-display text-3xl mb-4 text-center">Mathetes</h1>
  <h3 className="font-display text-xl mb-4 text-center">"The way to Jesus"</h3>
  {/* ...rest stays the same */}
      <div className="text-[#231F1E]/80 leading-relaxed mb-10 max-w-2xl space-y-4">
        <p>
          The Mathetes Fellowship is a Youth Ministry initiative that bridges
          the gap between Sunday School and Youth Ministry, nurturing spiritual
          growth, discipleship, leadership, and fellowship among young
          believers. Meeting every Sunday at 10:00 AM, the fellowship builds
          faith through interactive learning, mentorship, and active
          participation.
        </p>
        <p>
          This year&apos;s focus: discipleship and spiritual growth, leadership
          development, greater student involvement, and building healthy
          friendships among members. Members are organized into four groups —
          Faith, Chosen, Anchored, and Elevate — each given opportunities to
          lead fellowship services and activities.
        </p>
      </div>

      {error && (
        <p className="text-red-600">Something went wrong loading this page.</p>
      )}
      {entries && entries.length === 0 && (
        <p className="text-[#231F1E]/60">No entries have been added yet.</p>
      )}

      {/* Cards / photos / events */}
      <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
        {entries?.map((entry) => (
          <div key={entry.id} className="break-inside-avoid">
            <MathetesCard
              title={entry.title}
              description={entry.description}
              photo_url={entry.photo_url}
            />
          </div>
        ))}
      </div>

      {/* Mathetes In-Charges — at the bottom */}
      {incharges && incharges.length > 0 && (
        <section className="mt-20 pt-12 border-t border-[#231F1E]/10">
          <h2 className="font-display text-2xl mb-6">Mathetes In-Charge&apos;s</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {incharges.map((person) => (
              <LeadershipCard key={person.id} {...person} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}