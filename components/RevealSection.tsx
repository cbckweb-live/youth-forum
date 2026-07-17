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

export default function RevealSection({
  children,
  className = "",
  delay = 0,
  as: Tag = "section",
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If the user prefers reduced motion, just show immediately
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    let timerId: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Small delay for staggering
          timerId = setTimeout(() => setRevealed(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [delay]);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      id={id}
      className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        revealed
          ? "opacity-100 translate-y-0 blur-0"
          : "opacity-0 translate-y-10 blur-[2px]"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
