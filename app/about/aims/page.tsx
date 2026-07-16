import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aims and Goals | CBCK Youth Forum",
  description: "Our community aims and goals — what we strive toward together as one community.",
  openGraph: {
    title: "Aims and Goals | CBCK Youth Forum",
    description: "What we strive toward together as one community.",
  },
};

const aims = [
  {
    title: "Worship",
    description:
      "To create an atmosphere where young people can encounter God through vibrant, reverent worship that speaks to their hearts and draws them closer to Him.",
  },
  {
    title: "Discipleship",
    description:
      "To nurture spiritual growth through the study of God's Word, prayer, and mentoring relationships that build a strong foundation of faith.",
  },
  {
    title: "Fellowship",
    description:
      "To cultivate a welcoming community where young believers can form meaningful connections, support one another, and grow together in Christ.",
  },
  {
    title: "Leadership",
    description:
      "To identify, equip, and raise up the next generation of godly leaders who will serve the church and impact their communities for Christ.",
  },
  {
    title: "Service",
    description:
      "To encourage a heart of compassion and service, reaching out to the local community and beyond with the love of Christ in practical ways.",
  },
];

export default function AimsPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="px-6 py-20 sm:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-[#C9A84C] mb-4 font-semibold">
            Our Purpose
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#f7f3ea] mb-4">
            Aims &amp; Goals
          </h1>
          <div className="w-16 h-px mx-auto bg-[#C9A84C]/50 mb-6" aria-hidden="true" />
          <p className="text-lg text-[#f7f3ea]/80 leading-relaxed max-w-xl mx-auto">
            What we strive toward, together, as one community rooted in faith and purpose.
          </p>
        </div>
      </section>

      {/* Aims grid */}
      <section className="px-6 py-16 sm:py-20 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-6">
          {aims.map((aim, i) => (
            <div
              key={aim.title}
              className="rounded-2xl p-6 sm:p-8 bg-white/40 backdrop-blur-sm border border-white/50 shadow-md"
            >
              <p className="text-xs font-bold text-[#6B1F2A] mb-3">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="font-display text-xl mb-3">{aim.title}</h2>
              <p className="text-sm text-[#231F1E]/70 leading-relaxed">
                {aim.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Woven divider */}
      <div className="woven-divider" aria-hidden="true" />

      {/* Closing */}
      <section className="px-6 py-16 text-center bg-[#f7f3ea]">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-2xl mb-3">Joined in Mission</h2>
          <p className="text-sm text-[#231F1E]/70 leading-relaxed">
            These aims guide everything we do. Whether through worship, discipleship, or service,
            our goal is to see young lives transformed by the love of Christ and equipped to make
            a difference in the world around them.
          </p>
        </div>
      </section>
    </main>
  );
}
