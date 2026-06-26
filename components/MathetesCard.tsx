import Image from "next/image";
type MathetesCardProps = {
  title: string;
  description: string | null;
  photo_url: string | null;
};

export default function MathetesCard({
  title,
  description,
  photo_url,
}: MathetesCardProps) {
  return (
    <div className="rounded-xl overflow-hidden bg-white/40 backdrop-blur-sm border border-white/50 shadow-md">
      {photo_url && (
        <div className="relative aspect-video">
          <Image
            src={photo_url}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            quality={100}
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-display text-lg mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-[#231F1E]/70 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
