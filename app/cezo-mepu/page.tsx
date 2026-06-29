import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { MapPinIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export const revalidate = 0;

type Location = {
  id: string;
  name: string;
  address: string | null;
  photo_url: string | null;
  description: string | null;
  display_order: number;
  whatsapp_url: string | null;
};

type Supervisor = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  location_id: string | null;
};

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.428a.75.75 0 00.916.916l5.579-1.474A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 01-4.953-1.355l-.355-.21-3.31.875.888-3.253-.23-.374A9.715 9.715 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}

export default async function CezoMepuPage() {
  const { data: locations, error } = await supabase
    .from("cezo_mepu_locations")
    .select("*")
    .order("display_order", { ascending: true });

  const { data: supervisors } = await supabase
    .from("office_bearers")
    .select("id, name, role, photo_url, phone, email, location_id")
    .ilike("role", "%youth supervisor%");

  const locationList = (locations as Location[]) || [];
  const supervisorList = (supervisors as Supervisor[]) || [];

  return (
    <main className="px-4 sm:px-8 py-12 sm:py-16 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl sm:text-3xl mb-4">Cezo Mepu</h1>
      <p className="text-[#231F1E]/70 leading-relaxed max-w-2xl mb-12">
        Cezo Mepu represents the nine regional youth groups under the Chakhesang
        Baptist Church, Kohima Youth Ministry. Each location is guided by
        dedicated Youth Supervisors who shepherd and serve their local
        communities.
      </p>

      {error && (
        <p className="text-red-600">Something went wrong loading locations.</p>
      )}

      {locationList.length === 0 && !error && (
        <p className="text-[#231F1E]/60">No locations have been added yet.</p>
      )}

      <div className="space-y-4">
        {locationList.map((location) => {
          const locationSupervisors = supervisorList.filter(
            (s) => s.location_id === location.id,
          );

          return (
            <section
              key={location.id}
              className="rounded-2xl p-5 sm:p-6 bg-white shadow-md"
            >
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Photo */}
                <div className="relative w-full sm:w-52 h-40 rounded-xl overflow-hidden shrink-0">
                  {location.photo_url ? (
                    <Image
                      src={location.photo_url}
                      alt={location.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 208px"
                      style={{ objectFit: "cover" }}
                      quality={80}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#231F1E]/05 flex flex-col items-center justify-center gap-2 text-[#231F1E]/30">
                      <MapPinIcon className="size-8" />
                      <span className="text-xs">No photo yet</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h2 className="font-display text-xl">{location.name}</h2>
                    {/* WhatsApp join button */}
                    {location.whatsapp_url && (
                      <a
                        href={location.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-medium hover:bg-[#1ebe5d] transition-colors shrink-0"
                      >
                        <WhatsAppIcon />
                        Join Group
                      </a>
                    )}
                  </div>

                  {location.address && (
                    <p className="text-sm text-[#231F1E]/60 mb-2">{location.address}</p>
                  )}
                  {location.description && (
                    <p className="text-sm text-[#231F1E]/70 leading-relaxed mb-3">{location.description}</p>
                  )}

                  {/* Supervisors */}
                  <div className="mt-auto pt-3 border-t border-[#231F1E]/10">
                    <p className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-2">
                      Youth Supervisors
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {locationSupervisors.length > 0 ? (
                        locationSupervisors.map((s) => (
                          <Link
                            key={s.id}
                            href={`/office-bearers#${s.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6B1F2A] text-white text-sm font-medium hover:bg-[#7d2432] transition-colors"
                          >
                            {s.photo_url && (
                              <Image
                                src={s.photo_url}
                                alt={s.name}
                                width={20}
                                height={20}
                                quality={75}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            )}
                            {s.name}
                          </Link>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#231F1E]/20 text-[#231F1E]/40 text-sm">
                          Not yet assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}