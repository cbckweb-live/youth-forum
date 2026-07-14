/* ─── chapter data ───────────────────────────────────────────── */
const chapters = [
  {
    id: "foundation",
    year: "Est. 1968",
    tag: "The Beginning",
    heading: "Established in Faith",
    body: "The Youth Ministry of Chakhesang Baptist Church, Kohima was established in 1968, eight years after the establishment of the church. Since its inception, the ministry has served as a platform for nurturing young believers in their spiritual journey, equipping them for Christian leadership, and encouraging active participation in the life and mission of the church.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80",
    imageAlt: "Young believers gathered in worship and fellowship",
    imageLeft: true,
    cta: null,
  },
  {
    id: "growth",
    year: "Golden Jubilee 2018",
    tag: "Decades of Growth",
    heading: "The Year of God's Faithfulness",
    body: "Through the decades, the ministry has grown alongside the church, and has impacted many lives. From a handful of a hundred members, today, the ministry has grown into one of the largest departments within the church, with more than 1,000 members. In 2018, the ministry joyfully celebrated its Golden Jubilee, marking fifty years of God's faithfulness, spiritual growth, and dedicated service. The celebration not only reflected on the rich legacy of the past but also reaffirmed the ministry's commitment to raising Christ-centred leaders for the future.",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=900&q=80",
    imageAlt: "Large community gathering celebrating the Golden Jubilee",
    imageLeft: false,
    cta: null,
  },
  {
    id: "mathetes",
    year: "Present Day",
    tag: "Present & Future",
    heading: "Mathetes — The Next Generation",
    body: "To better minister to the varying needs of young people, the ministry includes a dedicated group known as Mathetes, specifically for Class XI and XII students (approximately 16–18 years of age). This transitional group focuses on discipleship, spiritual formation, mentoring, and preparing young believers for greater involvement in the wider Youth Ministry. The ministry continues to widen its scope of outreach — with the purpose solely being transformation and to be a living witness of God's faithfulness.",
    image: "/mathetesJ.jpg",
    imageAlt: "Young students in a discipleship and mentorship circle",
    imageLeft: true,
    cta: { label: "Know More", href: "/mathetes" },
  },
];

/* ─── timeline ───────────────────────────────────────────────── */
const milestones = [
  { year: "1960", label: "Church founded" },
  { year: "1968", label: "Youth Ministry established" },
  { year: "2018", label: "Golden Jubilee" },
  { year: "Today", label: "1,000+ members" },
];

/* ─── pull quote ─────────────────────────────────────────────── */
const pullQuote =
  "Fifty years of God's faithfulness, spiritual growth, and dedicated service — and still, the best is yet to come.";

