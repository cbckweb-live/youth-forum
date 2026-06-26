import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto">
      <Link
        href="/about/blog-news"
        className="text-sm text-[#6B1F2A] hover:underline mb-8 inline-block"
      >
        ← Back to Blog & News
      </Link>

      <p className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-3">
        {post.category === "news" ? "News" : "Blog & Opinion"}
      </p>

      <h1 className="font-display text-2xl sm:text-4xl leading-tight mb-4">
        {post.title}
      </h1>

      <div className="flex items-center gap-3 text-sm text-[#231F1E]/50 mb-8">
        {post.author_name && <span>By {post.author_name}</span>}
        {post.author_name && <span>·</span>}
        <span>
          {new Date(post.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {post.photo_url && (
        <div className="relative h-[420px] rounded-2xl mb-8">
<Image
             src={post.photo_url}
             alt={post.title}
             fill
             sizes="100vw"
             style={{ objectFit: "cover" }}
             quality={100}
           />
        </div>
      )}

      <div
        className="prose prose-sm sm:prose max-w-none text-[#231F1E] prose-headings:font-display prose-a:text-[#6B1F2A]"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.pdf_url && (
        <div className="mt-10 p-4 border border-[#231F1E]/10 rounded-xl flex items-center justify-between">
          <p className="text-sm font-medium">📄 Attached Document</p>
          <a
            href={post.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#6B1F2A] font-medium hover:underline"
          >
            Download PDF
          </a>
        </div>
      )}
    </main>
  );
}
