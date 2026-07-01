import { supabase } from "@/lib/supabase";
import Image from "next/image";

export const revalidate = 0;

type Episode = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  display_order: number;
};

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\?]{11})/);
  return match ? match[1] : null;
}

export default async function LivingRoomPage() {
  const { data: episodes, error } = await supabase
    .from("living_room_seasons")
    .select("*")
    .order("display_order", { ascending: false });

  const episodeList = (episodes as Episode[]) || [];

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-5xl mx-auto">
      <div className="flex justify-center mb-8">
        <Image
          src="/livingroom.png"
          alt="Living Room"
          width={400}
          height={200}
          className="h-auto w-full max-w-[240px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px]"
          priority
        />
      </div>

      <h1 className="font-['Copperplate',_serif] font-bold text-3xl mb-4 text-center">Living Room</h1>

      <div className="mx-auto text-[#231F1E]/80 leading-relaxed mb-10 max-w-2xl space-y-4 text-justify">
        <p>
          The Living Room is a space where we welcome people we love, and people who
          inspire others. But above all, it&apos;s a place to listen — as our
          guests share their stories, glorify God&apos;s name, and testify to His
          love.
        </p>
      </div>

      {error && (
        <p className="text-red-600">Something went wrong loading episodes.</p>
      )}
      {episodeList.length === 0 && !error && (
        <p className="text-[#231F1E]/60 text-center">No episodes have been added yet.</p>
      )}

      <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
        {episodeList.map((episode) => {
          const youtubeId = getYouTubeId(episode.youtube_url);
          return (
            <div key={episode.id} className="break-inside-avoid">
              <div className="bg-white rounded-2xl p-5 shadow-md">
                <h3 className="font-display text-lg mb-2">{episode.title}</h3>
                {episode.description && (
                  <p className="text-sm text-[#231F1E]/70 mb-3">{episode.description}</p>
                )}
                {youtubeId && (
                  <div className="relative w-full pt-[56.25%]">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={episode.title}
                      className="absolute inset-0 w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}