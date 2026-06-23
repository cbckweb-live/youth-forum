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
    <div id={id} className="text-center bg-white/40 backdrop-blur-sm border border-white/50 shadow-md rounded-xl p-5">
      {photo_url ? (
        <img src={photo_url} alt={name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-3" />
      )}
      <h3 className="font-display text-base">{name}</h3>
      {role && <p className="text-sm text-[#6B1F2A] mb-1">{role}</p>}
      {phone && <p className="text-xs text-[#231F1E]/60">{phone}</p>}
      {email && <p className="text-xs text-[#231F1E]/60">{email}</p>}
    </div>
  );
}