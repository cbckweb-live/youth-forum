// Next.js 16 instrumentation — called at server startup.
// This replaces the @sentry/nextjs webpack plugin (withSentryConfig)
// which is incompatible with Next.js 16's Turbopack bundler.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  // Sentry SDK auto-detects the runtime (nodejs vs edge) internally.
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 1.0,
    debug: false,
  });
}

// Captures unhandled request errors via Next.js 16's native instrumentation.
export const onRequestError = Sentry.captureRequestError;
