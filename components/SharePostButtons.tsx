'use client';

import { useState } from "react";

type SharePostButtonsProps = {
  title: string;
  url: string;
};

export default function SharePostButtons({ title, url }: SharePostButtonsProps) {
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
      className="inline-flex items-center justify-center rounded-full bg-[#6B1F2A] dark:bg-[#8a2836] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#571824] dark:hover:bg-[#7d2432]"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}