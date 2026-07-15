// This route intentionally throws to test Sentry's auto-instrumentation.
// withSentryConfig in next.config.ts automatically captures unhandled
// errors in API routes without any manual try/catch.

export async function GET() {
  throw new Error("Sentry test error from server API route");
}
