/**
 * Higher-order function that wraps an API route handler with rate limiting.
 *
 * Usage:
 *   import { withRateLimit } from "@/lib/api/with-rate-limit";
 *   export const POST = withRateLimit("public", async (request) => { ... });
 */
import { NextRequest, NextResponse } from "next/server";
import { getRateLimiter, getClientIp, type RateLimitTier } from "@/lib/rate-limiter";
import { errorResponse } from "@/lib/admin-api-utils";

type RouteHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> },
) => Promise<NextResponse>;

/**
 * Wraps a route handler with rate limiting.
 *
 * @param tier   Rate limit tier (auth, public, authenticated).
 * @param handler  The actual route handler.
 * @param getAccountId  Optional — extract the account/user identifier from the request for per-account limits.
 */
export function withRateLimit(
  tier: RateLimitTier,
  handler: RouteHandler,
  getAccountId?: (request: NextRequest) => string | undefined,
): RouteHandler {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    const ip = getClientIp(request);
    const endpoint = `${request.method}:${request.nextUrl.pathname}`;
    const accountId = getAccountId?.(request);

    const limiter = getRateLimiter();
    const result = limiter.check({ ip, endpoint, tier, accountId });

    if (!result.allowed) {
      const retryAfter = Math.ceil(result.retryAfter / 1000);
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          retryAfterSeconds: retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        },
      );
    }

    const response = await handler(request, context);

    // Attach rate-limit headers to the response
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    return response;
  };
}
