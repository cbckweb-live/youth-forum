"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function BlogDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[BlogDetailError]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="px-4 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto text-center dark:text-[#e5e5e5]">
      <Link
        href="/about/blog-news"
        className="text-sm text-[#6B1F2A] dark:text-[#B84C5C] hover:underline mb-8 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
      >
        ← Back to Blog & News
      </Link>

      <div className="mt-12">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#6B1F2A]/10 dark:bg-[#B84C5C]/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-[#6B1F2A] dark:text-[#B84C5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl mb-3 dark:text-[#f0f0f0]">Unable to Load Post</h1>
        <p className="text-[#231F1E]/60 dark:text-gray-400 max-w-sm mx-auto leading-relaxed mb-8">
          Something went wrong while loading this post. Please try again or browse our other articles.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#6B1F2A] hover:bg-[#7d2432] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
          >
            Try Again
          </button>
          <Link
            href="/about/blog-news"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#231F1E]/70 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
          >
            Browse All Posts
          </Link>
        </div>
      </div>
    </div>
  );
}
