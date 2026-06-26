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
                       quality={100}
                     />
                  ) : (
                    <div className="w-full h-full bg-[#231F1E]/05 flex flex-col items-center justify-center gap-2 text-[#231F1E]/30">
                      <MapPinIcon className="size-8" />
                      <span className="text-xs">No photo yet</span>
                    </div>
                  )}
                  {/* Number badge removed */}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h2 className="font-display text-xl mb-1">{location.name}</h2>
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
                                quality={100}
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
