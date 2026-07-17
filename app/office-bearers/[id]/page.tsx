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
    <main className="px-8 py-16 max-w-2xl mx-auto text-center dark:text-[#e5e5e5]">
      <Link href="/office-bearers" className="text-sm text-[#6B1F2A] hover:underline mb-6 inline-block">
        ← Back to Office Bearers
      </Link>
      {person.photo_url && (
        <Image
          src={person.photo_url}
          alt={person.name}
          width={128}
          height={128}
          quality={100}
          unoptimized
          className="w-32 h-32 rounded-full object-cover mx-auto mb-6"
        />
      )}
      <h1 className="font-display text-3xl mb-2">{person.name}</h1>
      <p className="text-[#6B1F2A] dark:text-[#B84C5C] uppercase tracking-wide mb-6">
        {person.role}
      </p>
      {person.bio ? (
        <SanitizedHtml
          html={person.bio}
          className="prose prose-sm max-w-none text-[#231F1E]/80 dark:text-[#e5e5e5] prose-headings:font-display prose-a:text-[#6B1F2A] dark:prose-a:text-[#B84C5C] text-left"
        />
      ) : (
        <p className="text-[#231F1E]/80 dark:text-gray-300 leading-relaxed text-justify">
          Their story will be added here soon.
        </p>
      )}
    </main>
  );
}