export default function JourneyPage() {
  return (
    <main className="overflow-x-hidden bg-white text-[#1c1b1a] font-body min-h-screen">
      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative text-center overflow-hidden min-h-[420px]">

        {/* background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/background.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* dark gradient overlay for legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(10,8,6,0.55)_0%,rgba(10,8,6,0.45)_60%,rgba(10,8,6,0.70)_100%)]"
        />

        {/* text written directly over the image */}
        <div className="relative z-10 py-32 px-6 flex flex-col items-center text-[#f7f3ea]">
          <p className="uppercase font-semibold mb-3 text-[#f8f8ff] tracking-[0.35em] text-[0.78rem]">
            Our Story
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-5 text-[#c9a84c]">
            Our Journey
          </h1>
          <p className="mx-auto text-base leading-relaxed mb-10 max-w-2xl">
            From a small fellowship planted in 1968 to a thriving community of over 1,000 members
            — this is the story of the CBCK Youth Ministry.
          </p>
        </div>
      </section>

      {/* ── thin lifted divider ── */}
      <div className="px-10 md:px-24" aria-hidden="true">
        <div className="h-px bg-[rgba(28,27,26,0.10)] shadow-[0_2px_8px_rgba(0,0,0,0.10),0_1px_2px_rgba(0,0,0,0.08)] rounded-full" />
      </div>

      {/* ══ TIMELINE STRIP ════════════════════════════════════ */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-light rounded-3xl px-12 py-10">
            <div className="relative flex items-start justify-between">
              {/* connecting line */}
              <div
                className="absolute left-0 right-0 top-[14px] h-[3px] rounded-full bg-[rgba(120,30,30,0.22)]"
                aria-hidden="true"
              />
              {milestones.map((m) => (
                <div key={m.year} className="relative z-10 flex flex-col items-center gap-3 flex-1">
                  {/* maroon dot */}
                  <div className="flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-[#7b1f1f] shadow-[0_0_0_5px_rgba(123,31,31,0.15),0_0_0_9px_rgba(123,31,31,0.06),0_4px_10px_rgba(0,0,0,0.20)]" />
                  </div>
                  <span className="font-bold text-center text-[#1c1b1a] text-base">
                    {m.year}
                  </span>
                  <span className="text-center hidden sm:block leading-snug text-[rgba(28,27,26,0.55)] text-xs">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CHAPTER SECTIONS ════════════════════════════════════ */}
      {chapters.map((ch) => (
        <section key={ch.id} id={ch.id} className="py-14 px-6">
          <div className="max-w-5xl mx-auto">
            <div
              className={`flex flex-col ${
                ch.imageLeft ? "md:flex-row" : "md:flex-row-reverse"
              } gap-8 md:gap-14 items-stretch`}
            >
              {/* ── Image card ── */}
              <div className="w-full md:w-5/12 shrink-0">
                <div className="glass-light rounded-2xl overflow-hidden h-full min-h-[280px]">
                  <div className="relative overflow-hidden h-full aspect-[4/3]">
                    {/* year badge — glass */}
                    <div className="glass-light absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md text-[0.62rem] font-bold tracking-[0.1em] text-[#1c1b1a]">
                      {ch.year.toUpperCase()}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ch.image}
                      alt={ch.imageAlt}
                      className="img-zoom w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              {/* ── Text card ── */}
              <div className="w-full md:w-7/12">
                <div className="glass-light rounded-2xl px-8 py-8 h-full flex flex-col justify-center">
                  <p className="uppercase font-semibold mb-2 text-[rgba(28,27,26,0.45)] tracking-[0.2em] text-[0.65rem]">
                    {ch.tag}
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-bold leading-snug mb-4 text-[#1c1b1a]">
                    {ch.heading}
                  </h2>
                  {/* subtle divider */}
                  <div className="w-10 h-px mb-5 bg-[rgba(28,27,26,0.2)]" aria-hidden="true" />
                  <p className="text-sm md:text-base text-[rgba(28,27,26,0.72)] leading-[1.85]">
                    {ch.body}
                  </p>
                  {ch.cta && (
                    <a href={ch.cta.href} className="btn-glass self-start">
                      {ch.cta.label} →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* -- PULL QUOTE (Golden Jubilee) -- */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* outer glow ring */}
          <div className="rounded-3xl p-px bg-[linear-gradient(135deg,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0.1)_100%)]">
            <div className="rounded-3xl px-10 py-14 text-center relative overflow-hidden bg-[rgba(255,255,255,0.18)] backdrop-blur-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]">
              {/* soft maroon top accent bar */}
              <div
                className="absolute top-0 inset-x-0 h-px bg-[linear-gradient(90deg,transparent,rgba(123,31,31,0.35),transparent)]"
                aria-hidden="true"
              />

              {/* decorative quote mark */}
              <p
                aria-hidden="true"
                className="text-8xl leading-none font-serif mb-0 text-[rgba(28,27,26,0.06)] [font-family:Georgia,serif] [line-height:1]"
              >
                &ldquo;
              </p>

              <blockquote className="font-display text-xl md:text-2xl font-semibold leading-relaxed -mt-4 mb-6 text-[rgba(28,27,26,0.82)]">
                {pullQuote}
              </blockquote>

              {/* thin separator */}
              <div className="w-12 h-px mx-auto mb-4 bg-[rgba(123,31,31,0.30)]" aria-hidden="true" />

              <p className="text-xs tracking-widest uppercase text-[#c9a84c]">
                CBCK Youth Ministry &mdash; Golden Jubilee 2018
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CLOSING CTA ═════════════════════════════════════════ */}
      <section className="py-16 px-6 text-center">
        <div className="glass-mid rounded-2xl max-w-xl mx-auto px-8 py-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 text-[#1c1b1a]">
            The Next Chapter Is Being Written
          </h2>
          <p className="mx-auto text-sm leading-relaxed mb-7 text-[rgba(28,27,26,0.60)] max-w-[28rem]">
            Whether you have been a part of the Youth Forum for decades or are just discovering it —
            there is a place for you here.
          </p>
          <a href="/events" className="btn-glass-cta">
            See Upcoming Events →
          </a>
        </div>
      </section>
    </main>
  );
}
