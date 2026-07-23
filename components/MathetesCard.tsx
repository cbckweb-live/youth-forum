import Image from "next/image";
import Link from "next/link";

type MathetesCardProps = {
  id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
};

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

export default function MathetesCard({
  id,
  title,
  description,
  photo_url,
}: MathetesCardProps) {
  const excerpt = description ? truncateText(description, 180) : null;

  return (
    <div className="rounded-xl overflow-hidden bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md group">
      {photo_url ? (
        <Link href={`/mathetes/${id}`} className="block relative overflow-hidden">
          <Image
            src={photo_url}
            alt={title}
            width={800}
            height={600}
            sizes="(max-width: 640px) 100vw, (max-width: 1080px) 100vw, 33vw"
            unoptimized
            loading="lazy"
            className="block h-auto w-full transition-transform duration-500 group-hover:scale-105"
            style={{ height: "auto" }}
          />
        </Link>
      ) : (
        <Link href={`/mathetes/${id}`} className="block">
          <div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#6B1F2A]/15 via-white dark:via-[#1e1e1e] to-[#C8A46A]/20 px-6 text-center">
            <div>
              <p className="font-display text-2xl text-[#6B1F2A] dark:text-[#B84C5C]">Mathetes</p>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[#231F1E]/50">
                Fellowship update
              </p>
            </div>
          </div>
        </Link>
      )}
      <div className="p-5">
        <Link href={`/mathetes/${id}`}>
          <h3 className="font-display text-lg mb-2 group-hover:text-[#6B1F2A] dark:group-hover:text-[#B84C5C] transition-colors">{title}</h3>
        </Link>
        {excerpt && <p className="text-sm text-[#231F1E]/70 dark:text-gray-400 leading-relaxed">{excerpt}</p>}
        <Link
          href={`/mathetes/${id}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#6B1F2A] dark:text-[#B84C5C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 rounded transition-all"
        >
          Read More
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}