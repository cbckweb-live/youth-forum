import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aims and Goals | CBCK Youth Forum",
  description: "Our community aims and goals — what we strive toward together as one community.",
  openGraph: {
    title: "Aims and Goals | CBCK Youth Forum",
    description: "What we strive toward together as one community.",
  },
};

export default function AimsPage() {
  return (
    <main className="px-8 py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-4">Aims and Goals</h1>
      <p className="text-[#231F1E]/80 leading-relaxed">
        Our community aims and goals will be written here.
      </p>
    </main>
  );
}
