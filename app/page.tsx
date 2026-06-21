import HeroSlider from "@/components/HeroSlider";

const partnerLogos = [
  "https://picsum.photos/120/60?random=10",
  "https://picsum.photos/120/60?random=11",
  "https://picsum.photos/120/60?random=12",
  "https://picsum.photos/120/60?random=13",
];

export default function HomePage() {
  return (
    <main className="bg-white text-[#231F1E]">
      <HeroSlider />

      <section className="px-8 py-16 max-w-2xl">
        <h2 className="font-display text-2xl mb-4">Who We Are</h2>
        <p className="text-[#231F1E]/80 leading-relaxed">
          A community built on shared faith and shared ground — gathering for
          fellowship, supporting one another, and growing together year after
          year.
        </p>
      </section>

      <div className="woven-divider" />

      <section className="px-8 py-16">
        <h2 className="font-display text-2xl mb-6">News & Updates</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-[#231F1E]/10 rounded-lg p-5"
            >
              <p className="text-xs uppercase tracking-wide text-[#6B1F2A] mb-2">
                News
              </p>
              <h3 className="font-display text-lg mb-2">
                Sample news headline {i}
              </h3>
              <p className="text-sm text-[#231F1E]/70">
                Short preview of this news item will appear here once added by
                the admin.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 py-12 bg-[#F5F0E6] border-t border-[#231F1E]/10">
        <p className="text-center text-xs uppercase tracking-widest text-[#231F1E]/50 mb-6">
          In Partnership With
        </p>
        <div className="flex justify-center gap-10 flex-wrap items-center">
          {partnerLogos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Partner logo"
              className="h-10 opacity-70"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
