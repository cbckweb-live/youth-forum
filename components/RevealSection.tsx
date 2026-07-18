"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before the animation starts (for staggered sequencing). */
  delay?: number;
  /** Tag to render — default <section>, can be <div> if needed. */
  as?: "section" | "div";
  /** Optional HTML id for anchor link targeting. */
  id?: string;
};

const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

/**
 * A scroll-reveal wrapper that animates only compositor-friendly
 * properties (opacity + translateY) and avoids expensive CSS filters
 * for smooth 60fps scrolling even with many instances on a page.
 */
export default function RevealSection({
  children,
  className = "",
  delay = 0,
  as: Tag = "section",
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(prefersReducedMotion);
  const observedRef = useRef(false);

  useEffect(() => {
    // Already revealed (initial render for reduced motion, or unmount/remount).
    if (revealed) return;

    const el = ref.current;
    if (!el || observedRef.current) return;

    observedRef.current = true;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.unobserve(el);

        // Small delay for staggering sequences
        timeoutId = setTimeout(() => {
          setRevealed(true);
        }, delay);
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(el);

    return () => {
      observedRef.current = false;
      observer.disconnect();
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      id={id}
      style={{ willChange: revealed ? "auto" : "transform, opacity" }}
      className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        revealed
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
