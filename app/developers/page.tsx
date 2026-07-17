import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Developers | CBCK Youth Forum",
  description: "Meet the developers and collaborators behind the CBCK Youth Forum website.",
  openGraph: {
    title: "Developers | CBCK Youth Forum",
    description: "Meet the team behind this site.",
  },
};

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
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto dark:text-[#e5e5e5]">
      <h1 className="font-display text-2xl sm:text-3xl mb-4">Our Team</h1>
      <p className="text-[#231F1E]/70 dark:text-gray-300 leading-relaxed mb-12">
        The developers and collaborators behind this site.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        {team.map((member) => (
          <div
            key={member.id}
            className="bg-white dark:bg-[#1e1e1e] shadow-md rounded-2xl p-6 flex gap-4 items-start"
          >
            {member.photo_url ? (
              <Image
                src={member.photo_url}
                alt={member.name}
                width={56}
                height={56}
                unoptimized
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#6B1F2A]/10 flex items-center justify-center shrink-0">
                <span className="text-[#6B1F2A] dark:text-[#B84C5C] font-display text-xl">
                  {member.name[0]}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-display text-lg">{member.name}</h2>
              {member.role && (
                <p className="text-sm text-[#6B1F2A] dark:text-[#B84C5C] mb-1">{member.role}</p>
              )}
              {member.description && (
                <p className="text-sm text-[#231F1E]/60 dark:text-gray-400">{member.description}</p>
              )}
            </div>
          </div>
        ))}
        {team.length === 0 && (
          <p className="text-sm text-[#231F1E]/50 dark:text-gray-400">
            No team members added yet.
          </p>
        )}
      </div>

      <div className="border-t border-[#231F1E]/10 dark:border-white/10 pt-10 text-center">
        <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 mb-4">Are you an admin?</p>
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

