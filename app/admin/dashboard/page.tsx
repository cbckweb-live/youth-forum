"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import PostsSection from "@/components/admin/sections/PostsSection";
import EventsSection from "@/components/admin/sections/EventsSection";
import GallerySection from "@/components/admin/sections/GallerySection";
import OfficeBearersSection from "@/components/admin/sections/OfficeBearersSection";
import LivingRoomSection from "@/components/admin/sections/LivingRoomSection";

const TABS = ["Posts", "Events", "Gallery", "Office Bearers", "Living Room"] as const;
type Tab = (typeof TABS)[number];

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [activeTab, setActiveTab] = useState<Tab>("Posts");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      if (!data.session) router.push("/admin");
    });
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin");
  }

  return (
    <main className="px-4 sm:px-8 py-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">Admin Dashboard</h1>
        <button onClick={handleSignOut} className="text-sm text-[#6B1F2A] hover:underline">
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#6B1F2A] text-white"
                : "bg-gray-100 text-[#231F1E]/60 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Posts" && <PostsSection />}
      {activeTab === "Events" && <EventsSection />}
      {activeTab === "Gallery" && <GallerySection />}
      {activeTab === "Office Bearers" && <OfficeBearersSection />}
      {activeTab === "Living Room" && <LivingRoomSection />}
    </main>
  );
}
