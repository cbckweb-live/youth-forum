import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import OfficeBearersClient from "@/components/OfficeBearersClient";

export const metadata: Metadata = {
  title: "Office Bearers | CBCK Youth Forum",
  description: "Meet the leadership team of the CBCK Youth Ministry — Youth Directors, Pastors-in-Charge, and dedicated office bearers serving our community.",
  openGraph: {
    title: "Office Bearers | CBCK Youth Forum",
    description: "Meet the leadership team of the CBCK Youth Ministry.",
  },
};

export const revalidate = 0;

type Person = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  team_id: string | null;
};

type Team = {
  id: string;
  name: string;
  display_order: number;
};

export default async function OfficeBearersPage() {
  const { data: people } = await supabase
    .from("office_bearers")
    .select("*")
    .order("display_order", { ascending: true });

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("display_order", { ascending: true });

  const peopleList = (people as Person[]) || [];
  const teamsList = (teams as Team[]) || [];

  const featured = peopleList.filter(
    (p) =>
      p.role?.toLowerCase().includes("pastor in charge") ||
      p.role?.toLowerCase().includes("youth director"),
  );

  const featuredIds = new Set(featured.map((p) => p.id));
  const rest = peopleList.filter((p) => !featuredIds.has(p.id));
  const standalone = rest.filter((p) => !p.team_id);

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-5xl mx-auto">
      <OfficeBearersClient
        featured={featured}
        standalone={standalone}
        rest={rest}
        teams={teamsList}
      />
    </main>
  );
}
