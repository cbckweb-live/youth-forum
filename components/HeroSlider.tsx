"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

const images = [
  "https://emsfthlfptmysgzpectv.supabase.co/storage/v1/object/public/media/Hero%20Slider/AA7402285.webp",
  "https://emsfthlfptmysgzpectv.supabase.co/storage/v1/object/public/media/Hero%20Slider/slider.webp",
  "https://emsfthlfptmysgzpectv.supabase.co/storage/v1/object/public/media/Hero%20Slider/DSCF4958.webp",
  "https://emsfthlfptmysgzpectv.supabase.co/storage/v1/object/public/media/Hero%20Slider/Heroslider.webp",
];

const FADE_DURATION = 700;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const transitioning = prevIndex !== null;

  /* Detect reduced motion preference during first render (no flash) */
  const [reducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    // If reduced motion, don't auto-advance at all
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const prev = () =>
    setIndex((i) => {
      const next = (i - 1 + images.length) % images.length;
      const prev = i;
      setTimeout(
        () => setPrevIndex((p) => (p === prev ? null : p)),
        FADE_DURATION,
      );
      return next;
    });

  const next = () =>
    setIndex((i) => {
      const n = (i + 1) % images.length;
      const prev = i;
      setTimeout(
        () => setPrevIndex((p) => (p === prev ? null : p)),
        FADE_DURATION,
      );
      return n;
    });

  const goTo = (target: number) =>
    setIndex((current) => {
      if (current === target) return current;
      const prev = current;
      setTimeout(
        () => setPrevIndex((p) => (p === prev ? null : p)),
        FADE_DURATION,
      );
      return target;
    });

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

  const transitionStyle = reducedMotion
    ? "none"
    : `opacity ${FADE_DURATION}ms cubic-bezier(0.32,0.72,0,1)`;

  /* Determine which images are active vs fading out */
  const imageState = (i: number): { opacity: number; zIndex: number; hidden: boolean } => {
    if (i === index && !transitioning) {
      // Steady state — current image fully visible
      return { opacity: 1, zIndex: 3, hidden: false };
    }
    if (i === index && transitioning) {
      // Incoming image — fade in behind the outgoing one
      return { opacity: 1, zIndex: 1, hidden: false };
    }
    if (i === prevIndex && transitioning) {
      // Outgoing image — stays on top while fading out
      return { opacity: 0, zIndex: 3, hidden: false };
    }
    // All others — hidden
    return { opacity: 0, zIndex: 0, hidden: true };
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-live="polite"
      className="relative w-full max-w-6xl mx-auto h-[220px] sm:h-[320px] md:h-[420px] rounded-xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-black/40 backdrop-blur-sm shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden p-1 touch-pan-y"
    >
      {/* ── Stacked images with true crossfade ── */}
      {images.map((src, i) => {
        const state = imageState(i);
        return (
          <div
            key={i}
            className="absolute inset-0 rounded-xl overflow-hidden"
            aria-hidden={state.hidden}
            style={{
              opacity: state.opacity,
              transition: transitionStyle,
              zIndex: state.zIndex,
            }}
          >
            <Image
              src={src}
              alt={!state.hidden ? "Community highlight" : ""}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1080px) 100vw, 56vw"
              style={{ objectFit: "cover" }}
              quality={85}
              priority
              unoptimized
            />
          </div>
        );
      })}

      {/* ── Gradient overlay for visual depth ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.20) 0%, transparent 40%)",
          zIndex: 10,
        }}
        aria-hidden="true"
      />

      <button
        onClick={prev}
        aria-label="Previous image"
        className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-10 p-3 sm:p-2 text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-6 sm:size-8" />
      </button>
      <button
        onClick={next}
        aria-label="Next image"
        className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-10 p-3 sm:p-2 text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <ChevronRightIcon aria-hidden="true" className="size-6 sm:size-8" />
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${i === index ? "bg-white" : "bg-white/40"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
