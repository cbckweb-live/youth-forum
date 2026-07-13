import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { decodeHtmlEntities } from "@/lib/utils";
import SharePostButtons from "@/components/SharePostButtons";
import { headers } from "next/headers";
import SanitizedHtml from "@/components/SanitizedHtml";


export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? `${protocol}://${host}` : "";

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
        <div className="relative h-105 rounded-2xl mb-8">
<Image
             src={post.photo_url}
             alt={post.title}
             fill
             sizes="100vw"
             style={{ objectFit: "cover" }}
             unoptimized
           />
        </div>
      )}

      <SanitizedHtml
        html={post.content}
        className="prose prose-sm sm:prose max-w-none text-[#231F1E] prose-headings:font-display prose-a:text-[#6B1F2A]"
      />

      <SharePostButtons title={post.title} url={`${baseUrl}/about/blog-news/${post.slug}`} />

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
