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

/* ─── fringe lines ─────────────────────────────────────── */

/** Desktop fringe: 21 lines, tallest and most opaque at center */
const fringeLines = Array.from({ length: 21 }, (_, i) => {
  const center = 10;
  const dist = Math.abs(i - center) / center;
  return {
    height: Math.round(36 - dist * 22), // 36px → 14px
    opacity: Math.round((0.9 - dist * 0.75) * 100) / 100, // 0.9 → 0.15
  };
});

/** Mobile fringe: 13 lines, shorter overall */
const fringeLinesMobile = Array.from({ length: 13 }, (_, i) => {
  const center = 6;
  const dist = Math.abs(i - center) / center;
  return {
    height: Math.round(24 - dist * 12), // 24px → 12px
    opacity: Math.round((0.8 - dist * 0.65) * 100) / 100, // 0.8 → 0.15
  };
});

/* ─── aims data ─────────────────────────────────────────── */

const aims = [
  {
    numeral: "01",
    title: "Spiritual Growth",
    description:
      "Growing in relationship with God through daily Scripture and quiet time.",
  },
  {
    numeral: "02",
    title: "Freedom to Express",
    description:
      "A platform to think, plan, create, and serve alongside the Church.",
  },
  {
    numeral: "03",
    title: "Fellowship & Discipleship",
    description:
      "Strengthening one another in prayer, community, and the Word.",
  },
  {
    numeral: "04",
    title: "Christ-Centered Living",
    description: "Keeping God first in social and economic life.",
  },
  {
    numeral: "05",
    title: "Evangelism & Service",
    description: "Using our gifts for the glory of Almighty God.",
  },
];

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
        <div
          className="relative max-w-[68ch]"
          style={{
            filter: "drop-shadow(0 12px 30px rgba(107, 31, 42, 0.06))",
          }}
        >
          {/* ── Clipped shell with gold border ── */}
          <div
            className="bg-[#C99A3C]/45 p-[1px]"
            style={{
              clipPath:
                "polygon(0% 0%, 100% 0%, 100% 88%, 50% 100%, 0% 88%)",
            }}
          >
            {/* ── Inner panel ── */}
            <div className="bg-[#FAF6EE]">
              {/* Gold dowel bar across the top */}
              <div
                className="h-1.5 w-full bg-gradient-to-r from-[#C99A3C]/40 via-[#C99A3C] to-[#C99A3C]/40"
                aria-hidden="true"
              />

              {/* ── Aim rows ── */}
              <div className="px-6 sm:px-10 md:px-12 py-10 sm:py-12 md:py-14">
                {aims.map((aim, i) => (
                  <div key={aim.numeral}>
                    <div className="flex items-start gap-4 sm:gap-6">
                      {/* Large gold numeral */}
                      <span className="font-display text-2xl sm:text-3xl md:text-4xl text-[#C99A3C] font-bold leading-none shrink-0 w-9 sm:w-10 md:w-12 text-right">
                        {aim.numeral}
                      </span>
                      {/* Title + description */}
                      <div className="min-w-0">
                        <h3 className="font-display text-sm sm:text-base md:text-lg font-bold text-[#6B1F2A] mb-1">
                          {aim.title}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-[#231F1E]/80 leading-relaxed">
                          {aim.description}
                        </p>
                      </div>
                    </div>
                    {/* Divider between rows */}
                    {i < aims.length - 1 && (
                      <div
                        className="h-px bg-[#231F1E]/[0.08] my-5 sm:my-6 md:my-7"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ── Fringe along bottom taper ── */}
              {/* Desktop fringe */}
              <div
                className="hidden sm:flex justify-center items-end gap-[3px] h-9 pointer-events-none relative -mt-px"
                aria-hidden="true"
              >
                {fringeLines.map((line, i) => (
                  <div
                    key={i}
                    className="w-px bg-[#C99A3C]"
                    style={{
                      height: `${line.height}px`,
                      opacity: line.opacity,
                    }}
                  />
                ))}
              </div>
              {/* Mobile fringe */}
              <div
                className="flex sm:hidden justify-center items-end gap-[2px] h-6 pointer-events-none relative -mt-px"
                aria-hidden="true"
              >
                {fringeLinesMobile.map((line, i) => (
                  <div
                    key={i}
                    className="w-px bg-[#C99A3C]"
                    style={{
                      height: `${line.height}px`,
                      opacity: line.opacity,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ Scripture pull-quote ══════════════════════════ */}
        <div className="mt-16 max-w-2xl">
          <p className="font-display italic leading-relaxed text-base sm:text-lg mb-4">
            &ldquo;being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.&rdquo;
          </p>
          <p className="font-display text-sm text-[#6B1F2A]">
            &mdash; Philippians 1:6
          </p>
        </div>
      </section>
    </main>
  );
}
