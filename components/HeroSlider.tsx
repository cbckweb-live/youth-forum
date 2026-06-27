"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

const images = [
  "https://emsfthlfptmysgzpectv.supabase.co/storage/v1/object/public/media/Events/A7402285.jpg",
  "https://emsfthlfptmysgzpectv.supabase.co/storage/v1/object/public/media/Events/DSCF5603.JPG",
  "https://emsfthlfptmysgzpectv.supabase.co/storage/v1/object/public/media/Events/DSCF4958.JPG",
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX;

    if (startX === null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (typeof endX !== "number") return;
    const deltaX = endX - startX;
    const threshold = 45;
    if (deltaX > threshold) prev();
    else if (deltaX < -threshold) next();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full max-w-6xl mx-auto h-[220px] sm:h-[320px] md:h-[420px] rounded-xl border border-white/40 bg-white/30 backdrop-blur-sm shadow-lg overflow-hidden p-1 touch-pan-y"
    >
      <Image
        src={images[index]}
        alt="Community highlight"
        fill
        sizes="100vw"
        style={{ objectFit: "cover" }}
        quality={85}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
        }}
      />

      <button
        onClick={prev}
        aria-label="Previous image"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
      >
        <ChevronLeftIcon className="size-8" />
      </button>
      <button
        onClick={next}
        aria-label="Next image"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
      >
        <ChevronRightIcon className="size-8" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
