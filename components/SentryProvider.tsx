"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * SentryProvider initializes the Sentry SDK in the browser.
 *
 * Must be rendered inside a client boundary (i.e., not in a Server Component).
 * Place it near the root of your component tree (e.g., in the root layout).
 *
 * The @sentry/nextjs webpack plugin (withSentryConfig) is not compatible with
 * Next.js 16's Turbopack bundler, so we initialize Sentry manually here instead.
 */
export default function SentryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

    if (dsn && typeof window !== "undefined") {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 1.0,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        debug: false,
      });
    }
  }, []);

  return <>{children}</>;
}
