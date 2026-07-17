import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import SharePostButtons from "@/components/SharePostButtons";
import { headers } from "next/headers";
import sanitizeHtml from "sanitize-html";

export const metadata: Metadata = {
  title: "Blog & News | CBCK Youth Forum",
  description: "Updates, stories, and opinions from the CBCK Youth Ministry community.",
  openGraph: {
    title: "Blog & News | CBCK Youth Forum",
    description: "Updates, stories, and opinions from the CBCK Youth Ministry community.",
  },
};

export const revalidate = 0;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";

  return host ? `${protocol}://${host}` : "";
}

type Post = {
  id: string;
  title: string;
  slug: string;
  category: "news" | "blog-opinion";
  content: string;
  author_name: string | null;
  photo_url: string | null;
  pdf_url: string | null;
  created_at: string;
};

export default async function BlogNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  let query = supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (category === "news" || category === "blog-opinion") {
    query = query.eq("category", category);
  }

  const { data: posts, error } = await query;
  const postList = (posts as Post[]) || [];
  const baseUrl = await getBaseUrl();

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-5xl mx-auto dark:text-[#e5e5e5]">
      <h1 className="font-display text-2xl sm:text-3xl mb-4">Blog & News</h1>
      <p className="text-[#231F1E]/70 dark:text-gray-300 leading-relaxed max-w-2xl mb-8">
        Updates, stories, and opinions from our community.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-3 mb-10">
        {[
          { label: "All", value: "" },
          { label: "News", value: "news" },
          { label: "Blog & Opinion", value: "blog-opinion" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `?category=${tab.value}` : "/about/blog-news"}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (category ?? "") === tab.value
                ? "bg-[#6B1F2A] text-white"
                : "bg-gray-100 dark:bg-[#2a2a2a] text-[#231F1E]/60 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error && <p className="text-red-600">Something went wrong loading posts.</p>}
      {postList.length === 0 && !error && (
        <p className="text-[#231F1E]/60 dark:text-gray-400">No posts yet.</p>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {postList.map((post) => (
          <div
            key={post.id}
            className="group bg-white dark:bg-[#1e1e1e] shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-[0_6px_30px_rgba(0,0,0,0.4)] transition-shadow"
          >
            <Link href={`/about/blog-news/${post.slug}`} className="block">
              {post.photo_url && (
                <div className="relative h-44">
                  <Image
                    src={post.photo_url}
                    alt={post.title}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs uppercase tracking-widest text-[#6B1F2A] dark:text-[#B84C5C] mb-2">
                  {post.category === "news" ? "News" : "Blog & Opinion"}
                </p>
                <h2 className="font-display text-lg leading-snug mb-2 group-hover:text-[#6B1F2A] dark:group-hover:text-[#B84C5C] transition-colors">
                  {post.title}
                </h2>
                <div
                  className="text-sm text-[#231F1E]/60 dark:text-gray-400 line-clamp-3"
                  dangerouslySetInnerHTML={{
__html: sanitizeHtml(post.content.replace(/<[^>]+>/g, " ").slice(0, 120) + "..."),
                  }}
                />
                <div className="mt-4 flex items-center justify-between text-xs text-[#231F1E]/40 dark:text-gray-500">
                  {post.author_name && <span>{post.author_name}</span>}
                  <span>{new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {post.pdf_url && (
                  <p className="mt-3 text-xs text-[#6B1F2A] dark:text-[#B84C5C]">📄 PDF attached</p>
                )}
              </div>
            </Link>

            <div className="px-5 pb-5">
              <SharePostButtons
                title={post.title}
                url={`${baseUrl}/about/blog-news/${post.slug}`}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
