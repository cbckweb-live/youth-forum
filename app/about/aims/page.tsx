import type { Metadata } from "next";

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

const aims = [
  {
    title: "Spiritual Growth",
    summary:
      "To help young people grow in their relationship with God through daily Scripture reading and quiet time with Him.",
  },
  {
    title: "Freedom to Express",
    summary:
      "To be a platform where young people are given the freedom to think, plan, create and express their opinions, while encouraging them to respect and cooperate with the Church elders and take an active part in the services and programmes of the Youth Ministry.",
  },
  {
    title: "Fellowship and Discipleship",
    summary:
      "To foster regular fellowship among young people and youth workers, strengthening discipleship first as individuals and then as a community, while encouraging the youth to pray for one another and build each other up through the guidance of the Holy Word.",
  },
  {
    title: "Christ-Centered Living",
    summary:
      "To help young people keep God first in their social and economic lives.",
  },
  {
    title: "Evangelism and Service",
    summary:
      "To encourage young people to engage in evangelistic work and use their gifts and abilities for the glory of Almighty God.",
  },
];

export default function AimsPage() {
  return (
    <main className="bg-[#F5F0E6] text-[#231F1E] font-body min-h-screen">
      <section className="animate-fadeIn px-4 sm:px-8 py-16 sm:py-20 max-w-4xl mx-auto">
        {/* ── Heading ── */}
        <h1 className="font-display text-2xl sm:text-3xl text-[#6B1F2A] mb-8">
          Aim and Vision
        </h1>

        {/* ── Body paragraph ── */}
        <p className="text-sm sm:text-base leading-[1.7] max-w-[68ch] mb-14">
          The CBCK Youth Ministry, as a sub-unit of the Church, exists to help young people grow closer to God and to one another. It is a space where the youth are free to think, create, and express themselves, while remaining rooted in respect for the Church and active in its services and programmes. Through fellowship, prayer, and mutual encouragement, the ministry nurtures discipleship — first in the individual, then in community — helping young people keep God first in every area of life, and equipping them to serve and glorify Him through their gifts and witness.
        </p>

        {/* ── Thin gold divider ── */}
        <div
          className="h-px bg-[#C99A3C] max-w-[68ch] mb-14"
          aria-hidden="true"
        />

        {/* ── Aims list ── */}
        <div className="max-w-[68ch] space-y-6">
          {aims.map((aim) => (
            <p
              key={aim.title}
              className="text-sm sm:text-base leading-[1.7]"
            >
              <strong className="font-semibold">{aim.title}:</strong>{" "}
              {aim.summary}
            </p>
          ))}
        </div>

        {/* ── Scripture pull-quote (styled like homepage 1 Timothy 4:12) ── */}
        <div className="mt-16 max-w-2xl">
          <p className="font-display italic leading-relaxed text-base sm:text-lg mb-4">
            &ldquo;[PLACEHOLDER — insert scripture text here]&rdquo;
          </p>
          <p className="font-display text-sm text-[#6B1F2A]">
            &mdash; [PLACEHOLDER — insert reference, e.g. Book Chapter:Verse]
          </p>
        </div>
      </section>
    </main>
  );
}
