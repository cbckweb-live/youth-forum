import { supabase } from "@/lib/supabase";

type Photo = {
  id: string;
  photo_url: string;
  caption: string | null;
  event_tag: string | null;
  created_at: string;
};

export default async function GalleryPage() {
  const { data: photos, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  const grouped = (photos as Photo[] | null)?.reduce(
    (acc: Record<string, Photo[]>, photo: Photo) => {
      const tag = photo.event_tag || "Other Photos";
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(photo);
      return acc;
    },
    {},
  ) ?? {};

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto">
      <h1 className="font-display text-2xl sm:text-3xl mb-8 sm:mb-10">Gallery</h1>

      {error && (
        <p className="text-red-600">
          Something went wrong loading the gallery.
        </p>
      )}

      {photos && photos.length === 0 && (
        <p className="text-[#231F1E]/60">No photos have been added yet.</p>
      )}

      {Object.entries(grouped).map(([tag, items]) => (
          <section key={tag} className="mb-12">
            <h2 className="font-display text-xl mb-4">{tag}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {items.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-lg overflow-hidden bg-white/40 backdrop-blur-sm border border-white/50 shadow-md"
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || tag}
                    className="w-full h-56 object-cover"
                  />
                  {photo.caption && (
                    <p className="text-sm text-[#231F1E]/80 p-3">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
    </main>
  );
}
