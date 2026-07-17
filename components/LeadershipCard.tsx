import Link from "next/link";
import Image from "next/image";

type LeadershipCardProps = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
};

export default function LeadershipCard({ id, name, role, photo_url, phone, email }: LeadershipCardProps) {
  return (
    <div className="bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-2xl p-6 text-center">
      {photo_url && (
        <Image src={photo_url} alt={name} width={96} height={96} unoptimized className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
      )}
      <h3 className="font-display text-lg">{name}</h3>
      <p className="text-sm text-[#6B1F2A] dark:text-[#B84C5C] uppercase tracking-wide mb-2">{role}</p>
      {phone && <p className="text-sm text-[#231F1E]/70 dark:text-gray-400">{phone}</p>}
      {email && <p className="text-sm text-[#231F1E]/70 dark:text-gray-400 mb-3">{email}</p>}
      <Link href={`/office-bearers/${id}`} className="text-sm font-medium text-[#6B1F2A] dark:text-[#B84C5C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]">
        Read More →
      </Link>
    </div>
  );
}