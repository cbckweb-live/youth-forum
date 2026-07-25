"use client";

import { useEffect, useState, useRef } from "react";

export default function ComingSoonContent() {
  const [launching, setLaunching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/launch-status", { cache: "no-store" });
        const data: { launched: boolean } = await res.json();
        if (data.launched === true) {
          setLaunching(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => {
            window.location.href = "/";
          }, 1400);
        }
      } catch {
        // Ignore polling errors — the endpoint defaults to { launched: false }
      }
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <main
      className="min-h-screen bg-[#1c1b1a] text-[#f7f3ea] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
      style={{ perspective: "1800px" }}
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#6B1F2A]/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#C9A84C]/10 blur-3xl" aria-hidden="true" />

      {/* Left door panel — rotates outward (left hinge) */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 bg-[#1c1b1a] z-20 transition-transform duration-[1400ms] ease-[cubic-bezier(.76,0,.24,1)]"
        style={{
          transformOrigin: "left center",
          transform: launching ? "rotateY(-100deg)" : "rotateY(0deg)",
          backfaceVisibility: "hidden",
        }}
        aria-hidden="true"
      />

      {/* Right door panel — rotates outward (right hinge) */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-[#1c1b1a] z-20 transition-transform duration-[1400ms] ease-[cubic-bezier(.76,0,.24,1)]"
        style={{
          transformOrigin: "right center",
          transform: launching ? "rotateY(100deg)" : "rotateY(0deg)",
          backfaceVisibility: "hidden",
        }}
        aria-hidden="true"
      />

      {/* Content — sits above doors in z-index, fades out cleanly when launching */}
      <div
        className="max-w-md space-y-8 relative z-30 transition-opacity duration-500 ease-in-out"
        style={{ opacity: launching ? 0 : 1 }}
      >
        <div>
          <span className="px-4 py-1.5 bg-[#6B1F2A]/20 border border-[#6B1F2A]/30 text-[#C9A84C] text-xs font-semibold rounded-full tracking-wider uppercase">
            Something Big Is Coming
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f7f3ea]/50">
            CBCK Youth Ministry
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight text-[#f7f3ea]">
            Coming Soon
          </h1>
          <div className="w-16 h-px mx-auto bg-[#C9A84C]/50" aria-hidden="true" />
          <p className="text-base text-[#f7f3ea]/60 max-w-sm mx-auto leading-relaxed">
            An exciting new platform for youth engagement is on its way. Stay tuned!
          </p>
        </div>

        {/* Event Details */}
        <div className="border-t border-[#f7f3ea]/10 pt-6">
          <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest">
            Official Launch Event
          </p>
          <p className="font-display text-2xl font-bold text-[#f7f3ea] mt-2">
            26 July 2026
          </p>
        </div>
      </div>
    </main>
  );
}
