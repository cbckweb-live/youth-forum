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

const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

export default function ComingSoonContent() {
  const [launching, setLaunching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDetectedRef = useRef(false);

  // Prefetch the homepage immediately so it's cached well before launch
  // Uses plain fetch (not router.prefetch) for easy Network-tab verification.
  useEffect(() => {
    fetch("/", { cache: "force-cache" }).catch(() => {
      // Silently ignore — this is just a warm-up, not required for the reveal.
    });
  }, []);

  // Extracted polling logic so it can be restarted after a revert
  function startPolling() {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/launch-status", { cache: "no-store" });
        const data: { launched: boolean } = await res.json();
        const currentlyLaunched = data.launched === true;

        // Only trigger the animation on a false → true transition.
        // After reverting, lastDetectedRef still holds true so the next
        // poll with the same value skips — the revert actually sticks.
        if (currentlyLaunched && !lastDetectedRef.current) {
          setLaunching(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          navTimeoutRef.current = setTimeout(() => {
            window.location.href = "/";
          }, prefersReducedMotion ? 100 : 2500);
        }

        lastDetectedRef.current = currentlyLaunched;
      } catch {
        // Ignore polling errors — the endpoint defaults to { launched: false }
      }
    }, 1500);
  }

  function handleRevert() {
    // Cancel the pending navigation
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = null;
    }
    // Reset the launching state — animations revert via their transitions
    setLaunching(false);
    // Restart polling so it can detect a future real launch
    // lastDetectedRef still holds true, so the next poll with the same
    // value skips — the revert actually sticks.
    startPolling();
  }

  useEffect(() => {
    startPolling();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  // Inline transition values to avoid Tailwind arbitrary class scanning issues
  // Respects prefers-reduced-motion: if active, skip animation (jump straight to open state)
  const curtainTransition = prefersReducedMotion
    ? "none"
    : "transform 2500ms cubic-bezier(.76,0,.24,1)";
  const lightTransition = prefersReducedMotion
    ? "none"
    : "opacity 1000ms ease-in, transform 2500ms cubic-bezier(.76,0,.24,1)";
  const contentTransition = prefersReducedMotion
    ? "none"
    : "opacity 800ms ease-in-out";

  return (
    <main
      className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
      style={{ perspective: "1800px" }}
    >
      {/* Decorative gradient orbs — warmed for light bg */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#6B1F2A]/8 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#C9A84C]/10 blur-3xl" aria-hidden="true" />

      {/* Warm light behind curtains — fades and scales in as curtains draw back */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #C9A84C 0%, #fff8e7 40%, transparent 65%)",
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

      {/* Content — sits above curtains as a white card so text never overlaps the dark fabric */}
      <div
        className="max-w-lg w-full relative z-30 bg-white rounded-2xl px-10 py-12 shadow-lg space-y-10"
        style={{
          opacity: launching ? 0 : 1,
          transition: contentTransition,
        }}
      >
        <div>
          <span className="px-4 py-1.5 bg-[#6B1F2A] text-white text-xs font-semibold rounded-full tracking-wider uppercase">
            Something Big Is Coming
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-black/80 font-semibold">
            CBCK Youth Ministry
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight text-black">
            Coming Soon
          </h1>
          <div className="w-16 h-px mx-auto bg-[#C9A84C]" aria-hidden="true" />
          <p className="text-base text-black/80 max-w-sm mx-auto leading-relaxed">
            An exciting new platform for youth engagement is on its way. Stay tuned!
          </p>
        </div>

        {/* Event Details */}
        <div className="border-t border-black/10 pt-6">
          <p className="text-xs font-bold text-[#6B1F2A] uppercase tracking-widest">
            Official Launch Event
          </p>
          <p className="font-display text-2xl font-bold text-black mt-2">
            16 August 2026
          </p>
        </div>
      </div>
      {/* Revert button — visible only after launching so the curtain
          animation can be tested and reset before the live event. */}
      {launching && (
        <button
          onClick={handleRevert}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 text-xs font-medium tracking-wider uppercase rounded-full bg-[#6B1F2A] text-white shadow-lg hover:bg-[#5a1a23] transition-colors opacity-70 hover:opacity-100"
        >
          Revert
        </button>
      )}
    </main>
  );
}
