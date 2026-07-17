import type { Metadata } from "next";
import Image from "next/image";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

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
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Image
            src="/livingroom.png"
            alt="The Living Room logo"
            width={240}
            height={96}
            unoptimized
            className="h-17 w-auto"
          />
          <h1 className="font-display text-[2rem] text-[#6B1F2A] dark:text-[#B84C5C]">
            The Living Room
          </h1>
        </div>
        <p className="text-[#231F1E] dark:text-gray-300">Unable to load episodes at this time.</p>
      </main>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <main className="px-4 sm:px-8 py-12 max-w-6xl mx-auto dark:text-[#e5e5e5]">
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Image
            src="/livingroom.png"
            alt="The Living Room logo"
            width={240}
            height={96}
            unoptimized
            className="h-17 w-auto"
          />
          <h1 className="font-display text-[2rem] text-[#6B1F2A] dark:text-[#B84C5C]">
            The Living Room
          </h1>
        </div>
        <p className="text-[#231F1E] dark:text-gray-300">No episodes available yet.</p>
      </main>
    );
  }

  return (      <main className="px-4 sm:px-8 py-12 max-w-6xl mx-auto dark:text-[#e5e5e5]">

      <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Image
          src="/livingroom.png"
          alt="The Living Room logo"
          width={240}
          height={96}
          unoptimized
          className="h-17 w-auto"
        />
        <h1 className="font-display text-[2rem] text-[#6B1F2A] dark:text-[#B84C5C]">
          The Living Room
        </h1>
      </div>

      <div className="space-y-12">
        {episodes.map((episode: Episode) => {
          const embedUrl = getYouTubeEmbedUrl(episode.youtube_url || "");

          return (
            <div
              key={episode.id}
              className="bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md rounded-2xl p-6 sm:p-8"
            >
              <div className="mb-6 flex flex-col gap-2">
                <p className="text-xs text-[#231F1E]/50 dark:text-gray-400">
                  Episode {toRomanNumeral(episode.display_order)}
                </p>
                <h2 className="font-display text-2xl text-[#6B1F2A] dark:text-[#B84C5C]">
                  {episode.title}
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] lg:items-start">
                <div className="space-y-4">
                  {episode.description && (
                    <p className="text-[#231F1E] dark:text-gray-300 font-body leading-relaxed">
                      {episode.description}
                    </p>
                  )}
                </div>

                <div className="w-full">
                  {embedUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden shadow-md">
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
      </div>
    </main>
  );
}
