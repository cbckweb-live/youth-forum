/* ─── tokens ────────────────────────────────────────────────── */
const INK   = "#1c1b1a";
const IVORY = "#f7f3ea";

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
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&q=80",
    imageAlt: "Young students in a discipleship and mentorship circle",
    imageLeft: true,
    cta: { label: "Know More", href: "/mathetes" },
  },
];

/* ─── timeline ───────────────────────────────────────────────── */
const milestones = [
  { year: "1960", label: "Church founded" },
  { year: "1968", label: "Ministry established" },
  { year: "2018", label: "Golden Jubilee" },
  { year: "Today", label: "1,000+ members" },
];

/* ─── pull quote ─────────────────────────────────────────────── */
const pullQuote =
  "Fifty years of God's faithfulness, spiritual growth, and dedicated service — and still, the best is yet to come.";

export default function JourneyPage() {
  return (
    <main
      style={{
        backgroundColor: "#ffffff",
        color: INK,
        fontFamily: "var(--font-body)",
        minHeight: "100vh",
      }}
      className="overflow-x-hidden"
    >
      {/* ══ HERO ════════════════════════════════════════════════ */}

      <section className="relative text-center overflow-hidden" style={{ minHeight: "420px" }}>

        {/* background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="C:\Website\youth-forum\public\background.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 0 }}
        />

        {/* dark gradient overlay for legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background:
              "linear-gradient(to bottom, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.45) 60%, rgba(10,8,6,0.70) 100%)",
          }}
        />

        {/* text written directly over the image */}
        <div
          className="relative z-10 py-32 px-6 flex flex-col items-center"
          style={{ color: IVORY }}
        >
          <p
            style={{
              color: "rgba(247,243,234,0.55)",
              letterSpacing: "0.25em",
              fontSize: "0.68rem",
            }}
            className="uppercase font-semibold mb-3"
          >
            Our Story
          </p>
          <h1
            style={{ fontFamily: "var(--font-display)", color: "#d4a94a" }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-5"
          >
            Our Journey
          </h1>
          <p
            className="mx-auto text-base"
          >
            From a small fellowship planted in 1968 to a thriving community of over 1,000 members
            — this is the story of the CBCK Youth Ministry.
          </p>
        </div>
      </section>

      {/* ── thin lifted divider ── */}
      <div className="px-10 md:px-24" aria-hidden="true">
        <div
          style={{
            height: "1px",
            background: "rgba(28,27,26,0.10)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08)",
            borderRadius: "9999px",
          }}
        />
      </div>

      {/* ══ TIMELINE STRIP ════════════════════════════════════ */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-light rounded-3xl px-12 py-10">
            <div className="relative flex items-start justify-between">
              {/* connecting line */}
              <div
                className="absolute left-0 right-0"
                style={{ backgroundColor: "rgba(120,30,30,0.22)", top: "14px", height: "3px", borderRadius: "9999px" }}
                aria-hidden="true"
              />
              {milestones.map((m) => (
                <div key={m.year} className="relative z-10 flex flex-col items-center gap-3 flex-1">
                  {/* maroon dot */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div
                      style={{
                        width: "28px", height: "28px",
                        borderRadius: "9999px",
                        backgroundColor: "#7b1f1f",
                        boxShadow: "0 0 0 5px rgba(123,31,31,0.15), 0 0 0 9px rgba(123,31,31,0.06), 0 4px 10px rgba(0,0,0,0.20)",
                      }}
                    />
                  </div>
                  <span
                    style={{ color: INK, fontSize: "1rem" }}
                    className="font-bold text-center"
                  >
                    {m.year}
                  </span>
                  <span
                    style={{ color: "rgba(28,27,26,0.55)", fontSize: "0.75rem" }}
                    className="text-center hidden sm:block leading-snug"
                  >
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
                <div className="glass-light rounded-2xl overflow-hidden h-full" style={{ minHeight: "280px" }}>
                  <div className="relative overflow-hidden h-full" style={{ aspectRatio: "4/3" }}>
                    {/* year badge — glass */}
                    <div
                      className="glass-light absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md"
                      style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", color: INK }}
                    >
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
                  <p
                    style={{ color: "rgba(28,27,26,0.45)", letterSpacing: "0.2em", fontSize: "0.65rem" }}
                    className="uppercase font-semibold mb-2"
                  >
                    {ch.tag}
                  </p>
                  <h2
                    style={{ fontFamily: "var(--font-display)", color: INK }}
                    className="text-2xl md:text-3xl font-bold leading-snug mb-4"
                  >
                    {ch.heading}
                  </h2>
                  {/* subtle divider — no colour, just opacity */}
                  <div
                    style={{ backgroundColor: "rgba(28,27,26,0.2)" }}
                    className="w-10 h-px mb-5"
                    aria-hidden="true"
                  />
                  <p
                    style={{ color: "rgba(28,27,26,0.72)", lineHeight: "1.85" }}
                    className="text-sm md:text-base"
                  >
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
          <div className="rounded-3xl p-px" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%)" }}>
            <div
              className="rounded-3xl px-10 py-14 text-center relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.55)",
              }}
            >
              {/* soft maroon top accent bar */}
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(123,31,31,0.35), transparent)" }} aria-hidden="true" />

              {/* decorative quote mark */}
              <p
                aria-hidden="true"
                className="text-8xl leading-none font-serif mb-0"
                style={{ color: "rgba(28,27,26,0.06)", fontFamily: "Georgia, serif", lineHeight: 1 }}
              >
                &ldquo;
              </p>

              <blockquote
                style={{ fontFamily: "var(--font-display)", color: "rgba(28,27,26,0.82)" }}
                className="text-xl md:text-2xl font-semibold leading-relaxed -mt-4 mb-6"
              >
                {pullQuote}
              </blockquote>

              {/* thin separator */}
              <div className="w-12 h-px mx-auto mb-4" style={{ background: "rgba(123,31,31,0.30)" }} aria-hidden="true" />

              <p className="text-xs tracking-widest uppercase" style={{ color: "#c9a84c" }}>
                CBCK Youth Ministry &mdash; Golden Jubilee 2018
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CLOSING CTA ═════════════════════════════════════════ */}
      <section className="py-16 px-6 text-center">
        <div className="glass-mid rounded-2xl max-w-xl mx-auto px-8 py-10">
          <h2
            style={{ fontFamily: "var(--font-display)", color: INK }}
            className="text-2xl md:text-3xl font-bold mb-3"
          >
            The Next Chapter Is Being Written
          </h2>
          <p
            style={{ color: "rgba(28,27,26,0.60)", maxWidth: "28rem" }}
            className="mx-auto text-sm leading-relaxed mb-7"
          >
            Whether you have been a part of this community for decades or are just discovering it —
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