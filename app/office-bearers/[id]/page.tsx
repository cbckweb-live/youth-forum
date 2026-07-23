import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import SanitizedHtml from "@/components/SanitizedHtml";

export default async function OfficeBearerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: person } = await supabase
    .from("office_bearers")
    .select("*")
    .eq("id", id)
    .single();

  if (!person) {
    return    <main className="px-8 py-16 max-w-2xl mx-auto text-center dark:text-[#e5e5e5]">
      <Link href="/office-bearers" className="text-sm text-[#6B1F2A] hover:underline mb-6 inline-block">
        ← Back to Office Bearers
      </Link>
      <p>Not found.</p>
    </main>;
  }

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-2xl mx-auto dark:text-[#e5e5e5]">
      <Link
        href="/office-bearers"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B1F2A] dark:text-[#B84C5C] hover:underline mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Office Bearers
      </Link>

      <div className="bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-2xl p-6 sm:p-8 text-center">
        {person.photo_url && (
          <Image
            src={person.photo_url}
            alt={person.name}
            width={128}
            height={128}
            quality={100}
            unoptimized
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover mx-auto mb-5 ring-2 ring-white/60 dark:ring-white/10"
          />
        )}
        <h1 className="font-display text-2xl sm:text-3xl mb-2">{person.name}</h1>
        <p className="text-sm sm:text-base text-[#6B1F2A] dark:text-[#B84C5C] uppercase tracking-wide mb-7">
          {person.role}
        </p>

        <div className="border-t border-[#231F1E]/10 dark:border-white/10 pt-7">
          {person.bio ? (
            <SanitizedHtml
              html={person.bio}
              className="prose prose-sm sm:prose-base max-w-none text-[#231F1E]/80 dark:text-[#e5e5e5] prose-headings:font-display prose-a:text-[#6B1F2A] dark:prose-a:text-[#B84C5C] text-left"
            />
          ) : (
            <p className="text-[#231F1E]/80 dark:text-gray-300 leading-relaxed text-justify">
              Their story will be added here soon.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
