"use client";

/**
 * This page must be rehearsed on the actual event device/network before
 * go-live day. Polling interval is intentionally fast (1.5s) for live-event
 * responsiveness.
 *
 * ── Live-event reliability notes ──
 * - A plain fetch("/", { cache: "force-cache" }) runs on mount so the
 *   homepage is cached early (verifiable in the Network tab).
 * - Polling is 1500ms (not the usual 5s) so the LCD device reacts quickly.
 * - All animations use inline style transforms (not Tailwind arbitrary classes)
 *   to guarantee they apply regardless of build-time class scanning.
 * - Navigation at the end uses window.location.href (not the Next.js router)
 *   so the edge middleware (proxy.ts) re-evaluates the launch gate correctly.
 */

import { useEffect, useState, useRef } from "react";

export default function ComingSoonContent() {
  const [launching, setLaunching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prefetch the homepage immediately so it's cached well before launch
  // Uses plain fetch (not router.prefetch) for easy Network-tab verification.
  useEffect(() => {
    fetch("/", { cache: "force-cache" }).catch(() => {
      // Silently ignore — this is just a warm-up, not required for the reveal.
    });
  }, []);

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
          }, 2500);
        }
      } catch {
        // Ignore polling errors — the endpoint defaults to { launched: false }
      }
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Inline transition values to avoid Tailwind arbitrary class scanning issues
  const curtainTransition = "transform 2500ms cubic-bezier(.76,0,.24,1)";
  const lightTransition = "opacity 1000ms ease-in, transform 2500ms cubic-bezier(.76,0,.24,1)";
  const contentTransition = "opacity 800ms ease-in-out";

  return (
    <main
      className="min-h-screen bg-[#f7f3ea] text-[#2c2416] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
      style={{ perspective: "1800px" }}
    >
      {/* Decorative gradient orbs — warmed for light bg */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#6B1F2A]/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#C9A84C]/15 blur-3xl" aria-hidden="true" />

      {/* Warm light behind curtains — fades and scales in as curtains draw back */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #C9A84C 0%, #f7f3ea 40%, transparent 70%)",
          opacity: launching ? 1 : 0,
          transform: launching ? "scale(1.3)" : "scale(0.8)",
          transition: lightTransition,
        }}
        aria-hidden="true"
      />

      {/* Left curtain panel — fabric gradient + gold trim + tassel */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 z-20"
        style={{
          transformOrigin: "left center",
          transform: launching
            ? "translateX(-110%) rotateY(15deg)"
            : "translateX(0%) rotateY(0deg)",
          transition: curtainTransition,
          willChange: "transform",
        }}
        aria-hidden="true"
      >
        {/* Fabric background with vertical fold pattern */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(90deg, #6B1F2A 0px, #5a1a23 8px, #6B1F2A 16px)",
          }}
        />
        {/* Gold trim on the inner (right) edge */}
        <div className="absolute right-0 inset-y-0 w-0.5 bg-[#C9A84C]" />
        {/* Gold decorative tassel at bottom-inner corner */}
        <div
          className="absolute bottom-4 right-[-6px] rounded-full bg-[#C9A84C]"
          style={{ width: "12px", height: "12px" }}
        />
      </div>

      {/* Right curtain panel — fabric gradient + gold trim + tassel */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 z-20"
        style={{
          transformOrigin: "right center",
          transform: launching
            ? "translateX(110%) rotateY(-15deg)"
            : "translateX(0%) rotateY(0deg)",
          transition: curtainTransition,
          willChange: "transform",
        }}
        aria-hidden="true"
      >
        {/* Fabric background with vertical fold pattern */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(90deg, #6B1F2A 0px, #5a1a23 8px, #6B1F2A 16px)",
          }}
        />
        {/* Gold trim on the inner (left) edge */}
        <div className="absolute left-0 inset-y-0 w-0.5 bg-[#C9A84C]" />
        {/* Gold decorative tassel at bottom-inner corner */}
        <div
          className="absolute bottom-4 left-[-6px] rounded-full bg-[#C9A84C]"
          style={{ width: "12px", height: "12px" }}
        />
      </div>

      {/* Content — sits above curtains in z-index, fades out cleanly when launching */}
      <div
        className="max-w-md space-y-10 relative z-30"
        style={{
          opacity: launching ? 0 : 1,
          transition: contentTransition,
        }}
      >
        <div>
          <span className="px-4 py-1.5 bg-[#6B1F2A]/15 border border-[#6B1F2A]/30 text-[#C9A84C] text-xs font-semibold rounded-full tracking-wider uppercase">
            Something Big Is Coming
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[#2c2416]/70">
            CBCK Youth Ministry
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight text-[#2c2416]">
            Coming Soon
          </h1>
          <div className="w-16 h-px mx-auto bg-[#C9A84C]/60" aria-hidden="true" />
          <p className="text-base text-[#2c2416]/80 max-w-sm mx-auto leading-relaxed">
            An exciting new platform for youth engagement is on its way. Stay tuned!
          </p>
        </div>

        {/* Event Details */}
        <div className="border-t border-[#2c2416]/10 pt-6">
          <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest">
            Official Launch Event
          </p>
          <p className="font-display text-2xl font-bold text-[#2c2416] mt-2">
            16 August 2026
          </p>
        </div>
      </div>
    </main>
  );
}
