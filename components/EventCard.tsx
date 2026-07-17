"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface EventCardProps {
  title: string;
  event_date: string;
  event_end_date?: string | null;
  description?: string | null;
  image_url?: string | null;
}

export default function EventCard({
  title,
  event_date,
  event_end_date,
  description,
  image_url,
}: EventCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const container = lightboxRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [lightboxOpen]);

  return (
    <>
      <div className="flex items-stretch gap-6 border border-[#231F1E]/10 dark:border-white/10 rounded-2xl p-6 shadow-md bg-white dark:bg-[#1e1e1e] hover:shadow-lg dark:hover:shadow-[0_6px_30px_rgba(0,0,0,0.4)] transition-shadow">
        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-widest text-[#6B1F2A] dark:text-[#B84C5C] mb-2">
            {new Date(event_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            {event_end_date && event_end_date !== event_date && (
              <> — {new Date(event_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</>
            )}
          </p>
          <h3 className="font-display text-2xl leading-snug mb-3">{title}</h3>
          {description && (
            <p className="text-base text-[#231F1E]/70 dark:text-gray-400 line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Thumbnail on the right */}
        {image_url && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            ref={triggerRef}
            className="flex-shrink-0 w-36 h-36 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] relative"
            aria-label="Enlarge image"
          >
              <Image
                src={image_url}
                alt={title}
                fill
                sizes="(max-width: 640px) 144px, (max-width: 1080px) 144px, 144px"
                style={{ objectFit: "cover" }}
                unoptimized
                loading="lazy"
              />
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && image_url && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              ref={closeButtonRef}
              className="absolute -top-10 right-0 text-white text-sm hover:underline z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded"
            >
              Close ✕
            </button>
            <div className="relative w-full h-[70vh] max-h-[400px]">
              <Image
                src={image_url}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1080px) 90vw, 75vw"
                style={{ objectFit: "contain" }}
                unoptimized
                loading="lazy"
              />
            </div>
            <p className="text-white text-center mt-3 font-display text-lg">
              {title}
            </p>
          </div>
        </div>
      )}
    </>
  );
}