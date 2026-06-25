import HeroSlider from "@/components/HeroSlider";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  MapIcon,
  PlusIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import LeadershipCard from "@/components/LeadershipCard";

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

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxChars: number) {
  const t = stripHtml(text);
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars).trimEnd() + "…";
}

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

  return `${startStr} — ${endStr}`;
}

export default async function HomePage() {
  const { data: leadership } = await supabase
    .from("office_bearers")
    .select("*")
    .or("role.ilike.%youth director%,role.ilike.%pastor in charge%");

  const today = new Date().toISOString().split("T")[0];

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id,title,event_date,event_end_date,description,image_url")
    .or(`event_end_date.gte.${today},event_end_date.is.null`)
    .order("event_date", { ascending: true })
    .limit(2);

  const events = (upcomingEvents as Event[] | null) ?? [];

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id,title,slug,category,content,created_at,photo_url")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const posts = (recentPosts as Post[] | null) ?? [];

  return (
    <main className="bg-white text-[#231F1E]">
      <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-2xl mx-auto text-center">
        <p className="text-sm uppercase tracking-widest text-[#6B1F2A] mb-3">
          Welcome
        </p>
        <h1 className="font-display text-2xl sm:text-4xl leading-tight mb-4">
          Chakhesang Baptist Church Kohima,
          <br /> Youth Ministry
        </h1>
        <p className="text-[#231F1E]/80 leading-relaxed">
          A community built on shared faith and shared ground — gathering for
          fellowship, supporting one another, and growing together year after
          year.
        </p>
      </section>

      <section className="px-4 sm:px-8 pb-12 sm:pb-16">
        <HeroSlider />
      </section>

      {/* Upcoming Events */}
      <section className="px-4 sm:px-8 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <h2 className="font-display text-2xl text-center sm:text-left">
            Upcoming Events
          </h2>
          <Link
            href="/events"
            className="text-sm text-[#6B1F2A] hover:underline"
          >
            View all →
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-[#231F1E]/60 text-center">No upcoming events.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col sm:flex-row sm:items-stretch gap-6 border border-[#231F1E]/10 rounded-2xl p-6 shadow-md bg-white"
              >
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-2">
                    {formatRange(
                      event.event_date,
                      event.event_end_date ?? event.event_date,
                    )}
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
              </div>
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
          <Link
            href="/about/blog-news"
            className="text-sm text-[#6B1F2A] hover:underline"
          >
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
                  <img
                    src={post.photo_url}
                    alt={post.title}
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-5">
                  <p className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-2">
                    {post.category === "news" ? "News" : "Blog & Opinion"}
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

      <section className="px-4 sm:px-8 py-12 sm:py-16">
        <h2 className="font-display text-2xl mb-6 text-center">
          Our Leadership
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {leadership?.map((person) => (
            <LeadershipCard key={person.id} {...person} />
          ))}
        </div>
      </section>
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
