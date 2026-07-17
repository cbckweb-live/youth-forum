import HeroSlider from "@/components/HeroSlider";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  MapIcon,
  PlusIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import LeadershipCard from "@/components/LeadershipCard";
import Image from "next/image";
import { truncate } from "@/lib/truncate";
import { CATEGORY_LABELS } from "@/lib/categories";
import RevealSection from "@/components/RevealSection";

function ensureAbsoluteImageUrl(url: string) {
  // Supabase public URLs should already be absolute.
  // If a relative storage path is stored in DB, convert it to a public URL.
  // Also strip query params so identical images don't become "different" URLs.

  const stripQuery = (u: string) => u.split("?")[0].split("#")[0];

  if (url.startsWith("http://") || url.startsWith("https://")) return stripQuery(url);

  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Most setups use /storage/v1/object/public/<bucket>/<path>
  if (supabaseBase)
    return stripQuery(
      `${supabaseBase}/storage/v1/object/public/${url}`
    );

  return stripQuery(url);
}

export const revalidate = 0;

type Event = {
  id: string;
  title: string;
  event_date: string;
  event_end_date?: string | null;
  description?: string | null;
  image_url?: string | null;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  category: "news" | "blog-opinion";
  content: string;
  created_at: string;
  photo_url?: string | null;
};

function formatRange(startISO: string, endISO?: string | null) {
  const start = new Date(startISO);
  const startStr = start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!endISO || endISO === startISO) return startStr;

  const end = new Date(endISO);
  const endStr = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Uses a slightly longer em-dash (—) for clean typography range separation
  return `${startStr} — ${endStr}`;
}

function CalendarDate({ startDate, endDate }: { startDate: string; endDate?: string | null }) {
  const start = new Date(startDate);
  const startDay = start.getDate();
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });

  const isMultiday = endDate && endDate !== startDate;
  const endDay = isMultiday ? new Date(endDate).getDate() : null;

  return (
    <div className="flex flex-col items-center justify-center border border-[#231F1E]/10 dark:border-white/10 rounded-xl shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] bg-white dark:bg-[#2a2a2a] w-16 h-16 shrink-0">
      <span className="text-[10px] uppercase tracking-wider text-[#6B1F2A] dark:text-[#B84C5C] font-medium leading-none mb-0.5">
        {startMonth}
      </span>
      <span className="text-xl font-bold leading-none dark:text-[#f0f0f0]">
        {startDay}
        {isMultiday && <>-{endDay}</>}
      </span>
    </div>
  );
}

type Person = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  team_id: string | null;
  display_order: number;
};

