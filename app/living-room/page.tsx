import type { Metadata } from "next";
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
      <main className="px-4 sm:px-8 py-12 max-w-6xl mx-auto">
        <h1 className="font-display text-3xl text-[#6B1F2A] mb-6">
          The Living Room
        </h1>
        <p className="text-[#231F1E]">Unable to load episodes at this time.</p>
      </main>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <main className="px-4 sm:px-8 py-12 max-w-6xl mx-auto">
        <h1 className="font-display text-3xl text-[#6B1F2A] mb-6">
          The Living Room
        </h1>
        <p className="text-[#231F1E]">No episodes available yet.</p>
      </main>
    );
  }

  return (
    <main className="px-4 sm:px-8 py-12 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl text-[#6B1F2A] mb-12">
        The Living Room
      </h1>

      <div className="space-y-12">
        {episodes.map((episode: Episode, index: number) => {
          const embedUrl = getYouTubeEmbedUrl(episode.youtube_url || "");

          return (
            <div key={episode.id}>
              <div className="grid grid-cols-10 gap-8 items-center">
                {/* Left Side - Content */}
                <div className="col-span-10 md:col-span-6 bg-white/40 backdrop-blur-sm border border-white/50 shadow-md rounded-xl p-6">
                  <h2 className="font-display text-2xl text-[#6B1F2A] mb-3">
                    {episode.title}
                  </h2>
                  {episode.description && (
                    <p className="text-[#231F1E] font-body leading-relaxed">
                      {episode.description}
                    </p>
                  )}
                </div>

                {/* Right Side - Video */}
                <div className="col-span-10 md:col-span-4">
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
                    <div className="aspect-video bg-gray-300 rounded-xl flex items-center justify-center text-[#231F1E] text-sm">
                      No video available
                    </div>
                  )}
                </div>
              </div>

              {index < episodes.length - 1 && (
                <hr className="border-white/20 my-8" />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
