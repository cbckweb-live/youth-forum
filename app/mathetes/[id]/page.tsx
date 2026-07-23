import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import SanitizedHtml from "@/components/SanitizedHtml";
import { notFound } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function MathetesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: entry } = await supabase
    .from("mathetes")
    .select("*")
    .eq("id", id)
    .single();

  if (!entry) {
    notFound();
  }

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-2xl mx-auto dark:text-[#e5e5e5]">
      <Link
        href="/mathetes"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B1F2A] dark:text-[#B84C5C] hover:underline mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Mathetes
      </Link>

      <div className="bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-2xl overflow-hidden">
        {entry.photo_url && (
          <div className="relative w-full max-h-[420px] overflow-hidden">
            <Image
              src={entry.photo_url}
              alt={entry.title}
              width={800}
              height={480}
              quality={100}
              unoptimized
              className="w-full h-auto object-cover"
              style={{ maxHeight: "420px" }}
              priority
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <h1 className="font-display text-2xl sm:text-3xl mb-6">{entry.title}</h1>

          {entry.description ? (
            <SanitizedHtml
              html={entry.description}
              className="prose prose-sm sm:prose-base max-w-none text-[#231F1E]/80 dark:text-[#e5e5e5] prose-headings:font-display prose-a:text-[#6B1F2A] dark:prose-a:text-[#B84C5C]"
            />
          ) : (
            <p className="text-[#231F1E]/60 dark:text-gray-400 italic">
              No content yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