export default async function HomePage() {
  const { data: leadership } = await supabase
    .from("office_bearers")
    .select("*")
    .or("role.ilike.%youth director%,role.ilike.%pastor in charge%,role.ilike.%youth chairman%");

  const roleRank: Record<string, number> = {
    "youth director": 0,
    "pastor in charge": 1,
    "youth chairman": 2,
  };

  const getRoleRank = (role: string | null) => {
    const r = (role || "").toLowerCase().trim();
    for (const [key, rank] of Object.entries(roleRank)) {
      if (r.includes(key)) return rank;
    }
    return 999;
  };

  const sortedLeadership = (leadership ?? []).sort((a: Person, b: Person) =>
    getRoleRank(a.role) - getRoleRank(b.role)
  );

  const today = new Date().toISOString().split("T")[0];

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id,title,event_date,event_end_date,description,image_url")
    .or(`event_end_date.gte.${today},event_end_date.is.null,event_end_date.eq.${today}`)
    .order("event_date", { ascending: true })
    .limit(20);

  const events = (upcomingEvents as Event[] | null) ?? [];

  const upcoming = events
    .filter((e) => (e.event_end_date ?? e.event_date) >= today)
    .slice(0, 2)
    .map((e) => ({
      ...e,
      image_url:
        typeof e.image_url === "string" ? ensureAbsoluteImageUrl(e.image_url) : null,
    }));

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id,title,slug,category,content,created_at,photo_url")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const posts = (recentPosts as Post[] | null) ?? [];

  return (
    <main className="bg-white dark:bg-[#151515] text-[#231F1E] dark:text-[#e5e5e5]">
      {/* Hero Section: Handles layout gaps via mt-6 and positioning via deep top padding */}

<section
  className="mt-0 px-4 sm:px-8 pt-4 pb-10 sm:pt-6 sm:pb-14 lg:pt-8 lg:pb-16  w-full max-w-6xl mx-auto text-center relative overflow-hidden"
  style={{
    backgroundImage: "url('/background.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  {/* Radial gradient: clear/light center, darker white toward the edges */}
  <div
    className="absolute inset-0 dark:hidden"
    style={{
      background:
        "radial-gradient(ellipse at center, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0.75) 65%, rgba(255,255,255,0.95) 100%)",
    }}
  ></div>

  {/* Dark mode radial overlay */}
  <div
    className="hidden dark:block absolute inset-0"
    style={{
      background:
        "radial-gradient(ellipse at center, rgba(10,10,10,0.35) 0%, rgba(15,15,15,0.60) 35%, rgba(20,20,20,0.80) 65%, rgba(21,21,21,0.95) 100%)",
    }}
  ></div>

  {/* Frosted card sitting over the text, on top of the radial gradient */}
  <div className="relative text-center bg-white/75 dark:bg-[#1e1e1e]/85 backdrop-blur-md rounded-2xl px-4 py-8 sm:px-10 sm:py-10 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
    <p className="text-lg sm:text-xl uppercase tracking-widest text-[#6B1F2A] dark:text-[#B84C5C] mb-4 font-medium text-center mx-auto">
  Welcome
</p>
<h1 className="text-2xl sm:text-4xl leading-tight mb-4 text-center text-black dark:text-[#f0f0f0] font-normal text-balance">
  Chakhesang Baptist Church Kohima,
  <br /> Youth Ministry
</h1>
<h2 className="text-[#6B1F2A] dark:text-[#B84C5C] text-xl sm:text-2xl leading-tight mb-2 text-center font-normal">
  Theme: &quot;Renew Thy Church&quot;
</h2>
<h2 className="text-[#6B1F2A] dark:text-[#B84C5C] text-xl sm:text-2xl leading-tight mb-4 text-center font-normal">
  Book Focus: Revelations
</h2>
    <p className="font-display text-black dark:text-[#e5e5e5] leading-relaxed max-w-3xl mx-auto mb-6">
      The official Youth Forum of Chakhesang Baptist Church Kohima &mdash;
      a community of young believers growing together in faith, fellowship,
      and service.
    </p>
    <p className="font-display text-black dark:text-[#e5e5e5] leading-relaxed max-w-3xl mx-auto mb-6">
      Established in 1968, with a growing family of over 1,000 members,
      we continue to cultivate a Christ&ndash;centred community where worship, discipleship, fellowship,
      leadership, creativity, service, and spiritual care to shape every aspect of our journey together.
    </p>
    <p className="font-display text-black dark:text-[#e5e5e5] leading-relaxed max-w-3xl mx-auto mb-6">
      Whether you are visiting for the first time, seeking a place to belong,
      or looking to deepen your walk with God, we warmly welcome you to be part of this growing family.
    </p>

    {/* Our Story — Frosted glass button */}
    <div className="mt-8">
      <Link
        href="/about/journey"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium tracking-wide text-[#6B1F2A]/90 dark:text-[#B84C5C] bg-white/40 dark:bg-[#2a2a2a]/60 backdrop-blur-sm border border-white/60 dark:border-white/20 shadow-sm hover:bg-white/60 dark:hover:bg-[#3a3a3a]/60 hover:shadow-md dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:text-[#6B1F2A] dark:hover:text-[#D46A7A] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/40 group"
      >
        <span>Our Story</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
    <p className="font-display italic text-black dark:text-[#e5e5e5] leading-relaxed max-w-3xl mx-auto mb-6">
      &quot;Don&rsquo;t let anyone look down on you because you are young, but set an example for the believers in speech, in life, in love, in faith, and in purity.&quot;
    </p>
    <p className="font-display mt-3 text-sm text-[#6B1F2A] dark:text-[#B84C5C]">
      — 1 Timothy 4:12
    </p>

   
  </div>
</section>

<RevealSection className="px-4 sm:px-8 py-12 sm:py-16">
  <div className="relative z-10 flex justify-center">
    <HeroSlider />
  </div>
</RevealSection>

      {/* Upcoming Events */}
      <RevealSection delay={100} className="px-4 sm:px-8 py-12 sm:py-16 scroll-mt-20" as="section">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <h2 className="font-display text-2xl text-center sm:text-left text-balance">
            Upcoming Events
          </h2>
          <Link href="/events" className="text-sm text-[#6B1F2A] dark:text-[#B84C5C] hover:underline">
            View all →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-[#231F1E]/60 dark:text-gray-400 text-center">No upcoming events.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href="/events"
                className="flex flex-col sm:flex-row sm:items-stretch gap-6 border border-[#231F1E]/10 dark:border-white/10 rounded-2xl p-6 shadow-md bg-white dark:bg-[#1e1e1e] hover:shadow-lg dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]"
              >
                <CalendarDate startDate={event.event_date} endDate={event.event_end_date} />

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-xs text-[#6B1F2A] dark:text-[#B84C5C] mb-2">
                    {formatRange(event.event_date, event.event_end_date ?? event.event_date)}
                  </p>
                  <h3 className="font-display text-2xl leading-snug mb-2">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-base text-[#231F1E]/70 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {truncate(event.description, 140)}
                    </p>
                  )}
                </div>

                {event.image_url && (
                  <div className="shrink-0 w-full sm:w-36 sm:h-36 rounded-xl overflow-hidden relative">
                    <Image
                      src={event.image_url ?? ""}
                      alt={event.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 144px"
                      style={{ objectFit: "cover" }}
                      quality={85}
                      priority
                      unoptimized
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </RevealSection>

      {/* Blog & News */}
      <RevealSection delay={200} className="px-4 sm:px-8 py-12 sm:py-16 scroll-mt-20" as="section">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <h2 className="font-display text-2xl text-center sm:text-left text-balance">
            Recent Blog &amp; News
          </h2>
          <Link href="/about/blog-news" className="text-sm text-[#6B1F2A] dark:text-[#B84C5C] hover:underline">
            Read more →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="text-[#231F1E]/60 dark:text-gray-400 text-center">No posts yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/about/blog-news/${post.slug}`}
                className="group bg-white dark:bg-[#1e1e1e] shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-[0_6px_30px_rgba(0,0,0,0.6)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]"
              >
                {post.photo_url && (
                  <div className="relative h-36">
                    <Image
                      src={post.photo_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "cover" }}
                      quality={85}
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs uppercase tracking-widest text-[#6B1F2A] dark:text-[#B84C5C] mb-2">
                    {CATEGORY_LABELS[post.category] ?? "Uncategorised"}
                  </p>
                  <h3 className="font-display text-lg leading-snug mb-2 group-hover:text-[#6B1F2A] dark:group-hover:text-[#B84C5C] transition-colors">
                    {post.title}
                  </h3>
                  <div className="text-sm text-[#231F1E]/70 dark:text-gray-400 line-clamp-4">
                    {truncate(post.content, 160)}
                  </div>
                  <div className="mt-4 text-sm font-medium text-[#6B1F2A] dark:text-[#B84C5C] group-hover:underline">
                    Read more →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </RevealSection>

      {/* Leadership Section */}
      <RevealSection delay={300} className="px-4 sm:px-8 py-12 sm:py-16 scroll-mt-20" as="section">
        <h2 className="font-display text-2xl mb-6 text-center text-balance">
          Our Leadership
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {sortedLeadership?.map((person) => (
            <LeadershipCard key={person.id} {...person} />
          ))}
        </div>
      </RevealSection>

      {/* Navigation Cards */}
      <RevealSection delay={400} className="px-4 sm:px-8 py-12 sm:py-16 scroll-mt-20" as="section">
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
        {[
          {
            title: "Journey",
            text: "A look back at how our community began and grew over the years.",
            href: "/about/journey",
            Icon: MapIcon,
          },
          {
            title: "Aims and Vision",
            text: "What we strive toward, together, as one community.",
            href: "/about/aims",
            Icon: PlusIcon,
          },
          {
            title: "Blog/News",
            text: "Stories, updates, and reflections from our community.",
            href: "/about/blog-news",
            Icon: PencilSquareIcon,
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group block text-center bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-xl p-6 hover:shadow-lg dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] hover:border-[#6B1F2A]/20 dark:hover:border-[#B84C5C]/30 hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#6B1F2A] dark:group-hover:bg-[#B84C5C] flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-0.5 transition-[transform,colors] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <item.Icon aria-hidden="true" className="size-6 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="font-display text-lg mb-2 group-hover:text-[#6B1F2A] dark:group-hover:text-[#B84C5C] transition-colors duration-300">
              {item.title}
            </h3>
            <p className="text-sm text-[#231F1E]/70 dark:text-gray-400 mb-3 group-hover:text-[#231F1E]/90 dark:group-hover:text-gray-300 transition-colors duration-300">
              {item.text}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B1F2A] dark:text-[#B84C5C] group-hover:gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
              Read More
              <span className="inline-block group-hover:translate-x-1 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">→</span>
            </span>
          </Link>
        ))}
      </div>
      </RevealSection>
    </main>
  );
}