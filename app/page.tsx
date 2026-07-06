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
    <div className="flex flex-col items-center justify-center border border-[#231F1E]/10 rounded-xl shadow-sm bg-white w-16 h-16 shrink-0">
      <span className="text-[10px] uppercase tracking-wider text-[#6B1F2A] font-medium leading-none mb-0.5">
        {startMonth}
      </span>
      <span className="text-xl font-bold leading-none">
        {startDay}
        {isMultiday && <>-{endDay}</>}
      </span>
    </div>
  );
}

export default async function HomePage() {
  const { data: leadership } = await supabase
    .from("office_bearers")
    .select("*")
    .or("role.ilike.%youth director%,role.ilike.%pastor in charge%,role.ilike.%youth chairman%");

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
    <main className="bg-white text-[#231F1E]">
      {/* Hero Section: Handles layout gaps via mt-6 and positioning via deep top padding */}
      <section
        className="mt-6 px-4 sm:px-8 pt-20 pb-10 sm:pt-28 sm:pb-14 lg:pt-36 lg:pb-18 max-w-[92vw] sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto text-center relative"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
        ></div>
        <div className="relative text-center">
          <p className="text-sm uppercase tracking-widest text-[#6B1F2A] mb-3 text-center mx-auto">
            Welcome
          </p>
          <h1 className="font-display text-2xl sm:text-4xl leading-tight mb-4 text-center">
            Chakhesang Baptist Church Kohima,
            <br /> Youth Ministry
          </h1>
          <p className="text-[#231F1E] leading-relaxed max-w-3xl mb-6">
            Welcome to the Youth Ministry of Chakhesang Baptist Church, Kohima &mdash;
            a community of young believers growing together in faith, fellowship, 
            and service under the spiritual guidance of the Church.
          </p>
          <p className="text-[#231F1E] leading-relaxed max-w-3xl mb-6"> 
            Established in 1968, with a growing family of over 1,000 members, 
            we continue to cultivate a Christ-centred community where worship, discipleship, fellowship,
            leadership, creativity, service, and spiritual care to shape every aspect of our journey together.
          </p>
          <p className="text-[#231F1E] leading-relaxed max-w-3xl mb-6">
            Whether you are visiting for the first time, seeking a place to belong,
            or looking to deepen your walk with God, we warmly welcome you to be part of this growing family. 
            Together, let us grow in faith, stand firm in Christ, and faithfully serve God and our community. 
          </p>

        </div>
      </section>

      <section className="px-4 sm:px-8 pb-12 sm:pb-16 mt-8 sm:mt-12">
        <HeroSlider />
      </section>

      {/* Upcoming Events */}
      <section className="px-4 sm:px-8 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <h2 className="font-display text-2xl text-center sm:text-left">
            Upcoming Events
          </h2>
          <Link href="/events" className="text-sm text-[#6B1F2A] hover:underline">
            View all →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-[#231F1E]/60 text-center">No upcoming events.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href="/events"
                className="flex flex-col sm:flex-row sm:items-stretch gap-6 border border-[#231F1E]/10 rounded-2xl p-6 shadow-md bg-white hover:shadow-lg transition-shadow"
              >
                <CalendarDate startDate={event.event_date} endDate={event.event_end_date} />

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-xs text-[#6B1F2A] mb-2">
                    {formatRange(event.event_date, event.event_end_date ?? event.event_date)}
                  </p>
                  <h3 className="font-display text-2xl leading-snug mb-2">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-base text-[#231F1E]/70 line-clamp-3 leading-relaxed">
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
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Blog & News */}
      <section className="px-4 sm:px-8 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <h2 className="font-display text-2xl text-center sm:text-left">
            Recent Blog &amp; News
          </h2>
          <Link href="/about/blog-news" className="text-sm text-[#6B1F2A] hover:underline">
            Read more →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="text-[#231F1E]/60 text-center">No posts yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/about/blog-news/${post.slug}`}
                className="group bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
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
                    />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-2">
                    {CATEGORY_LABELS[post.category] ?? "Uncategorised"}
                  </p>
                  <h3 className="font-display text-lg leading-snug mb-2 group-hover:text-[#6B1F2A] transition-colors">
                    {post.title}
                  </h3>
                  <div className="text-sm text-[#231F1E]/70 line-clamp-4">
                    {truncate(post.content, 160)}
                  </div>
                  <div className="mt-4 text-sm font-medium text-[#6B1F2A] group-hover:underline">
                    Read more →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Leadership Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-16">
        <h2 className="font-display text-2xl mb-6 text-center">
          Our Leadership
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {leadership?.map((person) => (
            <LeadershipCard key={person.id} {...person} />
          ))}
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {[
          {
            title: "Journey",
            text: "A look back at how our community began and grew over the years.",
            href: "/about/journey",
            Icon: MapIcon,
          },
          {
            title: "Aims and Goals",
            text: "What we strive toward, together, as one community.",
            href: "/about/aims",
            Icon: PlusIcon,
          },
          {
            title: "Blog/News",
            text: "How our community is organized and led.",
            href: "/about/blog-news",
            Icon: PencilSquareIcon,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="text-center bg-white/40 backdrop-blur-sm border border-white/50 shadow-md rounded-xl p-6"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#6B1F2A] flex items-center justify-center">
              <item.Icon className="size-6 text-white" />
            </div>
            <h3 className="font-display text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-[#231F1E]/70 mb-3">{item.text}</p>
            <Link
              href={item.href}
              className="text-sm font-medium text-[#6B1F2A] hover:underline"
            >
              Read More →
            </Link>
          </div>
        ))}
      </section>
    </main>
  );
}