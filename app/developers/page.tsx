import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

import { createSupabaseServerClient } from "@/lib/supabase-server";




type Developer = {
  id: string;
  name: string;
  role: string | null;
  description: string | null;
  photo_url: string | null;
  display_order: number;
};

export default async function DevelopersPage() {
  // NOTE: Use our local Supabase SSR helper (lib/supabase-server.ts)
  const supabaseServer = await createSupabaseServerClient();



  const {
    data: { session },
  } = await supabaseServer.auth.getSession();


  const adminDestination = session
    ? "/admin/dashboard"
    : "/login";


  const { data } = await supabase
    .from("developers")
    .select("*")
    .order("display_order", { ascending: true });

  const team = (data as Developer[]) || [];

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl sm:text-3xl mb-4">Our Team</h1>
      <p className="text-[#231F1E]/70 leading-relaxed mb-12">
        The developers and collaborators behind this site.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        {team.map((member) => (
          <div
            key={member.id}
            className="bg-white shadow-md rounded-2xl p-6 flex gap-4 items-start"
          >
            {member.photo_url ? (
              <Image
                src={member.photo_url}
                alt={member.name}
                width={56}
                height={56}
                quality={100}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#6B1F2A]/10 flex items-center justify-center shrink-0">
                <span className="text-[#6B1F2A] font-display text-xl">
                  {member.name[0]}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-display text-lg">{member.name}</h2>
              {member.role && (
                <p className="text-sm text-[#6B1F2A] mb-1">{member.role}</p>
              )}
              {member.description && (
                <p className="text-sm text-[#231F1E]/60">{member.description}</p>
              )}
            </div>
          </div>
        ))}
        {team.length === 0 && (
          <p className="text-sm text-[#231F1E]/50">
            No team members added yet.
          </p>
        )}
      </div>

      <div className="border-t border-[#231F1E]/10 pt-10 text-center">
        <p className="text-sm text-[#231F1E]/50 mb-4">Are you an admin?</p>
        <Link
          href={adminDestination}
          className="inline-block bg-[#6B1F2A] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#7d2432] transition-colors"
        >
          Go to Admin Panel
        </Link>
      </div>
    </main>
  );
}

