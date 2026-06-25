"use client";

import { useState } from "react";
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

  return (
    <>
      <div className="flex items-stretch gap-6 border border-[#231F1E]/10 rounded-2xl p-6 shadow-md bg-white hover:shadow-lg transition-shadow">
        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-widest text-[#6B1F2A] mb-2">
            {new Date(event_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            {event_end_date && event_end_date !== event_date && (
              <> — {new Date(event_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</>
            )}
          </p>
          <h3 className="font-display text-2xl leading-snug mb-3">{title}</h3>
          {description && (
            <p className="text-base text-[#231F1E]/70 line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Thumbnail on the right */}
        {image_url && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="flex-shrink-0 w-36 h-36 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]"
            aria-label="Enlarge image"
          >
            <Image 
              src={image_url}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
            />
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && image_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white text-sm hover:underline"
            >
              Close ✕
            </button>
            <Image 
              src={image_url}
              alt={title}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white text-center mt-3 font-display text-lg">
              {title}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
