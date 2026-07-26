import type { Metadata } from "next";
import Image from "next/image";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import RevealSection from "@/components/RevealSection";

export const metadata: Metadata = {
  title: "The Living Room | Youth Forum",
  description: "Explore thought-provoking discussions and video content in The Living Room.",
};

export const revalidate = 0;

interface Episode {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  display_order: number;
}

function toRomanNumeral(num: number): string {
  const n = Math.max(1, Math.floor(num));
  const romans: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remaining = n;
  let result = "";

  for (const [value, symbol] of romans) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }

  return result;
}

function LivingRoomHeader() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center">
        <Image
          src="/livingroom.png"
          alt="The Living Room logo"
          width={200}
          height={200}
          unoptimized
          className="w-36 h-auto drop-shadow-sm shrink-0"
        />
        <p className="max-w-xl text-lg leading-relaxed text-[#231F1E]/80 dark:text-gray-300">
          Designed to equip and inspire, The Living Room series hosted by the Chakhesang Baptist
          Church Youth Ministry creates a space where young people can hear firsthand from
          professionals across diverse fields, empowering them with practical advice and fresh
          perspectives for the future.
        </p>
      </div>
      <div className="mb-6">
        <h1 className="font-display text-[2rem] text-[#6B1F2A] dark:text-[#B84C5C]">
          The Living Room
        </h1>
      </div>
      <div className="h-px bg-[#231F1E]/10 mb-12 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)]" />
    </>
  );
}

export default async function LivingRoomPage() {
  // Create client inside the async function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: episodes, error } = await supabase
    .from("living_room_seasons")
    .select("*")
    .order("display_order", { ascending: false });

  if (error) {
    console.error("Failed to fetch episodes:", error);
    return (
      <main className="px-4 sm:px-8 py-12 max-w-6xl mx-auto dark:text-[#e5e5e5]">
        <LivingRoomHeader />
        <p className="text-[#231F1E]/50 dark:text-gray-400 italic">Unable to load episodes at this time. Please check back later.</p>
      </main>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <main className="px-4 sm:px-8 py-12 max-w-6xl mx-auto dark:text-[#e5e5e5]">
        <LivingRoomHeader />
        <p className="text-[#231F1E]/50 dark:text-gray-400 italic">No episodes released yet. Stay tuned for new conversations.</p>
      </main>
    );
  }

  return (      <main className="px-4 sm:px-8 py-12 max-w-6xl mx-auto dark:text-[#e5e5e5]">

      <LivingRoomHeader />

      <RevealSection delay={100} as="div" className="space-y-12">
        {episodes.map((episode: Episode) => {
          const embedUrl = getYouTubeEmbedUrl(episode.youtube_url || "");

          return (
            <div
              key={episode.id}
              className="group bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-[#6B1F2A]/10 dark:bg-[#B84C5C]/20 px-3 py-1 text-xs font-semibold tracking-wider text-[#6B1F2A] dark:text-[#B84C5C]">
                  Episode {toRomanNumeral(episode.display_order)}
                </span>
                <h2 className="font-display text-2xl text-[#6B1F2A] dark:text-[#B84C5C]">
                  {episode.title}
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] lg:items-start">
                <div className="space-y-4 order-last lg:order-first">
                  {episode.description && (
                    <p className="text-[#231F1E] dark:text-gray-300 font-body leading-relaxed">
                      {episode.description}
                    </p>
                  )}
                </div>

                <div className="w-full">
                  {embedUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-lg">
                      <iframe
                        src={embedUrl}
                        title={episode.title}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-300 dark:bg-[#2a2a2a] rounded-xl flex items-center justify-center text-[#231F1E] dark:text-gray-300 text-sm">
                      No video available
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </RevealSection>
    </main>
  );
}
