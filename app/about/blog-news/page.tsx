import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 0;

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

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl sm:text-3xl mb-4">Blog & News</h1>
      <p className="text-[#231F1E]/70 leading-relaxed max-w-2xl mb-8">
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
                : "bg-gray-100 text-[#231F1E]/60 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error && <p className="text-red-600">Something went wrong loading posts.</p>}
      {postList.length === 0 && !error && (
        <p className="text-[#231F1E]/60">No posts yet.</p>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {postList.map((post) => (
          <Link
            key={post.id}
            href={`/about/blog-news/${post.slug}`}
            className="group bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            {post.photo_url && (
              <Image                 src={post.photo_url}
                alt={post.title}
                className="w-full h-44 object-cover"
              />
            )}
            <div className="p-5">
              <p className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-2">
                {post.category === "news" ? "News" : "Blog & Opinion"}
              </p>
              <h2 className="font-display text-lg leading-snug mb-2 group-hover:text-[#6B1F2A] transition-colors">
                {post.title}
              </h2>
              <div
                className="text-sm text-[#231F1E]/60 line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: post.content.replace(/<[^>]+>/g, " ").slice(0, 120) + "...",
                }}
              />
              <div className="mt-4 flex items-center justify-between text-xs text-[#231F1E]/40">
                {post.author_name && <span>{post.author_name}</span>}
                <span>{new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              {post.pdf_url && (
                <p className="mt-3 text-xs text-[#6B1F2A]">📄 PDF attached</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
