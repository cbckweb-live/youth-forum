import Image from "next/image";
type GalleryItemProps = {
  photo_url: string;
  caption: string | null;
  event_tag: string | null;
};

export default function GalleryItem({ photo_url, caption, event_tag }: GalleryItemProps) {
  return (
    <div className="group relative rounded-lg overflow-hidden bg-white/40 backdrop-blur-sm border border-white/50 shadow-md">
      <Image src={photo_url} alt={caption || "Gallery photo"} className="w-full h-56 object-cover" />
      {(caption || event_tag) && (
        <div className="p-3">
          {event_tag && (
            <p className="text-xs uppercase tracking-wide text-[#6B1F2A] mb-1">{event_tag}</p>
          )}
          {caption && <p className="text-sm text-[#231F1E]/80">{caption}</p>}
        </div>
      )}
    </div>
  );
}