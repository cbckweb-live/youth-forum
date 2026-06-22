import { supabase } from "@/lib/supabase";

export default async function GalleryPage() {
  const { data: photos, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  // Group photos by their event_tag
  const grouped = photos?.reduce((acc, photo) => {
    const tag = photo.event_tag || "Other Photos";
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(photo);
    return acc;
  }, {} as Record<string, typeof photos>);

  return (
    <main className="px-8 py-16 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl mb-10">Gallery</h1>

      {error && (
        <p className="text-red-600">Something went wrong loading the gallery.</p>
      )}

      {photos && photos.length === 0 && (
        <p className="text-[#231F1E]/60">No photos have been added yet.</p>
      )}

      {grouped && Object.entries(grouped).map(([tag, items]) => (
        <section key={tag} className="mb-12">
          <h2 className="font-display text-xl mb-4">{tag}</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((photo) => (
              <div
                key={photo.id}
                className="rounded-lg overflow-hidden bg-white/40 backdrop-blur-sm border border-white/50 shadow-md"
              >
                <img src={photo.photo_url} alt={photo.caption || tag} className="w-full h-56 object-cover" />
                {photo.caption && (
                  <p className="text-sm text-[#231F1E]/80 p-3">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}