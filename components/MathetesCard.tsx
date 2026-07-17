import Image from "next/image";

type MathetesCardProps = {
  title: string;
  description: string | null;
  photo_url: string | null;
};

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

export default function MathetesCard({
  title,
  description,
  photo_url,
}: MathetesCardProps) {
  const excerpt = description ? truncateText(description, 180) : null;

  return (
    <div className="rounded-xl overflow-hidden bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md">
      {photo_url ? (
        <Image
          src={photo_url}
          alt={title}
          width={800}
          height={600}
          sizes="(max-width: 640px) 100vw, (max-width: 1080px) 100vw, 33vw"
          unoptimized
          loading="lazy"
          className="block h-auto w-full"
          style={{ height: "auto" }}
        />
      ) : (
        <div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#6B1F2A]/15 via-white dark:via-[#1e1e1e] to-[#C8A46A]/20 px-6 text-center">
          <div>
            <p className="font-display text-2xl text-[#6B1F2A] dark:text-[#B84C5C]">Mathetes</p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[#231F1E]/50">
              Fellowship update
            </p>
          </div>
        </div>
      )}
      <div className="p-5">
        <h3 className="font-display text-lg mb-2">{title}</h3>
        {excerpt && <p className="text-sm text-[#231F1E]/70 dark:text-gray-400 leading-relaxed">{excerpt}</p>}
      </div>
    </div>
  );
}