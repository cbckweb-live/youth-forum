import { supabase } from "@/lib/supabase";
import Image from "next/image";

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
    return <main className="px-8 py-16 max-w-2xl mx-auto">Not found.</main>;
  }

  return (
    <main className="px-8 py-16 max-w-2xl mx-auto text-center">
      {person.photo_url && (
        <Image
          src={person.photo_url}
          alt={person.name}
          width={128}
          height={128}
          quality={100}
          className="w-32 h-32 rounded-full object-cover mx-auto mb-6"
        />
      )}
      <h1 className="font-display text-3xl mb-2">{person.name}</h1>
      <p className="text-[#6B1F2A] uppercase tracking-wide mb-6">
        {person.role}
      </p>
      <p className="text-[#231F1E]/80 leading-relaxed text-justify">
        {person.bio || "Their story will be added here soon."}
      </p>
    </main>
  );
}
