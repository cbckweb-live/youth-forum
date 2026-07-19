"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function OfficeBearerDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OfficeBearerDetailError]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="px-8 py-16 max-w-2xl mx-auto text-center dark:text-[#e5e5e5]">
      <Link
        href="/office-bearers"
        className="text-sm text-[#6B1F2A] dark:text-[#B84C5C] hover:underline mb-8 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
      >
        ← Back to Office Bearers
      </Link>

      <div className="mt-12">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#6B1F2A]/10 dark:bg-[#B84C5C]/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-[#6B1F2A] dark:text-[#B84C5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl mb-3 dark:text-[#f0f0f0]">Unable to Load Profile</h1>
        <p className="text-[#231F1E]/60 dark:text-gray-400 max-w-sm mx-auto leading-relaxed mb-8">
          Something went wrong while loading this profile. Please try again or browse our leadership directory.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#6B1F2A] hover:bg-[#7d2432] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
          >
            Try Again
          </button>
          <Link
            href="/office-bearers"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#231F1E]/70 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
          >
            View All Office Bearers
          </Link>
        </div>
      </div>
    </div>
  );
}
