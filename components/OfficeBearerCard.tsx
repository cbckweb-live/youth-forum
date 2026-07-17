import Image from "next/image";
type OfficeBearerCardProps = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
};

export default function OfficeBearerCard({ id, name, role, photo_url, phone, email }: OfficeBearerCardProps) {
  return (
    <div id={id} className="text-center bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-md rounded-xl p-5">
      {photo_url ? (
        <Image src={photo_url} alt={name} width={80} height={80} unoptimized className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-[#2a2a2a] mx-auto mb-3" />
      )}
      <h3 className="font-display text-base">{name}</h3>
      {role && <p className="text-sm text-[#6B1F2A] dark:text-[#B84C5C] mb-1">{role}</p>}
      {phone && <p className="text-xs text-[#231F1E]/60 dark:text-gray-400">{phone}</p>}
      {email && <p className="text-xs text-[#231F1E]/60 dark:text-gray-400">{email}</p>}
    </div>
  );
}