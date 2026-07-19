"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
    Sentry.captureException(error);
  }, [error]);

  const isSupabaseError =
    error.message?.toLowerCase().includes("supabase") ||
    error.message?.toLowerCase().includes("fetch failed") ||
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("failed to fetch");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
      {/* Icon */}
      <div className="w-16 h-16 mb-6 rounded-full bg-[#6B1F2A]/10 dark:bg-[#B84C5C]/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-[#6B1F2A] dark:text-[#B84C5C]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="font-display text-2xl sm:text-3xl mb-3 dark:text-[#f0f0f0]">
        {isSupabaseError
          ? "Service Temporarily Unavailable"
          : "Something Went Wrong"}
      </h1>

      {/* Description */}
      <p className="text-[#231F1E]/60 dark:text-gray-400 max-w-md leading-relaxed mb-8">
        {isSupabaseError
          ? "We're having trouble connecting to our services. This is usually temporary — please try again in a moment."
          : "An unexpected error occurred while loading this page. Our team has been notified."}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#6B1F2A] hover:bg-[#7d2432] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0a9 9 0 0 1 16.456-5.375M2.985 19.644a9 9 0 0 0 16.456-5.376" />
          </svg>
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-[#231F1E]/70 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151515]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Go Home
        </Link>
      </div>

      {/* Error digest (for support) */}
      {error.digest && (
        <p className="mt-8 text-xs text-[#231F1E]/30 dark:text-gray-500">
          Error reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
