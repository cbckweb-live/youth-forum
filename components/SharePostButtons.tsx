'use client';

import { useState } from "react";

type SharePostButtonsProps = {
  title: string;
  url: string;
  compact?: boolean;
};

export default function SharePostButtons({ title, url, compact = false }: SharePostButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareTitle = title.trim();
  const pageUrl = url.trim();

  async function handleShare() {
    const currentUrl = pageUrl;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: currentUrl });
        return;
      } catch {
        // Fall back to copy link below.
      }
    }

    await handleCopyLink(currentUrl);
  }

  async function handleCopyLink(currentUrl: string = pageUrl) {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!pageUrl) return null;

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center rounded-full font-medium text-white transition-colors ${
        compact
          ? "bg-[#6B1F2A]/80 dark:bg-[#8a2836]/80 px-3 py-1 text-xs hover:bg-[#6B1F2A] dark:hover:bg-[#8a2836]"
          : "bg-[#6B1F2A] dark:bg-[#8a2836] px-4 py-2 text-sm hover:bg-[#571824] dark:hover:bg-[#7d2432]"
      }`}
    >
      {copied ? (
        "✓ Copied"
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`inline-block ${compact ? "h-3 w-3" : "h-4 w-4"}`}
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="ml-1.5">Share</span>
        </>
      )}
    </button>
  );
}