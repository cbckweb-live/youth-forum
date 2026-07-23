import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import MathetesCard from "@/components/MathetesCard";
import LeadershipCard from "@/components/LeadershipCard";
import RevealSection from "@/components/RevealSection";

export const metadata: Metadata = {
  title: "Mathetes Fellowship | CBCK Youth Forum",
  description: "The Mathetes Fellowship bridges Sunday School and Youth Ministry, nurturing discipleship, leadership, and fellowship among young believers.",
  openGraph: {
    title: "Mathetes Fellowship | CBCK Youth Forum",
    description: "The Mathetes Fellowship bridges Sunday School and Youth Ministry, nurturing discipleship, leadership, and fellowship among young believers.",
    images: [{ url: "/mathetes-logo.png", width: 800, height: 400 }],
  },
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

type MathetesEntry = {
  id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
};

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
    <main className="px-8 py-16 max-w-5xl mx-auto dark:text-[#e5e5e5]">
      <Image
        src="/mathetes-logo.png"
        alt="Mathetes Fellowship"
        width={480}
        height={240}
        priority
        className="mx-auto mb-8 h-auto w-full max-w-60 sm:max-w-80 md:max-w-100 lg:max-w-120"
        unoptimized
      />

      <h1 className="font-['Copperplate',serif] font-bold text-3xl mb-4 text-center">Mathetes</h1>
      <h3 className="font-['Copperplate',serif] font-bold text-xl mb-4 text-center">&quot; The way to Jesus &quot;</h3>

      <div className="mx-auto text-[#231F1E]/80 dark:text-gray-300 leading-relaxed mb-10 max-w-2xl space-y-4 text-justify">
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

      <RevealSection delay={100} as="section" className="mb-20">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6B1F2A] dark:text-[#B84C5C] mb-2">Updates</p>
            <h2 className="font-display text-2xl">Mathetes Diaries</h2>
          </div>
        </div>

        {entries && entries.length === 0 ? (
          <p className="text-[#231F1E]/60 dark:text-gray-400">No Mathetes entries yet.</p>
        ) : (
          <div
            className="[column-count:1] [column-gap:1.5rem] sm:[column-count:2] lg:[column-count:3]"
          >
            {(entries as MathetesEntry[] | null | undefined)?.map((entry) => (
              <div key={entry.id} className="mb-6 break-inside-avoid">
                <MathetesCard
                  id={entry.id}
                  title={entry.title}
                  description={entry.description}
                  photo_url={entry.photo_url}
                />
              </div>
            ))}
          </div>
        )}
      </RevealSection>

      {/* Mathetes In-Charges — at the bottom */}
      {incharges && incharges.length > 0 && (
        <RevealSection delay={250} as="section" className="mt-20 pt-12 border-t border-[#231F1E]/10 dark:border-white/10">
          <h2 className="font-display text-2xl mb-6">Mathetes In-Charge&apos;s</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {incharges.map((person) => (
              <LeadershipCard key={person.id} {...person} />
            ))}
          </div>
        </RevealSection>
      )}
    </main>
  );
}