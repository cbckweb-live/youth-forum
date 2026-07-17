import type { Metadata } from "next";
import AimsPanel from "@/components/AimsPanel";

export const metadata: Metadata = {
  title: "Aim and Vision | CBCK Youth Forum",
  description:
    "The aims and vision of the CBCK Youth Ministry — spiritual growth, discipleship, fellowship, and service.",
  openGraph: {
    title: "Aim and Vision | CBCK Youth Forum",
    description:
      "The aims and vision of the CBCK Youth Ministry — spiritual growth, discipleship, fellowship, and service.",
  },
};

/* ─── component ────────────────────────────────────────── */

export default function AimsPage() {
  return (
    <main className="bg-[#F5F0E6] text-[#231F1E] font-body min-h-screen">
      <section className="animate-fadeIn px-4 sm:px-8 py-16 sm:py-20 max-w-4xl mx-auto">
        {/* ── Page heading ── */}
        <h1 className="font-display text-3xl sm:text-4xl text-[#6B1F2A] mb-8">
          Aim and Vision
        </h1>

        {/* ── Intro paragraph ── */}
        <p className="text-sm sm:text-base leading-[1.7] max-w-[68ch] mb-14">
          The CBCK Youth Ministry, as a sub-unit of the Church, exists to help
          young people grow closer to God and to one another. It is a space
          where the youth are free to think, create, and express themselves,
          while remaining rooted in respect for the Church and active in its
          services and programmes. Through fellowship, prayer, and mutual
          encouragement, the ministry nurtures discipleship — first in the
          individual, then in community — helping young people keep God first
          in every area of life, and equipping them to serve and glorify Him
          through their gifts and witness.
        </p>

        {/* ══ Scroll-banner panel ══════════════════════════ */}
        <AimsPanel />

        {/* ══ Scripture pull-quote ══════════════════════════ */}
        <div className="mt-16 max-w-2xl opacity-0 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <p className="font-display italic leading-relaxed text-base sm:text-lg mb-4">
            &quot;being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.&quot;
          </p>
          <p className="font-display text-sm text-[#6B1F2A]">
            &mdash; Philippians 1:6
          </p>
        </div>
      </section>
    </main>
  );
}
